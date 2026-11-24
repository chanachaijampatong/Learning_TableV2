# 📑 เอกสารแผนพัฒนาและสถาปัตยกรรมระบบ (DEVELOPMENT_PLAN.md)
## ระบบจัดตารางการเรียนการสอนอัตโนมัติอัจฉริยะ: "Learning-Time"
> **เป้าหมาย:** ระบบจัดตารางเรียนตารางสอนสำหรับสถานศึกษาอาชีวศึกษา (สอศ.) รองรับเกณฑ์การแข่งขันทักษะ AI ระดับ ปวส. (ระดับภาค - 85 คะแนนเทคนิค)  
> **เทคโนโลยี:** Next.js (App Router, React 19, TypeScript) + Tailwind CSS + Google Firebase (Firestore, Auth, Storage) / Dual-Mode Local Fallback + Netlify / Node.js Runtime  
> **สถานะเอกสาร:** Phase 0 - จัดทำเพื่อการตรวจวิเคราะห์ วางสถาปัตยกรรม และขออนุมัติก่อนเริ่มพัฒนา  

---

## 1. การวิเคราะห์ช่องว่างระบบเดิมและขอบเขตงาน (Gap Analysis)

จากการตรวจสอบสภาพแวดล้อมโปรเจกต์เดิมและไฟล์ข้อมูลจริง `ตัวอย่างจัดตารางสอน iT-1(1).xlsx` (แผนกเทคโนโลยีสารสนเทศ วิทยาลัยเทคนิคระยอง):

| มิติการวิเคราะห์ | สภาพปัจจุบัน (Current State) | สภาพที่ระบบ Learning-Time จะพัฒนา (Target State) | ช่องว่างและการแก้ไข (Gap & Remediation) |
| :--- | :--- | :--- | :--- |
| **โครงสร้างโปรเจกต์** | โฟลเดอร์ว่าง ยังไม่มีโค้ดโปรเจกต์ | Next.js 15+ (App Router), React 19, TypeScript 5.x แบบ Modular Clean Architecture | สร้าง Boilerplate คุณภาพสูงพร้อม Strict TypeScript และ Tailwind CSS |
| **แหล่งข้อมูล (Data Source)** | มีไฟล์ Excel ต้นแบบที่มี Sheet รายวิชา, ครู 10 คน, 12 กลุ่มเรียน, ตารางตัวอย่าง | แปลงเป็น Firestore Collections และ Default Preset Data (พร้อม 1-Click Load) รองรับทั้ง Online/Offline | พัฒนาระบบ Dual-Mode Storage (Firestore + IndexedDB/LocalStorage Fallback) |
| **การตรวจสอบข้อมูล (Validation)** | ใช้สูตร Excel และการตรวจด้วยสายตามนุษย์ มีความเสี่ยงต่อการจัดคาบชนและภาระสอนผิด | Independent Validator Engine ตรวจสอบ 10 Hard Constraints และ 4 Soft Constraints แบบเรียลไทม์ | แยกโมดูล Validator อิสระ ตรวจได้ทั้งหลัง AI รัน และขณะผู้ใช้ลากสลับคาบ (Live Check) |
| **เครื่องมือจัดตาราง (Engine)** | มนุษย์จัดด้วยมือ (Manual Placement) ใช้เวลาหลายวันถึงสัปดาห์ | Genetic Algorithm (GA) + Baseline Greedy Engine + Rule-based Autonomous Agent | พัฒนา AI Scheduling Engine ที่จัดตาราง Zero Conflict ภายในไม่กี่วินาที พร้อมรายงานการตัดสินใจ |
| **การประเมินและการทดสอบ** | ไม่มีเกณฑ์ชี้วัดเชิงปริมาณที่เป็นวิทยาศาสตร์ | ระบบ Benchmarking เปรียบเทียบ Baseline vs GA อย่างน้อย 3-5 Seeds แสดงเวลา, Hard Violations, Soft Score | สร้างหน้า Dashboard วิเคราะห์เปรียบเทียบอัลกอริทึมตามเกณฑ์คะแนนแข่งขัน 20 คะแนน |
| **ตารางและการพิมพ์แบบฟอร์ม** | มีไฟล์ตัวอย่างตาราง Excel แบบเฉพาะบุคคล | Responsive Matrix (4 มิติ: กลุ่มเรียน, ครู, ห้อง, วิชา) + แบบฟอร์มทางการ สอศ. A4 แนวนอน 100% | พัฒนา Strict Print CSS `@page { size: A4 landscape; margin: 4mm 6mm; }` พร้อมลงนาม 4 ฝ่าย และ Export Excel/PDF |
| **สิทธิ์และความปลอดภัย (RBAC)** | ใครเปิดไฟล์ Excel ก็แก้ไขได้ทั้งหมด | RBAC 3 บทบาท (Admin, Teacher, Student) ควบคุมทั้ง UI, Server Actions และ Firestore Rules | พัฒนา Auth Context + Quick Test Login Bar สำหรับสลับบทบาทขณะสาธิต |

