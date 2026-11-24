import { ScheduleItem, Teacher, Classroom, StudentGroup, CourseEnrollment } from "./types";
import {
  checkTeacherOverlap,
  checkRoomOverlap,
  checkStudentGroupOverlap,
  checkBreakAndLockedSlots,
  checkTeacherAvailability,
  calculateSoftPenalties,
  HardViolation,
  SoftPenalty,
  HARD_PENALTY_WEIGHT,
  BREAK_PERIOD
} from "./constraints";

export interface ValidationReport {
  isValid: boolean;
  status: "FEASIBLE_OPTIMAL" | "FEASIBLE_SUBOPTIMAL" | "INFEASIBLE_CONSTRAINTS" | "INVALID_INPUT";
  hardViolationsCount: number;
  hardViolations: HardViolation[];
  softPenaltyScore: number;
  softPenalties: SoftPenalty[];
  totalFitness: number;
  completionRate: number; // percentage (0 - 100)
  totalRequiredSlots: number;
  totalScheduledSlots: number;
  summary: string;
}

export class IndependentValidator {
  /**
   * Validate entire timetable schedule against all hard and soft constraints.
   */
  public static validateSchedule(
    items: ScheduleItem[],
    enrollments: CourseEnrollment[],
    teachers: Teacher[],
    classrooms: Classroom[],
    studentGroups: StudentGroup[]
  ): ValidationReport {
    // 1. Calculate required vs scheduled
    const totalRequiredSlots = enrollments.reduce((sum, e) => sum + e.periodsPerWeek, 0);
    const totalScheduledSlots = items.length;
    const completionRate = totalRequiredSlots > 0 
      ? Math.min(100, Math.round((totalScheduledSlots / totalRequiredSlots) * 100)) 
      : 100;

    // 2. Check all Hard Constraints
    const hardViolations: HardViolation[] = [
      ...checkTeacherOverlap(items),
      ...checkRoomOverlap(items),
      ...checkStudentGroupOverlap(items),
      ...checkBreakAndLockedSlots(items),
      ...checkTeacherAvailability(items, teachers),
    ];

    // Period completeness check
    if (totalScheduledSlots < totalRequiredSlots) {
      hardViolations.push({
        code: "HARD_PERIOD_COMPLETENESS",
        message: `จัดคาบเรียนไม่ครบตามแผนการเรียน (จัดได้ ${totalScheduledSlots} จาก ${totalRequiredSlots} คาบ, คิดเป็น ${completionRate}%)`,
        itemIds: [],
        severity: "CRITICAL"
      });
    }

    // 3. Check Soft Constraints
    const softPenalties = calculateSoftPenalties(items, teachers, studentGroups);
    const softPenaltyScore = softPenalties.reduce((sum, p) => sum + p.penaltyScore, 0);

    // 4. Calculate Total Fitness
    const hardCount = hardViolations.length;
    const totalFitness = Math.max(0, 1000000 - (hardCount * HARD_PENALTY_WEIGHT) - softPenaltyScore);

    // 5. Determine Status
    let status: ValidationReport["status"] = "FEASIBLE_OPTIMAL";
    if (hardCount > 0 || completionRate < 100) {
      status = "INFEASIBLE_CONSTRAINTS";
    } else if (softPenaltyScore > 500) {
      status = "FEASIBLE_SUBOPTIMAL";
    }

    const summary = hardCount === 0 && completionRate === 100
      ? `ตารางสมบูรณ์แบบ ปราศจากข้อขัดแย้ง (Zero Conflict) ครบ ${totalScheduledSlots}/${totalRequiredSlots} คาบ (คะแนน Soft Penalty: ${softPenaltyScore})`
      : `พบข้อผิดพลาด Hard Violations ${hardCount} จุด และจัดได้ ${totalScheduledSlots}/${totalRequiredSlots} คาบ (${completionRate}%)`;

    return {
      isValid: hardCount === 0 && completionRate === 100,
      status,
      hardViolationsCount: hardCount,
      hardViolations,
      softPenaltyScore,
      softPenalties,
      totalFitness,
      completionRate,
      totalRequiredSlots,
      totalScheduledSlots,
      summary
    };
  }

  /**
   * Fast candidate check for drag-and-drop or click-to-swap on UI.
   * Returns null if placement is valid, or an error message if invalid.
   */
  public static validateCandidatePlacement(
    candidate: {
      id: string;
      teacherId: string;
      classroomId: string;
      studentGroupId: string;
      dayOfWeek: number;
      periodNumber: number;
    },
    allOtherItems: ScheduleItem[],
    teachers: Teacher[]
  ): { valid: boolean; reason?: string } {
    // 1. Break period check
    if (candidate.periodNumber === BREAK_PERIOD) {
      return { valid: false, reason: "ไม่สามารถวางคาบเรียนในเวลาพักกลางวัน (12:30 - 13:30) ได้" };
    }

    // 2. Teacher conflict
    const teacherConflict = allOtherItems.find(
      it => it.id !== candidate.id &&
            it.dayOfWeek === candidate.dayOfWeek &&
            it.periodNumber === candidate.periodNumber &&
            it.teacherId === candidate.teacherId
    );
    if (teacherConflict) {
      return { 
        valid: false, 
        reason: `ครูผู้สอนมีคาบสอนชนกับกลุ่ม ${teacherConflict.studentGroupCode} (วิชา ${teacherConflict.subjectCode}) ในคาบนี้` 
      };
    }

    // 3. Room conflict
    if (candidate.classroomId && candidate.classroomId !== "EXTERNAL") {
      const roomConflict = allOtherItems.find(
        it => it.id !== candidate.id &&
              it.dayOfWeek === candidate.dayOfWeek &&
              it.periodNumber === candidate.periodNumber &&
              it.classroomId === candidate.classroomId
      );
      if (roomConflict) {
        return { 
          valid: false, 
          reason: `ห้องเรียน ${roomConflict.roomCode} มีกลุ่ม ${roomConflict.studentGroupCode} ใช้งานอยู่แล้วในคาบนี้` 
        };
      }
    }

    // 4. Student group conflict
    const groupConflict = allOtherItems.find(
      it => it.id !== candidate.id &&
            it.dayOfWeek === candidate.dayOfWeek &&
            it.periodNumber === candidate.periodNumber &&
            it.studentGroupId === candidate.studentGroupId
    );
    if (groupConflict) {
      return { 
        valid: false, 
        reason: `กลุ่มเรียนนี้มีวิชา ${groupConflict.subjectCode} (${groupConflict.subjectNameTh}) เรียนอยู่แล้วในคาบนี้` 
      };
    }

    // 5. Teacher unavailable slots
    const teacher = teachers.find(t => t.id === candidate.teacherId);
    if (teacher?.unavailableSlots) {
      const isUnavailable = teacher.unavailableSlots.some(
        s => s.dayOfWeek === candidate.dayOfWeek && s.periodNumber === candidate.periodNumber
      );
      if (isUnavailable) {
        return { valid: false, reason: `ครูผู้สอนระบุเวลาไม่สะดวกสอนในวันและคาบนี้` };
      }
    }

    return { valid: true };
  }
}
