# Petanque Club Management System

ระบบจัดการชมรมเปตอง มหาวิทยาลัยอุบลราชธานี เป็นเว็บแอปพลิเคชันสำหรับบริหารจัดการกิจกรรมภายในชมรม ครอบคลุมทั้งการประชาสัมพันธ์ข่าวสาร การจองสนาม และการจัดการข้อมูลสมาชิก

## คุณสมบัติหลัก (Key Features)

- **ระบบข่าวสาร (News Feed):** แสดงประกาศ กิจกรรม และข่าวสารสำคัญ พร้อมระบบปักหมุดโพสต์แนะนำ
- **ระบบคลังรูปภาพ (Photo Gallery):** รวบรวมรูปภาพจากกิจกรรมต่างๆ สามารถกดดูภาพขนาดใหญ่และเลื่อนไปยังโพสต์ที่เกี่ยวข้องได้
- **ระบบจองสนาม (Field Booking):** แผนผังสนามแบบ Interactive แสดงสถานะว่าง/จองแบบ Real-time พร้อมระบบจองล่วงหน้าตามช่วงเวลาที่กำหนด
- **ระบบจัดการสำหรับผู้ดูแล (Admin Dashboard):** จัดการโพสต์ข่าวสาร, อนุมัติการจองสนาม, จัดการข้อมูลสมาชิก และข้อมูลสนาม
- **สถานะการให้บริการ:** แสดงสถานะเปิด/ปิดสนามอัตโนมัติ (15:00 - 22:00 น.)

## เทคโนโลยีที่ใช้ (Tech Stack)

### Frontend:
- React 18 + Vite
- Tailwind CSS (สำหรับการตกแต่ง UI)
- TanStack Query (React Query) สำหรับจัดการ State และการเชื่อมต่อ API
- Lucide React (Icons)
- Swiper.js (Carousel สำหรับโพสต์แนะนำ)

### Backend:
- Node.js + Express
- MySQL (ฐานข้อมูล)
- JWT (JSON Web Token) สำหรับระบบยืนยันตัวตน
- Multer สำหรับการจัดการไฟล์อัปโหลด

---

## วิธีการติดตั้งและเริ่มใช้งาน (Installation & Setup)

### 1. เตรียมฐานข้อมูล (Database Setup)
1. ติดตั้ง MySQL Server
2. สร้างฐานข้อมูลใหม่ (เช่นชื่อ `petanque_db`)
3. นำเข้า (Import) ไฟล์ SQL จากโฟลเดอร์ `database/init.sql` เข้าไปในฐานข้อมูลที่สร้างไว้

### 2. ตั้งค่า Backend
1. เปิด Terminal แล้วเข้าไปที่โฟลเดอร์ backend:
   ```bash
   cd backend
   ```
2. ติดตั้ง Dependencies:
   ```bash
   npm install
   ```
3. คัดลอกไฟล์ `.env.example` เป็น `.env` และตั้งค่าข้อมูลการเชื่อมต่อฐานข้อมูล:
   ```env
   DB_HOST=localhost
   DB_USER=your_username
   DB_PASS=your_password
   DB_NAME=petanque_db
   JWT_SECRET=your_jwt_secret
   ```
4. เริ่มรัน Backend Server:
   ```bash
   npm run dev
   ```
   *Server จะรันอยู่ที่ http://localhost:5050*

### 3. ตั้งค่า Frontend
1. เปิด Terminal ใหม่แล้วเข้าไปที่โฟลเดอร์ frontend:
   ```bash
   cd frontend
   ```
2. ติดตั้ง Dependencies:
   ```bash
   npm install
   ```
3. เริ่มรัน Frontend Development Server:
   ```bash
   npm run dev
   ```
   *หน้าเว็บจะเปิดอยู่ที่ http://localhost:3000*

---

## การรันด้วย Docker (Docker Setup)

สำหรับผู้ที่ต้องการรันผ่าน Docker สามารถทำได้ง่ายๆ ด้วยคำสั่งเดียว ซึ่งระบบจะจัดการทั้ง Database, Redis, Backend และ Frontend ให้โดยอัตโนมัติ

### 1. สิ่งที่ต้องเตรียม
- ติดตั้ง **Docker** และ **Docker Compose**

### 2. ขั้นตอนการรัน
1. ตรวจสอบว่ามีไฟล์ `.env` ในโฟลเดอร์ `backend` เรียบร้อยแล้ว
2. ใช้คำสั่งรัน Docker Compose:
   ```bash
   docker-compose up -d --build
   ```

### 3. ช่องทางการเข้าถึง (Access Points)
- **Frontend:** [http://localhost](http://localhost) (Port 80)
- **Backend API:** [http://localhost:5000/api](http://localhost:5000/api)
- **phpMyAdmin (จัดการฐานข้อมูล):** [http://localhost:8080](http://localhost:8080)
  - User: `petanque_user`
  - Pass: `petanque_pass`

---

## หมายเหตุ
- ตารางเวลาการจองสนามถูกตั้งค่าไว้ที่ 15:00 - 22:00 น. สำหรับสมาชิกทั่วไป
- หากรันผ่าน Docker ข้อมูลไฟล์อัปโหลดจะถูกเก็บไว้ที่โฟลเดอร์ `backend/uploads` ในเครื่อง Host แบบอัตโนมัติ
