# 🌐 คู่มือการติดตั้งและการ Deploy (DEPLOYMENT_GUIDE.md)
## ระบบจัดตารางการเรียนการสอนอัตโนมัติ: Learning-Time

เอกสารนี้อธิบายขั้นตอนการติดตั้ง การตั้งค่าระบบความปลอดภัย และการ Deploy ขึ้นสู่ Netlify และ Google Firebase

---

## 1. การ Deploy บน Netlify (Production Hosting)

### 1.1 ไฟล์คอนฟิก `netlify.toml`
โปรเจกต์ได้จัดเตรียมคอนฟิกสำหรับ Next.js App Router บน Netlify เรียบร้อยแล้ว:
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[functions]
  node_bundler = "esbuild"
```

### 1.2 ขั้นตอนการ Deploy ผ่าน Netlify Web Console
1. นำโค้ดขึ้น GitHub Repository
2. เข้าสู่ [Netlify Dashboard](https://app.netlify.com/) และคลิก **"Add new site" -> "Import an existing project"**
3. เลือก Provider เป็น **GitHub** และเลือก Repository ของโปรเจกต์นี้
4. ตรวจสอบการตั้งค่า Build Settings:
   - **Base directory:** (เว้นว่าง)
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
5. ในส่วน **Environment Variables** ให้เพิ่มตัวแปรแวดล้อมตาม `.env.example`:
   - `NEXT_PUBLIC_STORAGE_MODE`: `local` หรือ `firebase`
   - ค่า Firebase API Keys (หากใช้งาน Cloud Firestore)
6. คลิก **Deploy Site**

---

## 2. การตั้งค่า Google Firebase (Cloud Firestore & Auth)

### 2.1 การเปิดใช้งาน Firebase Services
1. สร้าง Firebase Project ใหม่ที่ [Firebase Console](https://console.firebase.google.com/)
2. เปิดใช้งาน **Authentication** และเลือก Sign-in Provider: Email/Password
3. เปิดใช้งาน **Cloud Firestore** ในโหมด Production
4. นำค่า Configuration มาใส่ในไฟล์ `.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-app-id"
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-app.appspot.com"
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
   NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abcdef"
   NEXT_PUBLIC_STORAGE_MODE="firebase"
   ```

### 2.2 กฎความปลอดภัย Cloud Firestore (`firestore.rules`)
โปรเจกต์มีไฟล์ `firestore.rules` สำหรับควบคุมสิทธิ์ตามบทบาท (RBAC):
- **Admin:** อ่านและเขียนได้ทุก Collection
- **Teacher:** อ่านข้อมูลทั่วไป และดูตารางสอนของตนเอง
- **Student:** อ่านเฉพาะข้อมูลตารางเรียนของกลุ่มตนเอง ห้ามแก้ไข

---

## 3. แผนสำรอง Local Fallback (โหมดออฟไลน์สำหรับการสาธิต)

ระบบ **Learning-Time** มีระบบ **Dual-Mode Storage Adapter**:
* หากไม่มีการตั้งค่า Firebase Credentials หรือเครื่องคอมพิวเตอร์ไม่ได้เชื่อมต่ออินเทอร์เน็ต ระบบจะสลับมาใช้ **Local Storage / IndexedDB Fallback Mode** อัตโนมัติ 100%
* ข้อมูลตั้งต้นของ **แผนกเทคโนโลยีสารสนเทศ วิทยาลัยเทคนิคระยอง** (ครู 10 ท่าน, 12 กลุ่มเรียน, รายวิชาจริง, ตารางตัวอย่าง) จะถูกโหลดขึ้นมาใช้งานได้ทันทีโดยไม่มีการสะดุดหรือ Error
* สามารถสั่งรันบนเครื่อง Local ได้ด้วยคำสั่ง:
  ```bash
  npm run dev
  ```
  และเปิดใช้งานที่ `http://localhost:3000`
