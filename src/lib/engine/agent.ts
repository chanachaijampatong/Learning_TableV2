import { CourseEnrollment, Teacher, Classroom, StudentGroup, ScheduleItem, SchedulingRunLog } from "./types";
import { GeneticAlgorithmEngine, GAConfig, GAResult, GARunProgress } from "./gaEngine";
import { BaselineGreedyEngine, BaselineResult } from "./baselineEngine";
import { IndependentValidator, ValidationReport } from "./validator";

export interface AgentDecisionStep {
  step: number;
  title: string;
  detail: string;
  timestamp: string;
}

export interface AgentRunOutput {
  status: "SUCCESS" | "WARNING" | "FAILED";
  summary: string;
  schedule: ScheduleItem[];
  validationReport: ValidationReport;
  gaResult?: GAResult;
  baselineResult?: BaselineResult;
  decisionLogs: AgentDecisionStep[];
  tunedConfig: GAConfig;
}

export class SchedulingAgent {
  private termId: string;
  private enrollments: CourseEnrollment[];
  private teachers: Teacher[];
  private classrooms: Classroom[];
  private groups: StudentGroup[];

  constructor(
    termId: string,
    enrollments: CourseEnrollment[],
    teachers: Teacher[],
    classrooms: Classroom[],
    groups: StudentGroup[]
  ) {
    this.termId = termId;
    this.enrollments = enrollments;
    this.teachers = teachers;
    this.classrooms = classrooms;
    this.groups = groups;
  }

  public async runAutonomous(
    onProgress?: (progress: GARunProgress) => void,
    onStep?: (step: AgentDecisionStep) => void
  ): Promise<AgentRunOutput> {
    const decisionLogs: AgentDecisionStep[] = [];

    const logStep = (title: string, detail: string) => {
      const step: AgentDecisionStep = {
        step: decisionLogs.length + 1,
        title,
        detail,
        timestamp: new Date().toLocaleTimeString("th-TH")
      };
      decisionLogs.push(step);
      if (onStep) onStep(step);
    };

    // Step 1: Complexity Analysis
    const totalSlots = this.enrollments.reduce((sum, e) => sum + e.periodsPerWeek, 0);
    const teacherCount = this.teachers.length;
    const groupCount = this.groups.length;
    const roomCount = this.classrooms.length;

    logStep(
      "1. วิเคราะห์ความซับซ้อนของข้อมูล (Dataset Complexity Analysis)",
      `พบแผนการสอน ${this.enrollments.length} รายการ (รวม ${totalSlots} คาบ), ครู ${teacherCount} ท่าน, กลุ่มเรียน ${groupCount} กลุ่ม, ห้องเรียน ${roomCount} ห้อง`
    );

    // Step 2: Auto-tune Hyperparameters
    let populationSize = 60;
    let maxGenerations = 100;
    let mutationRate = 0.15;
    let timeLimitMs = 8000;

    if (totalSlots > 100) {
      populationSize = 100;
      maxGenerations = 150;
      mutationRate = 0.20;
      timeLimitMs = 12000;
    } else if (totalSlots < 40) {
      populationSize = 40;
      maxGenerations = 80;
      mutationRate = 0.10;
      timeLimitMs = 5000;
    }

    const tunedConfig: GAConfig = {
      populationSize,
      maxGenerations,
      crossoverRate: 0.85,
      mutationRate,
      elitismCount: 3,
      seed: 42,
      timeLimitMs
    };

    logStep(
      "2. ปรับจูน Hyperparameters อัตโนมัติ (Autonomous Hyperparameter Tuning)",
      `กำหนด Population = ${populationSize}, Generations = ${maxGenerations}, Mutation Rate = ${(mutationRate * 100)}%, Time Budget = ${timeLimitMs / 1000}s`
    );

    // Step 3: Run Baseline Comparison
    logStep(
      "3. ประมวลผล Baseline Greedy Placement เพื่อเป็นเกณฑ์อ้างอิง",
      "รันอัลกอริทึม First-Fit Greedy เพื่อวัดผลเชิงวิทยาศาสตร์ก่อนเริ่ม GA"
    );
    const baselineResult = BaselineGreedyEngine.run(
      this.termId,
      this.enrollments,
      this.teachers,
      this.classrooms,
      this.groups,
      tunedConfig.seed
    );

    // Step 4: Run GA Engine
    logStep(
      "4. เริ่มต้นวิวัฒนาการด้วย Genetic Algorithm (GA with Repair Operator)",
      "สร้างประชากรเริ่มต้นและค้นหาตารางเรียนที่ปราศจากข้อขัดแย้ง (Zero Conflict)"
    );

    const ga = new GeneticAlgorithmEngine(
      this.termId,
      this.enrollments,
      this.teachers,
      this.classrooms,
      this.groups,
      tunedConfig
    );

    const gaResult = await ga.run(onProgress);

    // Step 5: Independent Validation
    logStep(
      "5. ส่งผลลัพธ์ให้ Independent Validator ตรวจสอบ 10 Hard Constraints",
      `ผลการตรวจ: Hard Violations = ${gaResult.validationReport.hardViolationsCount}, อัตราจัดคาบสำเร็จ = ${gaResult.validationReport.completionRate}%`
    );

    // Step 6: Final Agent Decision
    let status: AgentRunOutput["status"] = "SUCCESS";
    let summary = "";

    if (gaResult.validationReport.isValid) {
      status = "SUCCESS";
      summary = `Agent ตัดสินใจยอมรับตารางสอน: บรรลุเกณฑ์ Zero Conflict สมบูรณ์แบบ 100% ภายใน ${gaResult.durationMs}ms (วิวัฒนาการ ${gaResult.generationsRun} Generations)`;
      logStep("6. การตัดสินใจขั้นสุดท้าย (Accepted)", summary);
    } else if (gaResult.validationReport.completionRate >= 90) {
      status = "WARNING";
      summary = `Agent ส่งมอบผลลัพธ์ที่ดีที่สุด: จัดได้ ${gaResult.validationReport.completionRate}% แต่ยังคงมีข้อขัดแย้ง ${gaResult.validationReport.hardViolationsCount} จุด แนะนำให้ตรวจเช็คข้อจำกัดครูหรือห้อง`;
      logStep("6. การตัดสินใจขั้นสุดท้าย (Partial Solution)", summary);
    } else {
      status = "FAILED";
      summary = `Agent รายงานเงื่อนไขไม่สอดคล้อง (Infeasible Constraints): ทรัพยากรไม่เพียงพอต่อการจัดตาราง`;
      logStep("6. การตัดสินใจขั้นสุดท้าย (Infeasible)", summary);
    }

    return {
      status,
      summary,
      schedule: gaResult.bestSchedule,
      validationReport: gaResult.validationReport,
      gaResult,
      baselineResult,
      decisionLogs,
      tunedConfig
    };
  }
}
