-- Smart Home IoT Database Schema

CREATE DATABASE IF NOT EXISTS `smart_home_iot` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `smart_home_iot`;

-- 1. Table Users
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `role` VARCHAR(20) DEFAULT 'USER',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table Devices
CREATE TABLE IF NOT EXISTS `devices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `device_type` VARCHAR(30) NOT NULL,
  `pin` VARCHAR(10) NOT NULL,
  `state` VARCHAR(10) DEFAULT 'OFF',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table Sensors
CREATE TABLE IF NOT EXISTS `sensors` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `sensor_type` VARCHAR(30) NOT NULL,
  `unit` VARCHAR(15) NOT NULL,
  `pin` VARCHAR(10) NOT NULL,
  `status` VARCHAR(10) DEFAULT 'ACTIVE',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Table Sensors_Data
CREATE TABLE IF NOT EXISTS `sensors_data` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `sensor_id` INT NOT NULL,
  `value` DOUBLE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_sensor_created` (`sensor_id`, `created_at`),
  INDEX `idx_created_at` (`created_at`),
  CONSTRAINT `fk_sensors_data_sensor` FOREIGN KEY (`sensor_id`) REFERENCES `sensors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Table Actions_History
CREATE TABLE IF NOT EXISTS `actions_history` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `device_id` INT NOT NULL,
  `user_id` INT NULL,
  `action` VARCHAR(20) NOT NULL,
  `status` VARCHAR(20) NOT NULL,
  `time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_device_time` (`device_id`, `time`),
  INDEX `idx_time` (`time`),
  CONSTRAINT `fk_actions_history_device` FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_actions_history_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Data

-- Users Seed
INSERT INTO `users` (`id`, `username`, `password`, `full_name`, `role`) VALUES
(1, 'admin', '$2b$10$e8wWwR3y1FvN0R1y...hash', 'Đặng Xuân Quang', 'ADMIN')
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);

-- Devices Seed (Đèn 1, Đèn 2)
INSERT INTO `devices` (`id`, `name`, `device_type`, `pin`, `state`) VALUES
(1, 'Đèn 1', 'LIGHT', 'D1', 'ON'),
(2, 'Đèn 2', 'LIGHT', 'D2', 'OFF')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Sensors Seed (Nhiệt độ = 1, Độ ẩm = 2, Ánh sáng = 3)
INSERT INTO `sensors` (`id`, `name`, `sensor_type`, `unit`, `pin`, `status`) VALUES
(1, 'Nhiệt độ', 'TEMPERATURE', '°C', 'D5', 'ACTIVE'),
(2, 'Độ ẩm', 'HUMIDITY', '%', 'D5', 'ACTIVE'),
(3, 'Ánh sáng', 'LIGHT', 'lux', 'A0', 'ACTIVE')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
