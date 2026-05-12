-- ============================================================
-- Petanque Club Management System — Full Database Schema
-- MySQL 8.0 Compatible
-- ============================================================

CREATE DATABASE IF NOT EXISTS petanque_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE petanque_db;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  username      VARCHAR(100) NOT NULL UNIQUE,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name    VARCHAR(255) NOT NULL,
  last_name     VARCHAR(255) NOT NULL,
  student_id    VARCHAR(50)  NULL,
  phone         VARCHAR(20)  NULL,
  role          ENUM('user','admin') NOT NULL DEFAULT 'user',
  user_type     ENUM('นักศึกษา', 'บุคลากร', 'บุคคลภายนอก') NOT NULL DEFAULT 'นักศึกษา',
  status        ENUM('active','pending','suspended') NOT NULL DEFAULT 'pending',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    DATETIME     NULL,
  INDEX idx_users_username (username),
  INDEX idx_users_email (email),
  INDEX idx_users_role (role),
  INDEX idx_users_status (status)
) ENGINE=InnoDB;

-- ============================================================
-- POSTS (News Feed)
-- ============================================================
CREATE TABLE IF NOT EXISTS posts (
  id         VARCHAR(36)  NOT NULL PRIMARY KEY,
  title      VARCHAR(500) NOT NULL,
  content    LONGTEXT     NOT NULL,
  image_url  TEXT         NULL,
  author_id  VARCHAR(36)  NOT NULL,
  is_pinned  BOOLEAN      NOT NULL DEFAULT FALSE,
  view_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME     NULL,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_posts_author (author_id),
  INDEX idx_posts_created (created_at),
  INDEX idx_posts_deleted (deleted_at)
) ENGINE=InnoDB;

