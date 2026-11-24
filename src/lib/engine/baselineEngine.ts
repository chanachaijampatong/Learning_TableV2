import { CourseEnrollment, Teacher, Classroom, StudentGroup, ScheduleItem, TimeSlot } from "./types";
import { BREAK_PERIOD, STANDARD_PERIODS } from "./constraints";

export interface BaselineResult {
  schedule: ScheduleItem[];
  unplacedEnrollments: { enrollment: CourseEnrollment; missingPeriods: number }[];
  durationMs: number;
  totalRequiredSlots: number;
  placedSlots: number;
}

/**
 * Baseline Engine: First-Fit Sequential Greedy Placement
 * Places courses sequentially into the first available valid time slot and room.
 */
export class BaselineGreedyEngine {
  public static run(
    termId: string,
    enrollments: CourseEnrollment[],
    teachers: Teacher[],
    classrooms: Classroom[],
    groups: StudentGroup[],
    seed: number = 42
  ): BaselineResult {
    const startTime = performance.now();
    const schedule: ScheduleItem[] = [];
    const unplaced: { enrollment: CourseEnrollment; missingPeriods: number }[] = [];

    // Sort enrollments: larger blocks first (standard greedy heuristic)
    const sortedEnrollments = [...enrollments].sort((a, b) => b.periodsPerWeek - a.periodsPerWeek);

    // Days 1 to 5 (Monday to Friday)
    const days = [1, 2, 3, 4, 5];
    // Learnable periods (excluding lunch break period 5)
    const validPeriods = [1, 2, 3, 4, 6, 7, 8, 9];

    let totalRequiredSlots = 0;
    let placedSlots = 0;

    for (const enrollment of sortedEnrollments) {
      totalRequiredSlots += enrollment.periodsPerWeek;
      let remainingPeriods = enrollment.periodsPerWeek;
      const blockLength = Math.min(enrollment.preferredConsecutivePeriods || 2, remainingPeriods);

      // Find compatible classrooms
      const compatibleRooms = classrooms.filter(
        r => r.isAvailable &&
             (r.roomType === enrollment.requiredRoomType || enrollment.requiredRoomType === "GENERAL") &&
             r.capacity >= enrollment.studentCount
      );
      // Fallback room if none match perfectly
      const targetRooms = compatibleRooms.length > 0 ? compatibleRooms : classrooms;

      while (remainingPeriods > 0) {
        const currentBlock = Math.min(remainingPeriods, blockLength);
        let placed = false;

        // Try every day and valid starting period
        for (const day of days) {
          if (placed) break;

          for (let pIdx = 0; pIdx <= validPeriods.length - currentBlock; pIdx++) {
            const startPeriod = validPeriods[pIdx];
            const endPeriod = validPeriods[pIdx + currentBlock - 1];

            // Ensure the block doesn't cross lunch break (cannot have periods 4 and 6 directly without gap)
            if (endPeriod - startPeriod + 1 !== currentBlock) continue;

            // Check if teacher is free in all slots of the block
            const teacherBusy = schedule.some(
              item => item.dayOfWeek === day &&
                      item.periodNumber >= startPeriod &&
                      item.periodNumber <= endPeriod &&
                      item.teacherId === enrollment.teacherId
            );
            if (teacherBusy) continue;

            // Check if group is free in all slots of the block
            const groupBusy = schedule.some(
              item => item.dayOfWeek === day &&
                      item.periodNumber >= startPeriod &&
                      item.periodNumber <= endPeriod &&
                      item.studentGroupId === enrollment.studentGroupId
            );
            if (groupBusy) continue;

            // Find an available room
            for (const room of targetRooms) {
              const roomBusy = schedule.some(
                item => item.dayOfWeek === day &&
                        item.periodNumber >= startPeriod &&
                        item.periodNumber <= endPeriod &&
                        item.classroomId === room.id
              );

              if (!roomBusy) {
                // Place the block
                for (let k = 0; k < currentBlock; k++) {
                  const pNum = startPeriod + k;
                  const pInfo = STANDARD_PERIODS.find(p => p.period === pNum) || {
                    startTime: `${8 + pNum}:30`,
                    endTime: `${9 + pNum}:30`,
                  };

                  schedule.push({
                    id: `BL_${enrollment.id}_D${day}_P${pNum}`,
                    termId,
                    dayOfWeek: day,
                    periodNumber: pNum,
                    startTime: pInfo.startTime,
                    endTime: pInfo.endTime,
                    studentGroupId: enrollment.studentGroupId,
                    studentGroupCode: enrollment.studentGroupCode,
                    subjectId: enrollment.subjectId,
                    subjectCode: enrollment.subjectCode,
                    subjectNameTh: enrollment.subjectNameTh,
                    teacherId: enrollment.teacherId,
                    teacherName: enrollment.teacherName,
                    classroomId: room.id,
                    roomCode: room.roomCode,
                    roomType: room.roomType,
                    isConsecutive: currentBlock > 1,
                    consecutiveIndex: k + 1,
                    totalConsecutive: currentBlock,
                    groupSlotKey: `${termId}_D${day}_P${pNum}_G_${enrollment.studentGroupId}`,
                    teacherSlotKey: `${termId}_D${day}_P${pNum}_T_${enrollment.teacherId}`,
                    roomSlotKey: `${termId}_D${day}_P${pNum}_R_${room.id}`,
                  });
                }

                remainingPeriods -= currentBlock;
                placedSlots += currentBlock;
                placed = true;
                break;
              }
            }

            if (placed) break;
          }
        }

        // If no slot found for the block, try 1 period or break
        if (!placed) {
          unplaced.push({ enrollment, missingPeriods: remainingPeriods });
          break;
        }
      }
    }

    const durationMs = Math.round(performance.now() - startTime);

    return {
      schedule,
      unplacedEnrollments: unplaced,
      durationMs,
      totalRequiredSlots,
      placedSlots
    };
  }
}
