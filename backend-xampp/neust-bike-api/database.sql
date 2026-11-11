-- ==============================================================
-- NEUST BIKEGO - OFFICIAL MYSQL DATABASE SCHEMA FOR XAMPP
-- Import this into phpMyAdmin (http://localhost/phpmyadmin)
-- ==============================================================

CREATE DATABASE IF NOT EXISTS `neust_bikego` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `neust_bikego`;

-- 1. USERS TABLE (Students, Drivers, Administrators)
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_uid` VARCHAR(60) NOT NULL UNIQUE,
  `full_name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `id_number` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('student', 'driver', 'admin') NOT NULL DEFAULT 'student',
  `phone` VARCHAR(30) DEFAULT '0917-000-0000',
  `department` VARCHAR(150) DEFAULT 'College of Information & Communications Technology (CICT)',
  `avatar_url` TEXT DEFAULT NULL,
  `assigned_bicycle_number` VARCHAR(30) DEFAULT NULL,
  `account_status` ENUM('active', 'suspended', 'pending') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Demo Accounts (Password for all demo accounts: password123)
INSERT INTO `users` (`user_uid`, `full_name`, `email`, `id_number`, `password`, `role`, `phone`, `department`, `avatar_url`, `assigned_bicycle_number`, `account_status`)
VALUES
('student-001', 'Maria Angela Santos', 'maria.santos@neust.edu.ph', '2023-01042', 'password123', 'student', '0927-123-4567', 'College of Information & Communications Tech (CICT)', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80', NULL, 'active'),
('student-002', 'Mark Vincent Reyes', 'mark.reyes@neust.edu.ph', '2022-04911', 'password123', 'student', '0928-234-5678', 'College of Engineering', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80', NULL, 'active'),
('driver-001', 'Pedro Ramirez', 'pedro.ramirez@neust.edu.ph', 'DRV-2024-001', 'password123', 'driver', '0917-555-0101', 'Campus Transportation Services', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80', 'BIKE-001', 'active'),
('driver-003', 'Juan Dela Cruz', 'juan.delacruz@neust.edu.ph', 'DRV-2024-003', 'password123', 'driver', '0919-555-0103', 'Campus Transportation Services', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80', 'BIKE-003', 'active'),
('admin-001', 'Engr. Roberto Bautista', 'admin.bautista@neust.edu.ph', 'ADM-88001', 'password123', 'admin', '0915-999-0011', 'University Logistics & Fleet Operations', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80', NULL, 'active')
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);

-- 2. BICYCLES TABLE (Campus Shuttle Fleet)
CREATE TABLE IF NOT EXISTS `bicycles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `bike_number` VARCHAR(30) NOT NULL UNIQUE,
  `driver_name` VARCHAR(150) NOT NULL,
  `driver_phone` VARCHAR(30) DEFAULT '0917-555-0101',
  `driver_photo` TEXT DEFAULT NULL,
  `passenger_count` INT NOT NULL DEFAULT 0,
  `max_capacity` INT NOT NULL DEFAULT 4,
  `status` ENUM('available', 'almost_full', 'full', 'on_trip', 'maintenance', 'offline') NOT NULL DEFAULT 'available',
  `lat` DECIMAL(10, 7) NOT NULL DEFAULT 15.4448890,
  `lng` DECIMAL(10, 7) NOT NULL DEFAULT 120.9404170,
  `current_station` VARCHAR(150) DEFAULT 'NEUST Trike Terminal',
  `current_destination` VARCHAR(150) DEFAULT 'CICT — Building 25',
  `battery_percent` INT DEFAULT 95,
  `speed_kmh` DECIMAL(4, 1) DEFAULT 0.0,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `bicycles` (`bike_number`, `driver_name`, `driver_phone`, `driver_photo`, `passenger_count`, `max_capacity`, `status`, `lat`, `lng`, `current_station`, `current_destination`)
VALUES
('BIKE-001', 'Pedro Ramirez', '0917-555-0101', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80', 1, 4, 'available', 15.444889, 120.940417, 'NEUST Trike Terminal', 'CICT — Building 25'),
('BIKE-002', 'Antonio Luna', '0918-555-0102', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', 3, 4, 'almost_full', 15.446200, 120.939200, 'Administration Bldg', 'University Library'),
('BIKE-003', 'Juan Dela Cruz', '0919-555-0103', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80', 2, 4, 'on_trip', 15.447000, 120.938800, 'CICT — Bldg 25', 'College of Engineering'),
('BIKE-004', 'Eduardo Ramos', '0920-555-0104', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80', 4, 4, 'full', 15.448000, 120.941200, 'College of Engineering', 'Main Entrance Gate'),
('BIKE-005', 'Mario Gutierrez', '0921-555-0105', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80', 0, 4, 'maintenance', 15.446800, 120.937800, 'NEUST Mart Service Bay', 'Under Inspection')
ON DUPLICATE KEY UPDATE `driver_name` = VALUES(`driver_name`);

-- 3. QUEUE ENTRIES TABLE (Passenger Digital Line)
CREATE TABLE IF NOT EXISTS `queues` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `queue_number` VARCHAR(30) NOT NULL UNIQUE,
  `student_uid` VARCHAR(60) NOT NULL,
  `student_name` VARCHAR(150) NOT NULL,
  `student_id_number` VARCHAR(50) NOT NULL,
  `student_photo` TEXT DEFAULT NULL,
  `pickup_location_id` VARCHAR(50) NOT NULL,
  `pickup_location_name` VARCHAR(150) NOT NULL,
  `destination_id` VARCHAR(50) NOT NULL,
  `destination_name` VARCHAR(150) NOT NULL,
  `custom_pin_lat` DECIMAL(10, 7) DEFAULT NULL,
  `custom_pin_lng` DECIMAL(10, 7) DEFAULT NULL,
  `pickup_instructions` TEXT DEFAULT NULL,
  `status` ENUM('waiting', 'called', 'boarded', 'cancelled') NOT NULL DEFAULT 'waiting',
  `assigned_bike_number` VARCHAR(30) DEFAULT NULL,
  `assigned_driver_name` VARCHAR(150) DEFAULT NULL,
  `position` INT NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. TRIPS HISTORY TABLE
CREATE TABLE IF NOT EXISTS `trips` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `trip_number` VARCHAR(50) NOT NULL UNIQUE,
  `bicycle_number` VARCHAR(30) NOT NULL,
  `driver_name` VARCHAR(150) NOT NULL,
  `pickup_location` VARCHAR(150) NOT NULL,
  `destination` VARCHAR(150) NOT NULL,
  `passenger_count` INT NOT NULL DEFAULT 1,
  `status` ENUM('active', 'completed', 'cancelled') NOT NULL DEFAULT 'completed',
  `start_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `end_time` TIMESTAMP NULL DEFAULT NULL,
  `distance_meters` INT DEFAULT 450
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. MAINTENANCE WORK ORDERS
CREATE TABLE IF NOT EXISTS `maintenance_reports` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `report_number` VARCHAR(50) NOT NULL UNIQUE,
  `bicycle_number` VARCHAR(30) NOT NULL,
  `driver_name` VARCHAR(150) NOT NULL,
  `issue_type` VARCHAR(100) NOT NULL,
  `severity` ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
  `description` TEXT NOT NULL,
  `status` ENUM('submitted', 'under_review', 'under_maintenance', 'resolved') NOT NULL DEFAULT 'submitted',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. TRANSPORTATION BOOKINGS TABLE (JoyRide-Style Booking & Dispatch Engine)
CREATE TABLE IF NOT EXISTS `bookings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `booking_uid` VARCHAR(60) NOT NULL UNIQUE,
  `booking_number` VARCHAR(30) NOT NULL UNIQUE,
  `student_uid` VARCHAR(60) NOT NULL,
  `student_name` VARCHAR(150) NOT NULL,
  `student_phone` VARCHAR(30) DEFAULT NULL,
  `student_id_number` VARCHAR(50) NOT NULL,
  `pickup_name` VARCHAR(150) NOT NULL,
  `pickup_lat` DECIMAL(10, 7) NOT NULL,
  `pickup_lng` DECIMAL(10, 7) NOT NULL,
  `pickup_instructions` TEXT DEFAULT NULL,
  `destination_name` VARCHAR(150) NOT NULL,
  `destination_lat` DECIMAL(10, 7) NOT NULL,
  `destination_lng` DECIMAL(10, 7) NOT NULL,
  `distance_meters` INT NOT NULL DEFAULT 400,
  `estimated_minutes` INT NOT NULL DEFAULT 3,
  `fare_amount` DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
  `status` ENUM('pending', 'searching', 'accepted', 'driver_arriving', 'driver_arrived', 'in_progress', 'completed', 'cancelled', 'no_driver_found') NOT NULL DEFAULT 'searching',
  `assigned_driver_id` VARCHAR(60) DEFAULT NULL,
  `assigned_driver_name` VARCHAR(150) DEFAULT NULL,
  `assigned_driver_phone` VARCHAR(30) DEFAULT NULL,
  `assigned_bike_number` VARCHAR(30) DEFAULT NULL,
  `target_driver_id` VARCHAR(60) DEFAULT NULL,
  `request_expires_at` BIGINT DEFAULT NULL,
  `rejected_driver_ids` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (`student_uid`),
  INDEX (`status`),
  INDEX (`target_driver_id`),
  INDEX (`assigned_driver_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. CAMPUS LOCATIONS TABLE (GPS-Based Mapping & Verified Locations)
CREATE TABLE IF NOT EXISTS `campus_locations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `location_uid` VARCHAR(60) NOT NULL UNIQUE,
  `code` VARCHAR(20) DEFAULT NULL,
  `location_name` VARCHAR(150) NOT NULL,
  `building_number` VARCHAR(50) DEFAULT NULL,
  `category` ENUM('academic', 'administrative', 'services', 'gate', 'recreation', 'facility') NOT NULL DEFAULT 'academic',
  `description` TEXT DEFAULT NULL,
  `latitude` DECIMAL(10, 7) NOT NULL,
  `longitude` DECIMAL(10, 7) NOT NULL,
  `pickup_latitude` DECIMAL(10, 7) DEFAULT NULL,
  `pickup_longitude` DECIMAL(10, 7) DEFAULT NULL,
  `dropoff_latitude` DECIMAL(10, 7) DEFAULT NULL,
  `dropoff_longitude` DECIMAL(10, 7) DEFAULT NULL,
  `gps_accuracy` DECIMAL(6, 2) DEFAULT NULL,
  `is_pickup_allowed` TINYINT(1) NOT NULL DEFAULT 1,
  `is_dropoff_allowed` TINYINT(1) NOT NULL DEFAULT 1,
  `status` ENUM('pending', 'approved', 'rejected', 'inactive') NOT NULL DEFAULT 'approved',
  `submitted_by` VARCHAR(150) DEFAULT 'System Seed',
  `approved_by` VARCHAR(150) DEFAULT 'Campus Admin',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (`status`),
  INDEX (`category`),
  INDEX (`location_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed verified NEUST Sumacab Campus Locations
INSERT INTO `campus_locations` 
(`location_uid`, `code`, `location_name`, `building_number`, `category`, `description`, `latitude`, `longitude`, `pickup_latitude`, `pickup_longitude`, `dropoff_latitude`, `dropoff_longitude`, `gps_accuracy`, `is_pickup_allowed`, `is_dropoff_allowed`, `status`, `submitted_by`, `approved_by`)
VALUES
('loc-gate', 'GATE', 'NEUST Gate & Trike Bike Terminal', 'Terminal', 'gate', 'Official NEUST Sumacab Trike Bike Pilahan terminal', 15.4448890, 120.9404170, 15.4448890, 120.9404170, 15.4448890, 120.9404170, 3.5, 1, 1, 'approved', 'Admin', 'Admin'),
('loc-cict', 'CICT', 'College of Information & Communications Tech', 'Bldg 25', 'academic', 'College of ICT Building, beside Physical Education & Athletic Field', 15.4488500, 120.9398000, 15.4487000, 120.9397000, 15.4487000, 120.9397000, 3.5, 1, 1, 'approved', 'Admin', 'Admin'),
('loc-eng', 'ENG', 'College of Engineering', 'COE', 'academic', 'College of Engineering building, labs, and workshops along Narra Ave', 15.4469900, 120.9404900, 15.4469900, 120.9404900, 15.4469900, 120.9404900, 4.2, 1, 1, 'approved', 'Admin', 'Admin'),
('loc-gym', 'GYM', 'NEUST Gymnasium / NEUST Gym', 'Gym', 'recreation', 'NEUST University Gymnasium and sports arena along Malunggay Ave', 15.4486500, 120.9411000, 15.4486500, 120.9411000, 15.4486500, 120.9411000, 5.0, 1, 1, 'approved', 'Admin', 'Admin'),
('loc-pool', 'POOL', 'NEUST Swimming Pool', 'Aquatics', 'recreation', 'Olympic-size university swimming pool and aquatic sports facility', 15.4483000, 120.9416300, 15.4483000, 120.9416300, 15.4483000, 120.9416300, 5.5, 1, 1, 'approved', 'Admin', 'Admin'),
('loc-museum', 'MUS', 'University Museum', 'Museum', 'services', 'NEUST Heritage Museum, cultural archives, and gallery along Pili Ave', 15.4452400, 120.9396100, 15.4452400, 120.9396100, 15.4452400, 120.9396100, 4.8, 1, 1, 'approved', 'Admin', 'Admin'),
('loc-arch', 'ARCH', 'College of Architecture', 'CoA', 'academic', 'College of Architecture design studios and drafting halls near Administration circle', 15.4463100, 120.9392900, 15.4463100, 120.9392900, 15.4463100, 120.9392900, 4.1, 1, 1, 'approved', 'Admin', 'Admin'),
('loc-ced', 'CED', 'College of Education', 'CoEd', 'academic', 'College of Education teacher training classrooms and lecture halls', 15.4472900, 120.9386300, 15.4472900, 120.9386300, 15.4472900, 120.9386300, 4.3, 1, 1, 'approved', 'Admin', 'Admin'),
('loc-crim', 'CRIM', 'College of Criminology', 'CoC', 'academic', 'College of Criminology classrooms, drill grounds, and forensics laboratories', 15.4488800, 120.9381700, 15.4488800, 120.9381700, 15.4488800, 120.9381700, 4.5, 1, 1, 'approved', 'Admin', 'Admin'),
('loc-grandstand', 'GRD', 'NEUST Grandstand & Athletic Field', 'Oval', 'recreation', 'NEUST Athletic Field, main grandstand stage, and running track', 15.4493500, 120.9393500, 15.4493500, 120.9393500, 15.4493500, 120.9393500, 6.0, 1, 1, 'approved', 'Admin', 'Admin'),
('loc-admin', 'ADM', 'NEUST Administration Building', 'Bldg 1', 'administrative', 'Central Administrative Offices, University President, Cashier, and Registrar at Pili Ave', 15.4462000, 120.9392000, 15.4462000, 120.9392000, 15.4462000, 120.9392000, 4.0, 1, 1, 'approved', 'Admin', 'Admin'),
('loc-cmbt', 'CMBT', 'College of Management & Business Tech', 'Bldg 8', 'academic', 'Management, Accountancy, and Hospitality classrooms along Pili Ave & Narra Ave', 15.4455000, 120.9392000, 15.4455000, 120.9392000, 15.4455000, 120.9392000, 4.0, 1, 1, 'approved', 'Admin', 'Admin'),
('loc-lib', 'LIB', 'University Library', 'Bldg 6', 'academic', 'Central Learning Resource Center along Narra Ave', 15.4466000, 120.9395000, 15.4466000, 120.9395000, 15.4466000, 120.9395000, 3.8, 1, 1, 'approved', 'Admin', 'Admin'),
('loc-plaza', 'PLZ', 'University Plaza & Quadrangle', 'Plaza', 'recreation', 'Central university gathering area and student benches along Banaba St', 15.4450000, 120.9405000, 15.4450000, 120.9405000, 15.4450000, 120.9405000, 5.0, 1, 1, 'approved', 'Admin', 'Admin'),
('loc-hostel', 'HST', 'University Hostel (Rico Fajardo Hall)', 'Bldg 3', 'services', 'Student dormitories, guest accommodations, and student services on Pili Ave', 15.4448000, 120.9392000, 15.4448000, 120.9392000, 15.4448000, 120.9392000, 4.5, 1, 1, 'approved', 'Admin', 'Admin'),
('loc-nstp', 'NSTP', 'NEUST - NSTP Building', 'Bldg 4', 'administrative', 'National Service Training Program head office on Banaba St inside campus', 15.4452000, 120.9406000, 15.4452000, 120.9406000, 15.4452000, 120.9406000, 4.0, 1, 1, 'approved', 'Admin', 'Admin'),
('loc-mart', 'MRT', 'NEUST Mart & Student Food Court', 'Coop', 'services', 'Campus convenience store, book store, and cafeteria at Kasoy St & Narra Ave', 15.4468000, 120.9378000, 15.4468000, 120.9378000, 15.4468000, 120.9378000, 3.9, 1, 1, 'approved', 'Admin', 'Admin')
ON DUPLICATE KEY UPDATE `location_name` = VALUES(`location_name`);


