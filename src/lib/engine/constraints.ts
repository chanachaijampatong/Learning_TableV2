import { ScheduleItem, TimeSlot, Teacher, Classroom, StudentGroup, CourseEnrollment } from "./types";

export interface HardViolation {
  code: string;
  message: string;
  itemIds: string[];
  severity: "CRITICAL";
}

export interface SoftPenalty {
  code: string;
  message: string;
  penaltyScore: number;
}

export const HARD_PENALTY_WEIGHT = 50000;

export const STANDARD_PERIODS = [
  { period: 1, startTime: "08:30", endTime: "09:30", label: "คาบที่ 1" },
  { period: 2, startTime: "09:30", endTime: "10:30", label: "คาบที่ 2" },
  { period: 3, startTime: "10:30", endTime: "11:30", label: "คาบที่ 3" },
  { period: 4, startTime: "11:30", endTime: "12:30", label: "คาบที่ 4" },
  { period: 5, startTime: "12:30", endTime: "13:30", label: "พักกลางวัน (BREAK)" },
  { period: 6, startTime: "13:30", endTime: "14:30", label: "คาบที่ 5" },
  { period: 7, startTime: "14:30", endTime: "15:30", label: "คาบที่ 6" },
  { period: 8, startTime: "15:30", endTime: "16:30", label: "คาบที่ 7" },
  { period: 9, startTime: "16:30", endTime: "17:30", label: "คาบที่ 8 (กิจกรรม/PLC)" },
  { period: 10, startTime: "17:30", endTime: "18:30", label: "คาบที่ 9" },
];

export const BREAK_PERIOD = 5; // 12:30 - 13:30 is lunch break

export function checkTeacherOverlap(items: ScheduleItem[]): HardViolation[] {
  const violations: HardViolation[] = [];
  const map = new Map<string, ScheduleItem[]>();

  for (const item of items) {
    const key = `${item.dayOfWeek}_P${item.periodNumber}_T_${item.teacherId}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }

  for (const [key, group] of map.entries()) {
    if (group.length > 1) {
      violations.push({
        code: "HARD_TEACHER_OVERLAP",
        message: `ครู "${group[0].teacherName}" มีคาบสอนซ้ำซ้อนกันในวัน${group[0].dayOfWeek} คาบที่ ${group[0].periodNumber} (${group.map(g => g.studentGroupCode).join(", ")})`,
        itemIds: group.map(g => g.id),
        severity: "CRITICAL"
      });
    }
  }
  return violations;
}

export function checkRoomOverlap(items: ScheduleItem[]): HardViolation[] {
  const violations: HardViolation[] = [];
  const map = new Map<string, ScheduleItem[]>();

  for (const item of items) {
    // Only check if classroom is specified (not external or virtual)
    if (!item.classroomId || item.classroomId === "EXTERNAL") continue;
    const key = `${item.dayOfWeek}_P${item.periodNumber}_R_${item.classroomId}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }

  for (const [key, group] of map.entries()) {
    if (group.length > 1) {
      violations.push({
        code: "HARD_ROOM_OVERLAP",
        message: `ห้องเรียน "${group[0].roomCode}" มีคาบเรียนซ้ำซ้อนกันในวัน${group[0].dayOfWeek} คาบที่ ${group[0].periodNumber} (${group.map(g => `${g.studentGroupCode} - ${g.subjectCode}`).join(", ")})`,
        itemIds: group.map(g => g.id),
        severity: "CRITICAL"
      });
    }
  }
  return violations;
}