-- ============================================================
-- POST LIKES
-- ============================================================
CREATE TABLE IF NOT EXISTS post_likes (
  post_id    VARCHAR(36) NOT NULL,
  user_id    VARCHAR(36) NOT NULL,
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- COMMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS comments (
  id         VARCHAR(36) NOT NULL PRIMARY KEY,
  post_id    VARCHAR(36) NOT NULL,
  user_id    VARCHAR(36) NOT NULL,
  content    TEXT        NOT NULL,
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME    NULL,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_comments_post (post_id)
) ENGINE=InnoDB;

-- ============================================================
-- FIELDS (สนาม)
-- ============================================================
CREATE TABLE IF NOT EXISTS fields (
  id           VARCHAR(36)  NOT NULL PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  description  TEXT         NULL,
  location_lat DECIMAL(10,8) NULL,
  location_lng DECIMAL(11,8) NULL,
  location_name VARCHAR(500) NULL,
  image_url    TEXT         NULL,
  status       ENUM('active','maintenance','inactive') NOT NULL DEFAULT 'active',
  max_players  INT          NOT NULL DEFAULT 6,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at   DATETIME     NULL,
  INDEX idx_fields_status (status)
) ENGINE=InnoDB;

-- ============================================================
-- BALLS (ลูกเปตอง)
-- ============================================================
CREATE TABLE IF NOT EXISTS balls (
  id           VARCHAR(36)  NOT NULL PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  brand        VARCHAR(255) NULL,
  weight_grams INT          NULL COMMENT 'weight in grams',
  diameter_mm  INT          NULL COMMENT 'diameter in mm',
  material     VARCHAR(100) NULL,
  image_url    TEXT         NULL,
  status       ENUM('available','borrowed','reserved','maintenance','unavailable') NOT NULL DEFAULT 'available',
  condition_note TEXT       NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at   DATETIME     NULL,
  INDEX idx_balls_status (status)
) ENGINE=InnoDB;

-- ============================================================
-- BOOKINGS (จองสนาม)
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
  id            VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id       VARCHAR(36) NOT NULL,
  field_id      VARCHAR(36) NOT NULL,
  start_time    DATETIME    NOT NULL,
  end_time      DATETIME    NOT NULL,
  status        ENUM('pending','approved','rejected','cancelled','completed','no-show') NOT NULL DEFAULT 'pending',
  player_count  INT         NOT NULL DEFAULT 1,
  notes         TEXT        NULL,
  cancel_reason TEXT        NULL,
  cancelled_at  DATETIME    NULL,
  approved_by   VARCHAR(36) NULL,
  approved_at   DATETIME    NULL,
  reminded_at   DATETIME    NULL,
  created_at    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    DATETIME    NULL,
  FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (field_id)    REFERENCES fields(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_bookings_field_time (field_id, start_time, end_time),
  INDEX idx_bookings_user (user_id),
  INDEX idx_bookings_status (status),
  INDEX idx_bookings_start (start_time),
  CONSTRAINT chk_booking_time CHECK (end_time > start_time)
) ENGINE=InnoDB;

-- ============================================================
-- BALL LOANS (ยืมลูก)
-- ============================================================
CREATE TABLE IF NOT EXISTS ball_loans (
  id          VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id     VARCHAR(36) NOT NULL,
  ball_id     VARCHAR(36) NOT NULL,
  loan_start  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  loan_end    DATETIME    NOT NULL COMMENT 'expected return time',
  returned_at DATETIME    NULL,
  status      ENUM('pending','active','returned','overdue','lost','rejected') NOT NULL DEFAULT 'pending',
  notes       TEXT        NULL,
  approved_by VARCHAR(36) NULL,
  created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (ball_id)     REFERENCES balls(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_loans_user (user_id),
  INDEX idx_loans_ball (ball_id),
  INDEX idx_loans_status (status)
) ENGINE=InnoDB;

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id         VARCHAR(36)  NOT NULL PRIMARY KEY,
  user_id    VARCHAR(36)  NOT NULL,
  type       VARCHAR(100) NOT NULL COMMENT 'booking_approved, booking_reminder, loan_overdue, etc.',
  title      VARCHAR(500) NOT NULL,
  message    TEXT         NOT NULL,
  is_read    BOOLEAN      NOT NULL DEFAULT FALSE,
  link       VARCHAR(500) NULL COMMENT 'frontend URL to navigate to',
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notif_user_read (user_id, is_read),
  INDEX idx_notif_created (created_at)
) ENGINE=InnoDB;

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id     VARCHAR(36)  NULL,
  action      VARCHAR(100) NOT NULL COMMENT 'CREATE, UPDATE, DELETE, LOGIN, etc.',
  entity_type VARCHAR(100) NOT NULL COMMENT 'booking, ball, field, user, post',
  entity_id   VARCHAR(36)  NULL,
  old_values  JSON         NULL,
  new_values  JSON         NULL,
  ip_address  VARCHAR(45)  NULL,
  user_agent  TEXT         NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_entity (entity_type, entity_id),
  INDEX idx_audit_action (action),
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB;

-- ============================================================
-- SYSTEM SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS system_settings (
  `key`        VARCHAR(100) NOT NULL PRIMARY KEY,
  `value`      TEXT         NOT NULL,
  description  VARCHAR(500) NULL,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- SEED DATA
-- ============================================================

-- Default system settings
INSERT INTO system_settings (`key`, `value`, `description`) VALUES
('cancel_before_hours', '2', 'ยกเลิกการจองได้ก่อนกี่ชั่วโมง'),
('booking_slot_duration', '60', 'ขนาด time slot (นาที)'),
('max_booking_days_ahead', '30', 'จองล่วงหน้าได้สูงสุดกี่วัน'),
('club_name', 'ชมรมเปตองมหาวิทยาลัย', 'ชื่อชมรม'),
('club_location', 'สนามเปตองหลัก มหาวิทยาลัย', 'ที่ตั้งชมรม');

-- Default admin user (username: adminpt, password: 1234)
INSERT INTO users (id, username, email, password_hash, first_name, last_name, role, status) VALUES
('00000000-0000-0000-0000-000000000001',
 'adminpt',
 'admin@petanque.club',
 '$2a$12$8BgLql2HA7zfjgrbhhGEI.L.RPK6uKgRRi/obcN.FLux.CabQuW6S', 
 'System',
 'Admin',
 'admin',
 'active');

-- Sample fields
INSERT INTO fields (id, name, description, location_lat, location_lng, location_name, status, max_players) VALUES
('field-0001-0000-0000-000000000001', 'สนาม A', 'สนามหลักขนาดมาตรฐาน มีหลังคากันแดด', 13.7563, 100.5018, 'สนามเปตองอาคารกีฬา ชั้น 1', 'active', 6),
('field-0002-0000-0000-000000000002', 'สนาม B', 'สนามในร่ม เหมาะสำหรับฝึกซ้อม', 13.7564, 100.5019, 'สนามเปตองอาคารกีฬา ชั้น 1', 'active', 4),
('field-0003-0000-0000-000000000003', 'สนาม C', 'สนามกลางแจ้ง มีไฟส่องสว่าง', 13.7562, 100.5017, 'ลานกีฬากลางแจ้ง', 'active', 6),
('field-0004-0000-0000-000000000004', 'สนาม D (VIP)', 'สนามสำหรับการแข่งขัน มีอัฒจันทร์นั่งชม', 13.7561, 100.5016, 'สนามแข่งขัน อาคาร B', 'active', 8);

-- Sample balls
INSERT INTO balls (id, name, brand, weight_grams, diameter_mm, material, status) VALUES
('ball-0001-0000-0000-000000000001', 'ลูก #1', 'Obut', 680, 70, 'Carbon Steel', 'available'),
('ball-0002-0000-0000-000000000002', 'ลูก #2', 'Obut', 680, 70, 'Carbon Steel', 'available'),
('ball-0003-0000-0000-000000000003', 'ลูก #3', 'Obut', 700, 71, 'Stainless Steel', 'available'),
('ball-0004-0000-0000-000000000004', 'ลูก #4', 'Obut', 700, 71, 'Stainless Steel', 'available'),
('ball-0005-0000-0000-000000000005', 'ลูก #5', 'Petangue.com', 660, 70, 'Chrome Steel', 'available'),
('ball-0006-0000-0000-000000000006', 'ลูก #6', 'Petangue.com', 660, 70, 'Chrome Steel', 'available'),
('ball-0007-0000-0000-000000000007', 'ลูก #7', 'La Franc', 710, 72, 'Stainless Steel', 'available'),
('ball-0008-0000-0000-000000000008', 'ลูก #8', 'La Franc', 710, 72, 'Stainless Steel', 'available'),
('ball-0009-0000-0000-000000000009', 'ลูก #9 (ฝึกซ้อม)', 'Generic', 680, 70, 'Steel', 'available'),
('ball-0010-0000-0000-000000000010', 'ลูก #10 (ฝึกซ้อม)', 'Generic', 680, 70, 'Steel', 'available');

-- Sample post
INSERT INTO posts (id, title, content, author_id, is_pinned) VALUES
('post-0001-0000-0000-000000000001',
 '🎉 ยินดีต้อนรับสู่ระบบจองสนามเปตอง',
 'ระบบจองสนามและยืมอุปกรณ์เปตองเปิดให้บริการแล้ว! สมาชิกสามารถจองสนามและยืมลูกเปตองได้ผ่านระบบออนไลน์นี้ได้เลย\n\nวิธีการใช้งาน:\n1. ลงทะเบียนและรอการอนุมัติจาก Admin\n2. เข้าสู่ระบบด้วย Email หรือ Google\n3. เลือกสนามและเวลาที่ต้องการจอง\n4. รอการอนุมัติจาก Admin\n\nหากมีปัญหาการใช้งาน ติดต่อ admin@petanque.club',
 '00000000-0000-0000-0000-000000000001',
 TRUE);

-- ============================================================
-- SEED FIELDS
-- ============================================================
INSERT INTO fields (id, name, description, max_players, status) VALUES
('field-large-01', 'ลานกว้าง (สนามตะกร้อ)', 'พื้นที่อเนกประสงค์สำหรับซ้อมหรือแข่งตะกร้อ', 20, 'active'),
('field-01', 'สนามที่ 1', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-02', 'สนามที่ 2', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-03', 'สนามที่ 3', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-04', 'สนามที่ 4', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-05', 'สนามที่ 5', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-06', 'สนามที่ 6', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-07', 'สนามที่ 7', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-08', 'สนามที่ 8', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-09', 'สนามที่ 9', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-10', 'สนามที่ 10', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-11', 'สนามที่ 11', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-12', 'สนามที่ 12', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-13', 'สนามที่ 13', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-14', 'สนามที่ 14', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-15', 'สนามที่ 15', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-16', 'สนามที่ 16', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-17', 'สนามที่ 17', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-18', 'สนามที่ 18', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-19', 'สนามที่ 19', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-20', 'สนามที่ 20', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-21', 'สนามที่ 21', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-22', 'สนามที่ 22', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-23', 'สนามที่ 23', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-24', 'สนามที่ 24', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-25', 'สนามที่ 25', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-26', 'สนามที่ 26', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-27', 'สนามที่ 27', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-28', 'สนามที่ 28', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-29', 'สนามที่ 29', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-30', 'สนามที่ 30', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-31', 'สนามที่ 31', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-32', 'สนามที่ 32', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-33', 'สนามที่ 33', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-34', 'สนามที่ 34', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-35', 'สนามที่ 35', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-36', 'สนามที่ 36', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-37', 'สนามที่ 37', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-38', 'สนามที่ 38', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-39', 'สนามที่ 39', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-40', 'สนามที่ 40', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-41', 'สนามที่ 41', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-42', 'สนามที่ 42', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-43', 'สนามที่ 43', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-44', 'สนามที่ 44', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-45', 'สนามที่ 45', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-46', 'สนามที่ 46', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-47', 'สนามที่ 47', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-48', 'สนามที่ 48', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-49', 'สนามที่ 49', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-50', 'สนามที่ 50', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-51', 'สนามที่ 51', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-52', 'สนามที่ 52', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-53', 'สนามที่ 53', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-54', 'สนามที่ 54', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-55', 'สนามที่ 55', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-56', 'สนามที่ 56', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-57', 'สนามที่ 57', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-58', 'สนามที่ 58', 'สนามเปตองมาตรฐาน', 6, 'active'),
('field-59', 'สนามที่ 59', 'สนามเปตองมาตรฐาน', 6, 'active');