---

## 2. ตารางแจกแจงเกณฑ์ประเมินทักษะ AI (Traceability Matrix - 85 คะแนน)

| หมวดการประเมิน (คะแนน) | เกณฑ์ย่อยตามข้อกำหนด | ฟังก์ชัน/โมดูลในระบบ Learning-Time | ไฟล์/ส่วนประกอบหลักที่ตรวจสอบได้ |
| :--- | :--- | :--- | :--- |
| **1. การนำเข้าข้อมูลและตรวจสอบ (10)** | - รองรับ Excel (.xlsx) และ CSV<br>- มี Template แยกหมวด<br>- Validate Data Integrity ก่อนบันทึก<br>- พรีวิวตารางพร้อมไฮไลต์ข้อผิดพลาด<br>- มีชุดข้อมูลตัวอย่าง 3 ขนาด (เล็ก, กลาง, ใหญ่) | - Modular Import Parser (ExcelJS / SheetJS)<br>- Pre-import Data Integrity Validator<br>- Interactive Error Highlighting Preview Table<br>- One-Click Sample Datasets (Small: 5 กลุ่ม, Medium: 12 กลุ่ม IT ระยอง, Large: 30+ กลุ่ม) | `src/components/import/*`<br>`src/lib/validators/dataIntegrity.ts`<br>`src/data/sampleDatasets.ts`<br>`public/templates/*` |
| **2. ความถูกต้องและ Scheduling Engine (35)** | - ปลอดข้อขัดแย้ง (Hard Violations = 0)<br>- ครู/ห้อง/กลุ่มเรียน/คาบต่อเนื่องไม่ชน<br>- ล็อกคาบพักกลางวันและหน้าเสาธง<br>- คาบเรียนครบถ้วน 100%<br>- ปรับน้ำหนัก Soft Constraints ได้<br>- ตรวจสอบผลลัพธ์ผ่าน Independent Validator | - Rule-based Constraint Engine<br>- Zero-Conflict Schedule Constructor<br>- Parameterized Soft-Constraint Scoring Function<br>- Pure Independent Validator Module (ตัดขาดจาก UI)<br>- Interactive Swap with Live Placement Check | `src/lib/engine/validator.ts`<br>`src/lib/engine/constraints.ts`<br>`src/lib/engine/types.ts`<br>`src/app/timetables/page.tsx` |
| **3. การประยุกต์ใช้ AI & Benchmarking (20)** | - เปรียบเทียบ 3 อัลกอริทึม (CSP, GA, Hybrid)<br>- GA Chromosome Encoding ที่รักษาบล็อกคาบ<br>- Domain-Specific Repair Operator<br>- Rule-based Autonomous Agent ปรับจูน Hyperparameters อัตโนมัติ<br>- เปรียบเทียบผลกับ Baseline ด้วย 3-5 Seeds | - Chromosome Representation with Lesson Blocks<br>- Elitism, Tournament Selection, Block Crossover<br>- Adaptive Repair Heuristic Operator<br>- Autonomous Scheduling Agent with Decision Log<br>- Benchmark Runner & Experiment Evidence Table | `src/lib/engine/gaEngine.ts`<br>`src/lib/engine/baselineEngine.ts`<br>`src/lib/engine/agent.ts`<br>`src/app/benchmarks/page.tsx` |
| **4. ตาราง รายงาน และการส่งออก (8)** | - มุมมอง 4 มิติ (กลุ่มเรียน, ครู, ห้อง, วิชา)<br>- Responsive (Desktop Matrix, Tablet Sticky, Mobile Timeline)<br>- Drag & Drop / Click Swap พร้อม Live Check<br>- แบบฟอร์มทางการ สอศ. A4 แนวนอน พอดี 1 หน้า<br>- Export PDF ภาษาไทยคมชัด + Excel Cell-level | - Timetable 4-View Switcher<br>- Mobile Responsive Timeline Card View<br>- Official Vocational Timetable Component (สอศ. A4)<br>- Native Print CSS Stylesheet<br>- ExcelJS Custom Exporter & Client-side PDF Generator | `src/components/timetable/*`<br>`src/components/reports/OfficialScheduleA4.tsx`<br>`src/lib/export/excelExporter.ts`<br>`src/lib/export/pdfExporter.ts` |
| **5. ประสิทธิภาพ ความปลอดภัย และ Deploy (12)** | - RBAC 3 บทบาท (Admin, Teacher, Student)<br>- Firestore Security Rules รัดกุม<br>- ไม่ Hardcode Secrets ในโค้ด<br>- Quick Login สำหรับ Demo<br>- รองรับ Netlify Deployment พร้อม Local Fallback | - Firebase Authentication & Claims Context<br>- Firestore Security Rules (`firestore.rules`)<br>- Development Quick Login Bar<br>- Netlify Build Config (`netlify.toml`)<br>- Dual-mode Storage Adapter (Cloud + Offline Local) | `src/context/AuthContext.tsx`<br>`src/lib/firebase/*`<br>`src/lib/storage/dualStorage.ts`<br>`firestore.rules`<br>`netlify.toml` |

