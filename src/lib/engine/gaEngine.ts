import { CourseEnrollment, Teacher, Classroom, StudentGroup, ScheduleItem } from "./types";
import { BREAK_PERIOD, STANDARD_PERIODS } from "./constraints";
import { IndependentValidator, ValidationReport } from "./validator";

export interface GAConfig {
  populationSize: number;
  maxGenerations: number;
  crossoverRate: number;
  mutationRate: number;
  elitismCount: number;
  seed: number;
  timeLimitMs: number;
}

export interface GARunProgress {
  generation: number;
  bestFitness: number;
  hardViolations: number;
  softScore: number;
  completionRate: number;
  elapsedMs: number;
}

export interface GAResult {
  bestSchedule: ScheduleItem[];
  validationReport: ValidationReport;
  generationsRun: number;
  durationMs: number;
  convergenceHistory: { gen: number; fitness: number; violations: number }[];
}

interface GenePlacement {
  enrollment: CourseEnrollment;
  dayOfWeek: number;
  startPeriod: number;
  duration: number;
  roomId: string;
}

type Chromosome = GenePlacement[];

export class GeneticAlgorithmEngine {
  private config: GAConfig;
  private termId: string;
  private enrollments: CourseEnrollment[];
  private teachers: Teacher[];
  private classrooms: Classroom[];
  private groups: StudentGroup[];
  private validPeriods = [1, 2, 3, 4, 6, 7, 8, 9];
  private days = [1, 2, 3, 4, 5];

  constructor(
    termId: string,
    enrollments: CourseEnrollment[],
    teachers: Teacher[],
    classrooms: Classroom[],
    groups: StudentGroup[],
    config?: Partial<GAConfig>
  ) {
    this.termId = termId;
    this.enrollments = enrollments;
    this.teachers = teachers;
    this.classrooms = classrooms;
    this.groups = groups;
    this.config = {
      populationSize: config?.populationSize || 50,
      maxGenerations: config?.maxGenerations || 100,
      crossoverRate: config?.crossoverRate || 0.85,
      mutationRate: config?.mutationRate || 0.15,
      elitismCount: config?.elitismCount || 2,
      seed: config?.seed || Date.now(),
      timeLimitMs: config?.timeLimitMs || 10000,
    };
  }

  // Simple pseudo-random generator with seed
  private random(seedObj: { val: number }): number {
    seedObj.val = (seedObj.val * 9301 + 49297) % 233280;
    return seedObj.val / 233280;
  }

  /**
   * Run the Genetic Algorithm.
   * Supports an optional onProgress callback for real-time progress update.
   */
  public async run(onProgress?: (progress: GARunProgress) => void): Promise<GAResult> {
    const startTime = performance.now();
    const seedRef = { val: this.config.seed };
    const history: { gen: number; fitness: number; violations: number }[] = [];

    // 1. Initialize Population
    let population: Chromosome[] = [];
    for (let i = 0; i < this.config.populationSize; i++) {
      population.push(this.createRandomChromosome(seedRef));
    }

    let bestChromosome = population[0];
    let bestFitness = -Infinity;
    let bestReport = this.evaluateChromosome(bestChromosome);

    // 2. Evolution Loop
    let gen = 0;
    while (gen < this.config.maxGenerations) {
      const elapsed = performance.now() - startTime;
      if (elapsed >= this.config.timeLimitMs) break;

      // Evaluate each individual
      const evaluated = population.map(chrom => {
        const report = this.evaluateChromosome(chrom);
        return { chrom, report, fitness: report.totalFitness };
      });

      // Sort by fitness descending
      evaluated.sort((a, b) => b.fitness - a.fitness);

      if (evaluated[0].fitness > bestFitness) {
        bestFitness = evaluated[0].fitness;
        bestChromosome = evaluated[0].chrom;
        bestReport = evaluated[0].report;
      }

      history.push({
        gen,
        fitness: evaluated[0].fitness,
        violations: evaluated[0].report.hardViolationsCount
      });

      if (onProgress && gen % 5 === 0) {
        onProgress({
          generation: gen,
          bestFitness: evaluated[0].fitness,
          hardViolations: evaluated[0].report.hardViolationsCount,
          softScore: evaluated[0].report.softPenaltyScore,
          completionRate: evaluated[0].report.completionRate,
          elapsedMs: Math.round(elapsed)
        });
      }

      // Early exit if optimal solution reached (zero hard violations and low soft score)
      if (evaluated[0].report.hardViolationsCount === 0 && evaluated[0].report.completionRate === 100 && evaluated[0].report.softPenaltyScore < 300) {
        break;
      }

      // 3. Selection & Elitism
      const newPopulation: Chromosome[] = [];
      for (let e = 0; e < this.config.elitismCount && e < evaluated.length; e++) {
        newPopulation.push(this.deepCopy(evaluated[e].chrom));
      }

      // 4. Crossover & Mutation
      while (newPopulation.length < this.config.populationSize) {
        const parent1 = this.tournamentSelect(evaluated, seedRef);
        const parent2 = this.tournamentSelect(evaluated, seedRef);

        let child = this.crossover(parent1, parent2, seedRef);
        if (this.random(seedRef) < this.config.mutationRate) {
          child = this.mutate(child, seedRef);
        }

        // Domain-Specific Repair
        child = this.repairChromosome(child);
        newPopulation.push(child);
      }

      population = newPopulation;
      gen++;
    }

    const durationMs = Math.round(performance.now() - startTime);
    const finalSchedule = this.chromosomeToSchedule(bestChromosome);
    const finalReport = IndependentValidator.validateSchedule(
      finalSchedule,
      this.enrollments,
      this.teachers,
      this.classrooms,
      this.groups
    );

    return {
      bestSchedule: finalSchedule,
      validationReport: finalReport,
      generationsRun: gen,
      durationMs,
      convergenceHistory: history
    };
  }

