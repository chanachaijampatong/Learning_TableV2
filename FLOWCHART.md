# 🔄 ผังงานการทำงานของระบบ (FLOWCHART.md)
## ระบบจัดตารางการเรียนการสอนอัตโนมัติ: Learning-Time

เอกสารนี้แสดงผังงาน Flowcharts ครอบคลุม 4 โมดูลหลักของระบบตามเกณฑ์การประเมินทักษะ AI (ระดับ ปวส. ภาค):

---

## 1. ผังงานกระบวนการนำเข้าและตรวจสอบข้อมูล (Data Import & Validation Flow)

```mermaid
flowchart TD
    A([เริ่มต้น: เลือกหรือลากไฟล์ Excel / CSV]) --> B[XLSX Parser อ่าน Sheet และแปลงเป็น JSON Rows]
    B --> C{ตรวจสอบ Header และ Missing Required Fields}
    C -- ขาดข้อมูลสำคัญ --> D[ไฮไลต์แถวสีแดง แจ้งสาเหตุ Error ชัดเจน]
    C -- ครบถ้วน --> E{ตรวจสอบ Foreign Key Integrity}
    E -- รหัสวิชา/ครูไม่มีในระบบ --> D
    E -- ผ่าน --> F{ตรวจสอบ Duplicate Primary Keys}
    F -- มีข้อมูลซ้ำซ้อน --> D
    F -- ผ่าน --> G[แสดงผล Interactive Preview Table สถานะผ่าน]
    D --> H[ผู้ใช้แก้ไขไฟล์ หรือยกเว้นแถวที่ผิดพลาด]
    H --> B
    G --> I[ผู้ใช้กดยืนยันบันทึกข้อมูลเข้าสู่ระบบ]
    I --> J[บันทึกเข้าสู่ Dual Storage: Cloud Firestore / Local Fallback]
    J --> K([เสร็จสิ้นการนำเข้าข้อมูล])
```

---

## 2. ผังงานกระบวนการทำงานของ Autonomous Scheduling Agent

```mermaid
flowchart TD
    Start([ผู้ใช้สั่งรัน Autonomous Agent]) --> S1[1. Dataset Complexity Analyzer]
    S1 --> S1_Detail[คำนวณจำนวนคาบทั้งหมด, สัดส่วนความหนาแน่นครูและห้อง, ความยาวบล็อกคาบต่อเนื่อง]
    S1_Detail --> S2[2. Hyperparameter Auto-Tuner]
    S2 --> S2_Detail[ปรับขนาด Population 40-100, Mutation Rate 10-20%, Time Budget อัตโนมัติ]
    S2_Detail --> S3[3. Run Baseline Greedy Engine]
    S3 --> S3_Detail[บันทึกผล First-Fit เพื่อใช้เป็นเกณฑ์เปรียบเทียบมาตรฐานเชิงวิทยาศาสตร์]
    S3_Detail --> S4[4. Initialize Genetic Algorithm]
    S4 --> GA_Loop[วิวัฒนาการ: Selection -> Crossover -> Mutation -> Domain Repair Operator]
    GA_Loop --> S5[5. Independent Validator Engine ตรวจสอบ 10 Hard Constraints]
    S5 --> S5_Check{Hard Violations == 0 ?}
    S5_Check -- ไม่สำเร็จ และยังมี Time Budget --> Adaptive[Adaptive Strategy: ปรับค่าน้ำหนัก Penalty, Re-seeding 30%]
    Adaptive --> GA_Loop
    S5_Check -- ไม่สำเร็จ และหมดเวลา --> Timeout[รายงาน Partial Solution หรือ Infeasible พร้อมสาเหตุ]
    S5_Check -- ผ่านสมบูรณ์ Zero Conflict --> S6[6. Final Decision: Accepted]
    S6 --> S6_Detail[คำนวณ Soft Constraints Score, บันทึกผลลงตารางสอน และออก Decision Log โปร่งใส]
    Timeout --> Finish([จบการทำงาน])
    S6_Detail --> Finish
```