---

## 3. สถาปัตยกรรมระบบและโครงสร้างฐานข้อมูล (Architecture & Schema)

### 3.1 ภาพรวมสถาปัตยกรรม (System Architecture Diagram)
```
               [ Browser / Mobile Client ]
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
    [ Next.js App Router ]      [ Client Storage Adapter ]
    - UI Components (React 19)   - Dual-Mode: Firebase / Local
    - Responsive Matrix / Cards  - IndexedDB / LocalStorage Fallback
    - Drag & Drop / Quick Swap
             │
             ├──────────────────────────┐
             ▼                          ▼
    [ Core Engine Layer ]      [ Validator Engine ]
    - Rule-based Agent          - 10 Hard Constraints Check
    - GA Engine with Repair     - 4 Soft Constraints Score
    - Baseline Greedy Engine    - Live Candidate Check
             │
             ▼
    [ Cloud Services (Firebase) ]
    - Firebase Auth (RBAC)
    - Cloud Firestore (Data Collections)
    - Firebase Storage (Templates / Exports)
```

### 3.2 การออกแบบ Firestore Collections และ Interfaces
ยึดตาม Data Models ที่ระบุในข้อกำหนด พร้อมขยายโครงสร้างให้รองรับไฟล์จริงของแผนก IT เทคนิคระยอง:

1. **`academic_terms`**:
   - `id`: string (เช่น `"2569-2"`)
   - `academicYear`: string (`"2569"`)
   - `semester`: number (`2`)
   - `name`: string (`"ภาคเรียนที่ 2 ปีการศึกษา 2569"`)
   - `isActive`: boolean
   - `daysPerWeek`: number[] (`[1, 2, 3, 4, 5]`)
   - `periodsPerDay`: number (`10` หรือ `13`)
   - `flagCeremonyTime`: string (`"08:00 - 08:30"`)
   - `breakPeriod`: number (`5` คือ 12:30-13:30)

2. **`subjects`**:
   - `id`: string
   - `subjectCode`: string (`"31901-2005"`)
   - `nameTh`: string (`"การพัฒนาซอฟต์แวร์ด้วยเทคโนโลยี Back-End"`)
   - `credits`: number (`3`)
   - `theoryPeriods`: number (`1`)
   - `practicePeriods`: number (`4`)
   - `totalPeriodsPerWeek`: number (`5`)
   - `preferredConsecutivePeriods`: number (`3` หรือ `4` หรือ `5`)
   - `requiredRoomType`: `"COMPUTER_LAB" | "GENERAL" | "WORKSHOP"`
   - `colorHex`: string

