# 🤖 Learning-Time (ระบบจัดตารางการเรียนการสอนอัตโนมัติอัจฉริยะ)
> **สำหรับ:** การนำไปใช้งานจริงในสถานศึกษา (อาชีวศึกษา/สอศ.) และรองรับเกณฑ์การแข่งขันทักษะ AI ระดับ ปวส. (ระดับภาค - 85 คะแนนเทคนิค)  
> **วิทยาลัยเทคนิคระยอง** แผนกวิชาเทคโนโลยีสารสนเทศและการสื่อสาร (IT)  
> **เทคโนโลยีหลัก:** Next.js 15 (App Router, React 19, TypeScript) + Tailwind CSS + Google Firebase (Firestore, Auth, Storage) / Dual-Mode Local Fallback + Netlify

---

## 🌟 จุดเด่นของระบบ (Key Features)

1. **Zero Conflict Guarantee (35 คะแนน):**
   - Independent Validator ตรวจสอบ 10 Hard Constraints และ 4 Soft Constraints แบบเรียลไทม์
   - รองรับระบบลากสลับคาบเรียน (Live Placement Check) ปฏิเสธทันทีเมื่อชนเวลาพักกลางวันหรือชนคาบสอนของครู
2. **AI Autonomous Agent & Benchmarking (20 คะแนน):**
   - Genetic Algorithm (GA with Repair Operator) วิวัฒนาการค้นหาตารางสอนที่สมบูรณ์แบบ
   - First-Fit Sequential Greedy Baseline สำหรับการเปรียบเทียบเชิงวิทยาศาสตร์
   - รันการทดลองเปรียบเทียบข้าม 5 Random Seeds อย่างโปร่งใส (ไม่มีการแต่งผลการทดสอบ)
3. **แบบฟอร์มทางการราชการ สอศ. A4 แนวนอน (8 คะแนน):**
   - ถอดแบบจากเอกสารจริงของวิทยาลัยเทคนิคระยอง 100%
   - สรุป ท/ป/น/ช, ตารางสอนรายบุคคล, แถบกิจกรรมหน้าเสาธง, และช่องลงนาม 4 ฝ่าย พิมพ์พอดี 1 หน้า A4 แนวนอน
   - ส่งออกไฟล์ Excel (`.xlsx`) ระดับเซลล์จริง และ PDF คมชัด
4. **การนำเข้าข้อมูลและตรวจสอบ (10 คะแนน):**
   - รองรับไฟล์ Excel (.xlsx) และ CSV พร้อมตารางพรีวิวและไฮไลต์แถวผิดพลาดสีแดง
   - บรรจุชุดข้อมูลทดสอบ 3 ขนาด (เล็ก 5 กลุ่ม, กลาง 12 กลุ่ม IT ระยอง, ใหญ่ 30+ กลุ่ม) ใน 1 คลิก
5. **ความปลอดภัยและประสิทธิภาพ (12 คะแนน):**
   - RBAC 3 บทบาท (Admin, Teacher, Student) พร้อมแถบ Quick Test Login Bar สำหรับการแข่งขัน
   - สถาปัตยกรรม Dual-Mode Storage: ใช้งานได้ทั้งบน Cloud Firestore และโหมดออฟไลน์ Local Storage 100%

---

## 🚀 วิธีการเปิดใช้งาน (How to Run)

### วิธีที่ 1: ดับเบิ้ลคลิกไฟล์รันอัตโนมัติ (บน Windows)
* ดับเบิ้ลคลิกที่ไฟล์ **`run.bat`** ในโฟลเดอร์โปรเจกต์ ระบบจะเปิดเบราว์เซอร์ไปที่ `http://localhost:3000` และเริ่มเซิร์ฟเวอร์ให้อัตโนมัติ

### วิธีที่ 2: รันผ่าน Terminal / Command Line
```bash
# 1. ติดตั้ง dependencies (หากยังไม่ได้ติดตั้ง)
npm install

# 2. เริ่มต้นเซิร์ฟเวอร์
npm run dev

# 3. เปิดเบราว์เซอร์
# เข้าไปที่ http://localhost:3000
```

---

## 📚 เอกสารประกอบระบบ
* [USER_MANUAL.md](USER_MANUAL.md) — คู่มือการใช้งานระบบและการสาธิตต่อหน้าคณะกรรมการอย่างละเอียด
* [PROJECT_GUIDE.md](PROJECT_GUIDE.md) — คู่มือการทดสอบระบบและเจาะลึกฟังก์ชัน
* [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) — แผนพัฒนา สถาปัตยกรรมระบบ และ Traceability Matrix 85 คะแนน
* [FLOWCHART.md](FLOWCHART.md) — ผังงานกระบวนการทำงานระบบ Import, Agent, GA, และ Live Swap
* [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) — คู่มือการติดตั้งบน Netlify และการตั้งค่า Firebase