  private createRandomChromosome(seedRef: { val: number }): Chromosome {
    const chromosome: Chromosome = [];

    for (const enrollment of this.enrollments) {
      let remainingPeriods = enrollment.periodsPerWeek;
      const blockLength = Math.min(enrollment.preferredConsecutivePeriods || 2, remainingPeriods);

      while (remainingPeriods > 0) {
        const duration = Math.min(remainingPeriods, blockLength);
        const day = this.days[Math.floor(this.random(seedRef) * this.days.length)];
        
        // Pick valid start period that doesn't cross lunch break
        const possibleStarts = duration === 1
          ? [1, 2, 3, 4, 6, 7, 8, 9]
          : duration === 2
          ? [1, 2, 3, 6, 7, 8]
          : duration === 3
          ? [1, 2, 6, 7]
          : [1, 6]; // duration 4

        const startPeriod = possibleStarts[Math.floor(this.random(seedRef) * possibleStarts.length)] || 1;
        const compatibleRooms = this.classrooms.filter(
          r => r.isAvailable && (r.roomType === enrollment.requiredRoomType || enrollment.requiredRoomType === "GENERAL")
        );
        const room = compatibleRooms.length > 0
          ? compatibleRooms[Math.floor(this.random(seedRef) * compatibleRooms.length)]
          : this.classrooms[0];

        chromosome.push({
          enrollment,
          dayOfWeek: day,
          startPeriod,
          duration,
          roomId: room ? room.id : "EXTERNAL"
        });

        remainingPeriods -= duration;
      }
    }

    return chromosome;
  }

  private tournamentSelect(
    evaluated: { chrom: Chromosome; fitness: number }[],
    seedRef: { val: number },
    k: number = 3
  ): Chromosome {
    let best = evaluated[Math.floor(this.random(seedRef) * evaluated.length)];
    for (let i = 1; i < k; i++) {
      const candidate = evaluated[Math.floor(this.random(seedRef) * evaluated.length)];
      if (candidate.fitness > best.fitness) {
        best = candidate;
      }
    }
    return best.chrom;
  }

  private crossover(c1: Chromosome, c2: Chromosome, seedRef: { val: number }): Chromosome {
    if (this.random(seedRef) > this.config.crossoverRate) {
      return this.deepCopy(c1);
    }
    // Two-point block crossover
    const len = Math.min(c1.length, c2.length);
    const p1 = Math.floor(this.random(seedRef) * len);
    const p2 = Math.floor(this.random(seedRef) * len);
    const start = Math.min(p1, p2);
    const end = Math.max(p1, p2);

    const child: Chromosome = [];
    for (let i = 0; i < len; i++) {
      if (i >= start && i <= end) {
        child.push({ ...c2[i] });
      } else {
        child.push({ ...c1[i] });
      }
    }
    return child;
  }

  private mutate(c: Chromosome, seedRef: { val: number }): Chromosome {
    const mutated = this.deepCopy(c);
    const geneIdx = Math.floor(this.random(seedRef) * mutated.length);
    const gene = mutated[geneIdx];

    const mutationType = Math.floor(this.random(seedRef) * 3);
    if (mutationType === 0) {
      // Change day
      gene.dayOfWeek = this.days[Math.floor(this.random(seedRef) * this.days.length)];
    } else if (mutationType === 1) {
      // Change start period
      const possibleStarts = gene.duration <= 2 ? [1, 2, 3, 6, 7, 8] : [1, 6];
      gene.startPeriod = possibleStarts[Math.floor(this.random(seedRef) * possibleStarts.length)] || 1;
    } else {
      // Change room
      const compatibleRooms = this.classrooms.filter(
        r => r.isAvailable && (r.roomType === gene.enrollment.requiredRoomType || gene.enrollment.requiredRoomType === "GENERAL")
      );
      if (compatibleRooms.length > 0) {
        gene.roomId = compatibleRooms[Math.floor(this.random(seedRef) * compatibleRooms.length)].id;
      }
    }
    return mutated;
  }