3. **`teachers`**:
   - `id`: string
   - `teacherCode`: string (`"901002"`)
   - `prefix`: string (`"นาย"`)
   - `fullName`: string (`"นายปริญญา จำเนียรพล"`)
   - `department`: string (`"เทคโนโลยีสารสนเทศและการสื่อสาร"`)
   - `education`: string (`"วิทยาศาสตรมหาบัณฑิต"`)
   - `specialDuty`: string (`"หัวหน้างานศูนย์ดิจิทัลและสื่อสารองค์กร"`)
   - `maxPeriodsPerWeek`: number (`12` สำหรับหน.งาน ปวช., `10` สำหรับหน.งาน ปวส., `18` ปกติ)
   - `unavailableSlots`: `{ dayOfWeek: number; periodNumber: number; reason?: string }[]`

4. **`classrooms`**:
   - `id`: string
   - `roomCode`: string (`"IT-4"`, `"IT-5"`, `"Room-501"`)
   - `roomName`: string
   - `roomType`: `"COMPUTER_LAB" | "GENERAL" | "WORKSHOP"`
   - `capacity`: number (`35` - `45`)
   - `isAvailable`: boolean

5. **`student_groups`**:
   - `id`: string
   - `groupCode`: string (`"สIT.1/1"`, `"IT.2/1"`)
   - `groupName`: string (`"เทคโนโลยีสารสนเทศ 1/1"`)
   - `gradeLevel`: string (`"ปวส.1"`, `"ปวช.2"`)
   - `studentCount`: number (`17` ถึง `36`)
   - `linkedGroupIds`: string[] (กลุ่มเรียนรวม เช่น ปวช.1/1 ร่วมกับ 1/2)

6. **`course_enrollments`**:
   - แผนการสอนที่ต้องลงตาราง เชื่อมโยง Group + Subject + Teacher + RoomType

7. **`schedules`**:
   - ตารางที่จัดเสร็จแล้ว มี Fast Conflict Keys:
     - `teacherSlotKey`: `${termId}_D${day}_P${period}_T_${teacherId}`
     - `roomSlotKey`: `${termId}_D${day}_P${period}_R_${roomId}`
     - `groupSlotKey`: `${termId}_D${day}_P${period}_G_${groupId}`

8. **`scheduling_runs`**:
   - ประวัติการรัน บันทึก Seed, Algorithm, Hard Violations, Soft Score, Duration (ms) สำหรับนำไปใช้ใน Benchmark Table

### 3.3 โครงสร้างโฟลเดอร์ในโปรเจกต์ (Clean Directory Structure)
```
src/
├── app/                      # Next.js App Router Pages
│   ├── page.tsx              # หน้าแรก Dashboard ภาพรวม
│   ├── timetables/page.tsx   # หน้ารวมตาราง 4 มิติ + สลับคาบ
│   ├── print/[id]/page.tsx   # หน้าแบบฟอร์มทางการ สอศ. A4 แนวนอน
│   ├── import/page.tsx       # หน้านำเข้าไฟล์ Excel/CSV + Preview
│   ├── benchmarks/page.tsx   # หน้าเปรียบเทียบ AI vs Baseline
│   ├── settings/page.tsx     # หน้าจัดการข้อมูลพื้นฐาน (ครู/วิชา/ห้อง/กลุ่ม)
│   └── api/                  # Server Route Handlers (Firebase Admin/Export)
├── components/
│   ├── layout/               # Navbar, Sidebar, QuickLoginBar
│   ├── timetable/            # MatrixView, TimelineView, ClassCard, SwapModal
│   ├── reports/              # OfficialScheduleA4, PrintSignatures, SubjectSummaryTable
│   ├── import/               # FileDropzone, IntegrityPreviewTable, TemplateDownloader
│   └── ui/                   # Reusable UI (Button, Modal, Badge, Tabs, Spinner)
├── lib/
│   ├── engine/               # Scheduling Core Engine
│   │   ├── types.ts          # Core Data Interfaces & Scheduling Types
│   │   ├── validator.ts      # Pure Independent Validator Engine
│   │   ├── constraints.ts    # Hard & Soft Constraint Functions
│   │   ├── gaEngine.ts       # Genetic Algorithm with Repair Operator
│   │   ├── baselineEngine.ts # First-Fit Greedy Sequential Engine
│   │   └── agent.ts          # Autonomous Rule-based Scheduling Agent
│   ├── storage/              # Dual-Mode Storage Adapter
│   │   ├── dualStorage.ts    # Firebase Firestore + IndexedDB/LocalStorage Fallback
│   │   └── mockData.ts       # Default Rayong IT Dataset Preset
│   ├── export/               # Export Utilities (ExcelJS, jsPDF, Print)
│   └── firebase/             # Firebase Client & Admin Config
└── types/                    # Shared TypeScript Types
```

