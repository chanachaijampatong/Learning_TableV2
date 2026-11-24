// Core Schema Interfaces for Learning-Time System

export type RoomType = "GENERAL" | "COMPUTER_LAB" | "SCIENCE_LAB" | "WORKSHOP" | "DRAWING" | "GYM";

export interface AcademicTerm {
  id: string; // e.g. "2569-2"
  academicYear: string; // "2569"
  semester: number; // 1 or 2
  name: string; // "ภาคเรียนที่ 2 ปีการศึกษา 2569"
  isActive: boolean;
  daysPerWeek: number[]; // [1, 2, 3, 4, 5] (1=Monday ... 5=Friday)
  periodsPerDay: number; // standard 10 periods
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  subjectCode: string; // e.g. "31901-2008"
  nameTh: string;
  nameEn?: string;
  department: string;
  credits: number; // น.
  theoryPeriods: number; // ท.
  practicePeriods: number; // ป.
  totalPeriodsPerWeek: number; // ช.
  preferredConsecutivePeriods: number; // 1=single, 2=double, 3-4=block
  requiredRoomType: RoomType;
  requiredEquipments?: string[];
  colorHex: string;
}

export interface TeacherUnavailableSlot {
  dayOfWeek: number; // 1-7 (1=Monday ... 5=Friday, 6=Sat, 7=Sun)
  periodNumber: number; // 1-13
  reason?: string;
}

export interface Teacher {
  id: string;
  teacherCode: string; // e.g. "901001"
  prefix: string;
  firstName: string;
  lastName: string;
  fullName: string;
  department: string;
  education?: string; // e.g. "วิทยาศาสตรมหาบัณฑิต"
  specialDuty?: string; // e.g. "หัวหน้าแผนกวิชาเทคโนโลยีสารสนเทศ"
  phone?: string;
  maxPeriodsPerWeek: number; // e.g. 18 for normal, 12 or 10 for department head
  qualifiedSubjectCodes: string[];
  unavailableSlots: TeacherUnavailableSlot[];
  isActive: boolean;
}

export interface Classroom {
  id: string;
  roomCode: string; // e.g. "IT-4", "IT-5"
  roomName: string;
  building: string;
  capacity: number; // seats
  roomType: RoomType;
  equipments: string[];
  isAvailable: boolean;
}

export type SlotType = "LEARN" | "BREAK" | "ACTIVITY" | "LOCKED";

export interface TimeSlot {
  id: string; // e.g. "D1_P1"
  dayOfWeek: number; // 1=Monday ... 5=Friday
  dayNameTh: string;
  periodNumber: number; // 1-10
  startTime: string; // "08:30"
  endTime: string; // "09:30"
  slotType: SlotType;
  isLocked: boolean;
}

export interface StudentGroup {
  id: string;
  groupCode: string; // e.g. "สIT.1/1", "IT.2/1"
  groupName: string;
  gradeLevel: string; // "ปวช.1", "ปวส.1"
  department: string;
  studentCount: number;
  defaultClassroomId?: string;
  linkedGroupIds?: string[]; // Groups attending together (เรียนรวม)
}

export interface CourseEnrollment {
  id: string;
  termId: string;
  studentGroupId: string;
  studentGroupCode: string;
  studentCount: number;
  subjectId: string;
  subjectCode: string;
  subjectNameTh: string;
  teacherId: string;
  teacherName: string;
  periodsPerWeek: number;
  preferredConsecutivePeriods: number; // block length
  requiredRoomType: RoomType;
  requiredEquipments?: string[];
  linkedGroupIds?: string[]; // If merged with another group
}

export interface ScheduleItem {
  id: string;
  termId: string;
  dayOfWeek: number; // 1-5
  periodNumber: number; // 1-10
  startTime: string;
  endTime: string;
  studentGroupId: string;
  studentGroupCode: string;
  subjectId: string;
  subjectCode: string;
  subjectNameTh: string;
  teacherId: string;
  teacherName: string;
  classroomId: string;
  roomCode: string;
  roomType: RoomType;
  isConsecutive: boolean;
  consecutiveIndex?: number; // 1, 2, 3 of the block
  totalConsecutive?: number; // total length of the block
  // Fast Conflict Detection Keys
  groupSlotKey: string;   // `${termId}_D${day}_P${period}_G_${groupId}`
  teacherSlotKey: string; // `${termId}_D${day}_P${period}_T_${teacherId}`
  roomSlotKey: string;    // `${termId}_D${day}_P${period}_R_${roomId}`
}

export interface SchedulingRunLog {
  id: string;
  termId: string;
  algorithmType: "GA" | "BASELINE" | "AGENT_GA" | "CSP";
  seed: number;
  config: Record<string, any>;
  durationMs: number;
  totalRequiredSlots: number;
  scheduledSlots: number;
  hardViolationsCount: number;
  softScore: number;
  status: "COMPLETED" | "PARTIAL" | "INFEASIBLE" | "FAILED" | "TIMEOUT";
  violationDetails: string[];
  createdAt: string;
}

// User & Role Definition
export type UserRole = "admin" | "teacher" | "student";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  teacherId?: string;
  studentGroupId?: string;
}