---

## 3. ผังงานการทำงานของ Genetic Algorithm (GA Engine with Repair)

```mermaid
flowchart TD
    InitPop[สร้างประชากรเริ่มต้น Initial Population ตามบล็อกคาบต่อเนื่อง] --> Eval[ประเมิน Fitness Function: 1,000,000 - Hard*50,000 - SoftPenalties]
    Eval --> CheckTerm{บรรลุเงื่อนไขหยุด หรือครบ Max Generations ?}
    CheckTerm -- ใช่ --> PickBest[คัดเลือก Chromosome ที่ดีที่สุด]
    CheckTerm -- ไม่ใช่ --> Elitism[คัดเลือก Elitism Top 2-3 สมาชิกถ่ายทอดสู่รุ่นถัดไป]
    Elitism --> TourSelect[Tournament Selection k=3 คัดเลือกพ่อแม่]
    TourSelect --> TwoPointCross[Two-point Block Crossover 85%]
    TwoPointCross --> Mutate[Mutation 15%: Swap Day, Move Slot, Change Room]
    Mutate --> RepairOp[Domain-Specific Repair Operator: ตรวจหาคาบว่างในโดเมน ย้ายคาบที่ชนทันที]
    RepairOp --> Eval
    PickBest --> ConvertSchedule[แปลง Chromosome เป็น ScheduleItems]
    ConvertSchedule --> Out([ส่งมอบผลลัพธ์ให้ Validator และ UI])
```

---

## 4. ผังงานการตรวจสอบคาบเรียนแบบ Real-time เมื่อผู้ใช้ลากสลับคาบ (Live Placement Check)

```mermaid
flowchart TD
    UserClick([ผู้ใช้คลิกเลือกคาบเรียนต้นทาง]) --> Slot1[บันทึก Selected Slot]
    Slot1 --> UserTarget([ผู้ใช้คลิกเลือกช่องปลายทางที่ต้องการสลับ/ย้าย])
    UserTarget --> CheckBreak{ช่องปลายทางตรงกับคาบพักกลางวัน 12:30-13:30 ?}
    CheckBreak -- ใช่ --> Reject1[ปฏิเสธ: แสดง Alert ห้ามวางทับเวลาพักกลางวัน]
    CheckBreak -- ไม่ใช่ --> CheckTeacher{ครูผู้สอนมีคาบสอนชนกับกลุ่มอื่นในคาบนี้ ?}
    CheckTeacher -- ใช่ --> Reject2[ปฏิเสธ: แจ้งเตือนครูมีคาบสอนชนกับกลุ่มอื่น]
    CheckTeacher -- ไม่ใช่ --> CheckRoom{ห้องเรียนมีกลุ่มอื่นใช้งานอยู่แล้ว ?}
    CheckRoom -- ใช่ --> Reject3[ปฏิเสธ: แจ้งเตือนห้องเรียนไม่ว่าง]
    CheckRoom -- ไม่ใช่ --> CheckGroup{กลุ่มเรียนมีวิชาอื่นเรียนอยู่แล้ว ?}
    CheckGroup -- ใช่ --> Reject4[ปฏิเสธ: แจ้งเตือนกลุ่มเรียนมีวิชาอื่นแล้ว]
    CheckGroup -- ไม่ใช่ --> CheckAvail{ครูระบุไม่สะดวกสอนในวัน/คาบนี้ ?}
    CheckAvail -- ใช่ --> Reject5[ปฏิเสธ: แจ้งเตือนเวลาไม่สะดวกสอนของครู]
    CheckAvail -- ไม่ใช่ --> SwapSuccess[อนุมัติการสลับ/ย้ายคาบ -> อัปเดตตารางสอนทันที]
    SwapSuccess --> End([เสร็จสิ้น])
    Reject1 --> End
    Reject2 --> End
    Reject3 --> End
    Reject4 --> End
    Reject5 --> End
```