---

## 4. การวิเคราะห์และการตัดสินใจเลือกอัลกอริทึม (Algorithm Decision & Pseudocode)

### 4.1 ตารางเปรียบเทียบ 3 อัลกอริทึม
| เกณฑ์การประเมิน | 1. Pure CSP (MRV + Backtracking) | 2. Genetic Algorithm (GA) + Repair | 3. Hybrid CSP-GA |
| :--- | :--- | :--- | :--- |
| **การันตี Hard Constraints** | ดีเยี่ยม (Zero Conflict) แต่เสี่ยงต่อ State Space Explosion หากเงื่อนไขแน่นมาก | ดีมากเมื่อมี Domain-Specific Repair Operator ป้องกันชน | ยอดเยี่ยม (สร้าง Feasible Candidate ด้วย Heuristic แล้วใช้ GA เกลี่ย) |
| **การปรับแต่ง Soft Constraints** | ทำได้ยาก ต้องใช้ Branch-and-Bound ซึ่งใช้เวลาคำนวณสูงมาก | **ทำได้ยอดเยี่ยมและยืดหยุ่นสูงมาก** ด้วย Fitness Function หลายมิติ | ยอดเยี่ยมมาก |
| **ความเร็วในการประมวลผล** | เร็วสำหรับชุดข้อมูลขนาดเล็ก แต่อาจ Timeout (>60s) เมื่อข้อมูลซับซ้อน | **เร็วคงที่ (1-5 วินาที)** และสามารถกำหนด Time Budget / Generation ได้ | เร็วปานกลาง (2-8 วินาที) |
| **ความเสี่ยงบน Netlify Serverless** | สูง เสี่ยงต่อ 10s Execution Timeout | **ต่ำมาก** สามารถรันบน Web Worker / Client หรือ Serverless ได้อย่างราบรื่น | ต่ำ-ปานกลาง |
| **การสาธิตในการแข่งขัน** | เห็นผลเฉพาะคำตอบสุดท้าย | **เห็นวิวัฒนาการชัดเจน (Generation by Generation, Fitness Graph, Mutation Rate)** | เห็นวิวัฒนาการชัดเจน |

**ข้อสรุปการเลือกสถาปัตยกรรม (Architecture Choice):**  
เราเลือกใช้ **Hybrid Architecture (Heuristic Constructor + GA with Domain-Specific Repair Operator)** โดยมี **Rule-based Autonomous Agent** คอยควบคุม:
1. ใช้ **Constraint-Guided Heuristic** สร้างประชากรเริ่มต้น (Initial Population) เพื่อให้ได้ตารางที่ Hard Violations ต่ำที่สุดตั้งแต่เริ่มต้น
2. ใช้ **Genetic Algorithm (GA)** ทำหน้าที่ปรับปรุงและค้นหาคำตอบที่มี Soft Constraint Score สูงสุด (ลดคาบว่าง, เกลี่ยภาระสอน, ลดการย้ายห้อง)
3. ใช้ **Domain-Specific Repair Operator** แก้ไขคาบที่เกิด Conflict ทันทีในระหว่าง Crossover / Mutation
4. พัฒนา **First-Fit Sequential Greedy Engine** เพื่อเป็น **Baseline** สำหรับการวัดประสิทธิภาพทางวิทยาศาสตร์

### 4.2 โครงสร้าง Chromosome และ Genetic Operators
* **Chromosome Representation:**  
  `Chromosome = Array<LessonPlacement>`  
  โดยแต่ละ `LessonPlacement` คือบล็อกคาบเรียนต่อเนื่อง:
  ```typescript
  interface LessonPlacement {
    enrollmentId: string;
    dayOfWeek: number;    // 1 (จันทร์) - 5 (ศุกร์)
    startPeriod: number;  // 1 - 10
    duration: number;     // 1, 2, 3, 4 คาบ
    roomId: string;       // รหัสห้องเรียน
  }
  ```
* **Fitness Function:**
  $$Fitness = 1,000,000 - (HardViolations \times 50,000) - (SoftPenaltyScore)$$
  * *หมายเหตุสำคัญ:* ค่าปรับของ Hard Violation ถูกตั้งไว้สูงมาก เพื่อให้ระบบเลือก Chromosome ที่ไร้ข้อขัดแย้งก่อนเสมอ