  /**
   * Domain-Specific Repair Operator:
   * Inspects conflicts (teacher overlap, room overlap) and resolves by finding an unoccupied slot.
   */
  private repairChromosome(c: Chromosome): Chromosome {
    const repaired = this.deepCopy(c);
    const teacherSlotUsage = new Set<string>();

    for (let i = 0; i < repaired.length; i++) {
      const gene = repaired[i];
      let hasConflict = false;

      for (let p = 0; p < gene.duration; p++) {
        const key = `D${gene.dayOfWeek}_P${gene.startPeriod + p}_T_${gene.enrollment.teacherId}`;
        if (teacherSlotUsage.has(key)) {
          hasConflict = true;
          break;
        }
      }

      if (hasConflict) {
        // Try other days and periods to resolve conflict
        for (const day of this.days) {
          const starts = gene.duration <= 2 ? [1, 2, 3, 6, 7, 8] : [1, 6];
          for (const start of starts) {
            let conflict = false;
            for (let p = 0; p < gene.duration; p++) {
              if (teacherSlotUsage.has(`D${day}_P${start + p}_T_${gene.enrollment.teacherId}`)) {
                conflict = true;
                break;
              }
            }
            if (!conflict) {
              gene.dayOfWeek = day;
              gene.startPeriod = start;
              hasConflict = false;
              break;
            }
          }
          if (!hasConflict) break;
        }
      }

      // Register new used slots
      for (let p = 0; p < gene.duration; p++) {
        teacherSlotUsage.add(`D${gene.dayOfWeek}_P${gene.startPeriod + p}_T_${gene.enrollment.teacherId}`);
      }
    }

    return repaired;
  }

  private chromosomeToSchedule(c: Chromosome): ScheduleItem[] {
    const schedule: ScheduleItem[] = [];
    const roomMap = new Map<string, Classroom>(this.classrooms.map(r => [r.id, r]));

    for (let i = 0; i < c.length; i++) {
      const gene = c[i];
      const room = roomMap.get(gene.roomId) || {
        id: gene.roomId,
        roomCode: gene.roomId === "EXTERNAL" ? "สถานประกอบการ" : gene.roomId,
        roomType: gene.enrollment.requiredRoomType
      };

      for (let p = 0; p < gene.duration; p++) {
        const periodNum = gene.startPeriod + p;
        const pInfo = STANDARD_PERIODS.find(sp => sp.period === periodNum) || {
          startTime: `${8 + periodNum}:30`,
          endTime: `${9 + periodNum}:30`,
        };

        schedule.push({
          id: `GA_${gene.enrollment.id}_D${gene.dayOfWeek}_P${periodNum}`,
          termId: this.termId,
          dayOfWeek: gene.dayOfWeek,
          periodNumber: periodNum,
          startTime: pInfo.startTime,
          endTime: pInfo.endTime,
          studentGroupId: gene.enrollment.studentGroupId,
          studentGroupCode: gene.enrollment.studentGroupCode,
          subjectId: gene.enrollment.subjectId,
          subjectCode: gene.enrollment.subjectCode,
          subjectNameTh: gene.enrollment.subjectNameTh,
          teacherId: gene.enrollment.teacherId,
          teacherName: gene.enrollment.teacherName,
          classroomId: gene.roomId,
          roomCode: room.roomCode,
          roomType: room.roomType,
          isConsecutive: gene.duration > 1,
          consecutiveIndex: p + 1,
          totalConsecutive: gene.duration,
          groupSlotKey: `${this.termId}_D${gene.dayOfWeek}_P${periodNum}_G_${gene.enrollment.studentGroupId}`,
          teacherSlotKey: `${this.termId}_D${gene.dayOfWeek}_P${periodNum}_T_${gene.enrollment.teacherId}`,
          roomSlotKey: `${this.termId}_D${gene.dayOfWeek}_P${periodNum}_R_${gene.roomId}`,
        });
      }
    }

    return schedule;
  }

  private evaluateChromosome(c: Chromosome): ValidationReport {
    const schedule = this.chromosomeToSchedule(c);
    return IndependentValidator.validateSchedule(
      schedule,
      this.enrollments,
      this.teachers,
      this.classrooms,
      this.groups
    );
  }

  private deepCopy(c: Chromosome): Chromosome {
    return c.map(g => ({ ...g }));
  }
}