export function checkStudentGroupOverlap(items: ScheduleItem[]): HardViolation[] {
  const violations: HardViolation[] = [];
  const map = new Map<string, ScheduleItem[]>();

  for (const item of items) {
    const key = `${item.dayOfWeek}_P${item.periodNumber}_G_${item.studentGroupId}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }

  for (const [key, group] of map.entries()) {
    if (group.length > 1) {
      violations.push({
        code: "HARD_GROUP_OVERLAP",
        message: `กลุ่มเรียน "${group[0].studentGroupCode}" มีวิชาเรียนซ้ำซ้อนกันในวัน${group[0].dayOfWeek} คาบที่ ${group[0].periodNumber} (${group.map(g => g.subjectCode).join(", ")})`,
        itemIds: group.map(g => g.id),
        severity: "CRITICAL"
      });
    }
  }
  return violations;
}

export function checkBreakAndLockedSlots(items: ScheduleItem[]): HardViolation[] {
  const violations: HardViolation[] = [];
  for (const item of items) {
    if (item.periodNumber === BREAK_PERIOD) {
      violations.push({
        code: "HARD_LOCKED_BREAK_SLOT",
        message: `ไม่อนุญาตให้จัดคาบเรียนทับเวลาพักกลางวัน (คาบที่ ${BREAK_PERIOD}: 12:30-13:30) สำหรับกลุ่ม ${item.studentGroupCode} วิชา ${item.subjectCode}`,
        itemIds: [item.id],
        severity: "CRITICAL"
      });
    }
  }
  return violations;
}

export function checkTeacherAvailability(items: ScheduleItem[], teachers: Teacher[]): HardViolation[] {
  const violations: HardViolation[] = [];
  const teacherMap = new Map<string, Teacher>(teachers.map(t => [t.id, t]));

  for (const item of items) {
    const teacher = teacherMap.get(item.teacherId);
    if (!teacher || !teacher.unavailableSlots || teacher.unavailableSlots.length === 0) continue;

    const isUnavailable = teacher.unavailableSlots.some(
      slot => slot.dayOfWeek === item.dayOfWeek && slot.periodNumber === item.periodNumber
    );

    if (isUnavailable) {
      violations.push({
        code: "HARD_TEACHER_UNAVAILABLE",
        message: `ครู "${teacher.fullName}" ระบุไม่สะดวกสอนในวัน${item.dayOfWeek} คาบที่ ${item.periodNumber}`,
        itemIds: [item.id],
        severity: "CRITICAL"
      });
    }
  }
  return violations;
}

export function calculateSoftPenalties(items: ScheduleItem[], teachers: Teacher[], groups: StudentGroup[]): SoftPenalty[] {
  const penalties: SoftPenalty[] = [];

  // 1. Student Idle Gaps (ฟันหลอ)
  const groupDaySlots = new Map<string, number[]>();
  for (const item of items) {
    const key = `${item.studentGroupId}_D${item.dayOfWeek}`;
    if (!groupDaySlots.has(key)) groupDaySlots.set(key, []);
    groupDaySlots.get(key)!.push(item.periodNumber);
  }

  for (const [key, periods] of groupDaySlots.entries()) {
    periods.sort((a, b) => a - b);
    let gapCount = 0;
    for (let i = 0; i < periods.length - 1; i++) {
      const diff = periods[i + 1] - periods[i];
      // if gap > 1, check if the gap is just the lunch break
      if (diff > 1) {
        if (diff === 2 && (periods[i] === 4 && periods[i + 1] === 6)) {
          // Normal lunch break (period 5), not a real gap
          continue;
        }
        gapCount += (diff - 1);
      }
    }
    if (gapCount > 0) {
      penalties.push({
        code: "SOFT_STUDENT_IDLE_GAP",
        message: `กลุ่มเรียนมีคาบว่างระหว่างวัน ${gapCount} คาบ (${key})`,
        penaltyScore: gapCount * 50
      });
    }
  }

  // 2. Teacher Daily Load Balance (เกลี่ยภาระสอนไม่ให้เกิน 6 คาบต่อวัน)
  const teacherDayLoads = new Map<string, number>();
  for (const item of items) {
    const key = `${item.teacherId}_D${item.dayOfWeek}`;
    teacherDayLoads.set(key, (teacherDayLoads.get(key) || 0) + 1);
  }

  for (const [key, count] of teacherDayLoads.entries()) {
    if (count > 6) {
      const overload = count - 6;
      penalties.push({
        code: "SOFT_TEACHER_OVERLOAD",
        message: `ครูมีชั่วโมงสอนหนักเกินไปในวันเดียว (${count} คาบ/วัน)`,
        penaltyScore: overload * 40
      });
    }
  }

  return penalties;
}