* **Genetic Operators:**
  * **Selection:** Tournament Selection (k=3) เพื่อคัดเลือกสมาชิกที่แข็งแกร่ง
  * **Crossover:** Two-Point Block Crossover (สลับการจัดตารางระหว่าง 2 พ่อแม่ โดยรักษาความต่อเนื่องของบล็อกคาบคู่)
  * **Mutation:**
    * *Swap Mutation:* สลับวันหรือเวลาของ 2 บล็อกในกลุ่มเรียนเดียวกัน
    * *Move Mutation:* ย้ายบล็อกไปยังช่วงเวลาว่าง
    * *Room Mutation:* เปลี่ยนห้องเรียนไปยังห้องที่ว่างและประเภทตรงกัน
  * **Repair Operator:** เมื่อเกิดการชน ตรวจสอบคาบว่างในโดเมนของครูและกลุ่มเรียน แล้วย้ายคาบที่ชนไปยังคาบว่างทันที

### 4.3 อัลกอริทึม Baseline Engine (First-Fit Greedy)
```typescript
function runBaselineGreedy(enrollments, resources, timeslots): Schedule {
  const schedule = [];
  // เรียงลำดับตามความยาก: บล็อกยาวสุด -> ครูที่ว่างน้อยสุด -> ห้องเฉพาะทาง
  const sorted = sortEnrollmentsByDifficulty(enrollments);
  for (const item of sorted) {
    let placed = false;
    for (const slot of timeslots) {
      if (isValidPlacement(item, slot, schedule)) {
        schedule.push({ ...item, slot });
        placed = true;
        break;
      }
    }
    if (!placed) markAsUnscheduled(item);
  }
  return schedule;
}
```

---

## 5. กฎเกณฑ์และตรรกะการตรวจสอบ (Constraints & Validator Engine)

### 5.1 รายการ Hard Constraints (คะแนนปรับ = 50,000 ต่อข้อผิดพลาด)
1. `HARD_TEACHER_OVERLAP`: ครู 1 ท่าน ห้ามสอนซ้ำซ้อนในคาบเวลาเดียวกัน
2. `HARD_ROOM_OVERLAP`: ห้องเรียน 1 ห้อง ห้ามมีหลายคลาสเรียนในคาบเวลาเดียวกัน
3. `HARD_GROUP_OVERLAP`: กลุ่มเรียน 1 กลุ่ม ห้ามเรียนมากกว่า 1 วิชาในเวลาเดียวกัน
4. `HARD_LINKED_GROUP`: กลุ่มที่เรียนรวมกัน (Linked Groups) ต้องลงตารางพร้อมกันและห้องเดียวกัน
5. `HARD_TEACHER_UNAVAILABLE`: ห้ามจัดในวัน/คาบที่ครูระบุไม่สะดวกสอน (`unavailableSlots`)
6. `HARD_LOCKED_SLOTS`: ห้ามจัดทับคาบหน้าเสาธง (08:00-08:30) และคาบพักกลางวัน (12:30-13:30)
7. `HARD_CONSECUTIVE_INTEGRITY`: คาบต่อเนื่อง (เช่น 3 คาบติด) ต้องอยู่ในวันเดียวกัน คาบติดกันจริง และห้ามคร่อมเวลาพัก
8. `HARD_ROOM_TYPE_MATCH`: ห้องเรียนต้องมีประเภทตรงตามที่รายวิชากำหนด (เช่น วิชาวิเคราะห์ระบบเชิงวัตถุ ต้องใช้ห้องปฏิบัติการคอมพิวเตอร์)
9. `HARD_ROOM_CAPACITY`: ความจุห้องต้องไม่น้อยกว่าจำนวนนักเรียนในกลุ่ม
10. `HARD_PERIOD_COMPLETENESS`: จำนวนคาบที่จัดลงตารางต้องครบ 100% ตามแผนการเรียน

### 5.2 รายการ Soft Constraints (คะแนนปรับ = 10 - 100 ต่อรายการ)
1. `SOFT_STUDENT_IDLE_GAP` (น้ำหนัก: 50): ลดช่องว่างระหว่างคาบเรียนของนักศึกษา (ไม่ให้มีคาบฟันหลอเกินจำเป็น)
2. `SOFT_TEACHER_LOAD_BALANCE` (น้ำหนัก: 40): เกลี่ยภาระการสอนของครูในแต่ละวันให้สม่ำเสมอ (ไม่เกิน 6-7 คาบต่อวัน)
3. `SOFT_ROOM_CONTINUITY` (น้ำหนัก: 20): ลดการเปลี่ยนตึก/ห้องเรียนของนักศึกษาในวันเดียวกัน
4. `SOFT_SUBJECT_SPREAD` (น้ำหนัก: 30): กระจายวิชาที่มีหลายคาบ ไม่ให้กระจุกตัวในวันเดียวเกินไป

### 5.3 รหัสสถานะของ Validator Engine (Validator Status Codes)
* `VALIDATOR_STATUS_FEASIBLE_OPTIMAL`: ผ่านเงื่อนไข Hard ทั้งหมด 100% และ Soft Score อยู่ในเกณฑ์ดีเยี่ยม
* `VALIDATOR_STATUS_FEASIBLE_SUBOPTIMAL`: ผ่านเงื่อนไข Hard ทั้งหมด แต่มีคาบว่างหรือภาระสอนไม่สม่ำเสมอ
* `VALIDATOR_STATUS_INFEASIBLE_CONSTRAINTS`: เงื่อนไขขัดแย้งในเชิงทฤษฎี (เช่น ชั่วโมงสอนรวมของกลุ่มเกินจำนวนคาบทั้งหมดในสัปดาห์)
* `VALIDATOR_STATUS_TIMEOUT_NO_SOLUTION`: หมดเวลาประมวลผลก่อนพบคำตอบ Zero-Conflict (แสดงผลการจัดที่ดีที่สุดพร้อมไฮไลต์คาบที่ชน)
* `VALIDATOR_STATUS_INVALID_INPUT`: ข้อมูลนำเข้าไม่ถูกต้อง (รหัสวิชา/ครูไม่ตรง หรือข้อมูลสูญหาย)

---

## 6. ลำดับขั้นตอนการทำงานของ Autonomous Scheduling Agent

```
 [เริ่มต้น: วิเคราะห์โจทย์]
        │
        ▼
 1. Dataset Complexity Analyzer
    - นับจำนวนคาบทั้งหมดที่ต้องจัด (Total Required Periods)
    - คำนวณความหนาแน่นของทรัพยากร (Teacher / Room Utilization Ratio)
    - ตรวจสอบความยาก (Difficulty Score: คาบคู่, ห้องเฉพาะทาง, คาบเรียนรวม)
        │
        ▼
 2. Hyperparameter Auto-Tuner
    - ปรับ Population Size (50 - 200 ตามขนาดข้อมูล)
    - ปรับ Mutation Rate (0.05 - 0.20)
    - กำหนด Time Budget (3,000 - 15,000 ms)
        │
        ▼
 3. Execute GA Engine with Seed Logging
    - บันทึก Seed และเริ่มต้นวิวัฒนาการ
    - แสดง Real-time Progress Bar & Generation Counter
        │
        ▼
 4. Independent Validation Check
    - ส่งผลลัพธ์ที่ดีที่สุดให้ Validator ตรวจสอบ 10 Hard Constraints
        │
        ├──────────────────────────┐
        ▼ (มี Hard Violation)      ▼ (Hard Violations == 0)
 5. Adaptive Strategy Loop         6. Feasible Solution Accepted
    - เพิ่มค่าน้ำหนัก Penalty       - คำนวณ Soft Constraints Score
    - ทำ Re-seeding สมาชิก 30%    - บันทึกตารางลงฐานข้อมูล
    - รัน Local Repair Operator   - ออกรายงานการตัดสินใจ (Decision Log)
    - หากครบ Budget แจ้งเตือนสาเหตุ
```

---

## 7. แผนการทดสอบและเกณฑ์การยอมรับ (Test Plan & Acceptance Criteria)

### 7.1 ชุดการทดสอบ (Test Suites)
1. **Normal Case Test (ชุดข้อมูลแผนก IT เทคนิคระยอง):**
   - ครู 10 ท่าน, 12 กลุ่มเรียน, 20+ รายวิชา, คาบเรียนรวม ปวช.1
   - *เกณฑ์ผ่าน:* Hard Violations = 0, จัดคาบครบ 100%, เวลาประมวลผล < 8 วินาที
2. **Edge Case 1 (Single Teacher Multiple Groups):**
   - ครู 1 ท่าน รับผิดชอบ 4 กลุ่มเรียนในวิชาเดียวกัน
   - *เกณฑ์ผ่าน:* ไม่เกิดคาบชนกันของครูท่านนั้นในทุกคาบ
3. **Edge Case 2 (Room Bottleneck):**
   - จำกัดห้องปฏิบัติการคอมพิวเตอร์ให้มีเพียง 2 ห้อง ขณะที่มีวิชาปฏิบัติพร้อมกัน 4 วิชา
   - *เกณฑ์ผ่าน:* สลับเวลาการใช้ห้องโดยไม่มีวิชาใดชนกัน
4. **Infeasible Case Test (จงใจป้อนเงื่อนไขที่จัดไม่ได้):**
   - กำหนดให้ครู 1 คน ต้องสอน 40 ชั่วโมง ในเวลาที่มีให้เพียง 30 คาบ
   - *เกณฑ์ผ่าน:* ระบบต้องปฏิเสธสถานะ "สำเร็จ", แสดงรหัส `INFEASIBLE_CONSTRAINTS` และระบุสาเหตุที่ชัดเจน ห้ามแจ้งหลอกว่าจัดสำเร็จ
5. **Interactive Live Swap Test:**
   - ผู้ใช้ลากสลับคาบเรียนบนหน้า UI ที่ตั้งใจให้ชนกับวิชาอื่น
   - *เกณฑ์ผ่าน:* ระบบปฏิเสธการสลับทันที แสดง Modal แจ้งเตือนสาเหตุ และคืนตำแหน่งเดิม

---

## 8. แผนการส่งมอบและการจัดการความเสี่ยง (Deployment & Risk Management)

### 8.1 แผนการ Deploy บน Netlify
* **Build Command:** `pnpm build` (หรือ `npm run build`)
* **Publish Directory:** `.next`
* **Node.js Runtime:** 20.x
* **Netlify Next.js Runtime Plugin:** `@netlify/plugin-nextjs` ติดตั้งพร้อมคอนฟิกใน `netlify.toml`
* **Serverless Function Safeguards:**
  * การคำนวณหนักของ GA Engine ถูกออกแบบให้ทำงานแบบ Hybrid: รองรับทั้งการรันบน Server Route Handler (พร้อม Timeout Guard 8s) และการประมวลผลบน Client Web Worker / In-browser Engine ได้อย่างไร้รอยต่อ เพื่อป้องกันข้อจำกัด Netlify 10-second Function Timeout

### 8.2 แผนสำรอง Local Fallback (ความพร้อม 100% ในวันแข่งขัน)
* มีระบบ **Dual-Storage Adapter**:
  * หากมี Firebase Credentials ใน `.env.local` ระบบจะเชื่อมต่อ Cloud Firestore
  * หากไม่มี หรือตัดสัญญาณอินเทอร์เน็ต ระบบจะสลับมาใช้ **Local In-Memory / IndexedDB Storage** ทันที พร้อมโหลด Preset ข้อมูลแผนก IT เทคนิคระยองขึ้นมาให้ใช้งานได้เต็มรูปแบบครบทุกฟีเจอร์
* บันทึกคำสั่งการรันบนเครื่อง Local ใน `DEPLOYMENT_GUIDE.md`:
  `pnpm install && pnpm run dev` เข้าถึงได้ที่ `http://localhost:3000`

---

## 9. เอกสารที่จะจัดส่งมอบเมื่อเสร็จสมบูรณ์
1. Source Code ฉบับสมบูรณ์ (Next.js App Router, React 19, TypeScript, Tailwind CSS)
2. `DEVELOPMENT_PLAN.md` (เอกสารฉบับนี้)
3. `FLOWCHART.md` (ผังงานระบบ Import, Scheduling Engine, Validator และ Agent)
4. `PROJECT_GUIDE.md` (คู่มือผู้ใช้ แนะนำการใช้งานทุกหน้า และวิธีการทดสอบระบบ)
5. `DEPLOYMENT_GUIDE.md` (คู่มือการติดตั้งบน Netlify และการรัน Local Fallback)
6. `.env.example` (รายการตัวแปรแวดล้อมที่จำเป็น)
