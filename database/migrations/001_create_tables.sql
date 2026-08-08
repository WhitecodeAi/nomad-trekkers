-- Fort Tracker Database Migration
-- MySQL 8.0+ Compatible
-- Run this script to set up the complete database schema

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS forttracker 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE forttracker;

-- Drop tables in reverse dependency order (if they exist)
DROP TABLE IF EXISTS trek_group_participants;
DROP TABLE IF EXISTS trek_groups;
DROP TABLE IF EXISTS site_content;
DROP TABLE IF EXISTS trek_plans;
DROP TABLE IF EXISTS fort_reviews;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS file_uploads;
DROP TABLE IF EXISTS trek_enquiries;
DROP TABLE IF EXISTS additional_info;
DROP TABLE IF EXISTS guide_contacts;
DROP TABLE IF EXISTS fort_info;
DROP TABLE IF EXISTS content_submissions;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('user', 'admin') DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create user_sessions table
CREATE TABLE user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_session_token (session_token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create content_submissions table
CREATE TABLE content_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('fort-info', 'guide-contact', 'additional-info', 'trek-enquiry') NOT NULL,
    title VARCHAR(255) NOT NULL,
    content JSON NOT NULL,
    submitted_by VARCHAR(255) NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    admin_notes TEXT NULL,
    reviewed_by VARCHAR(255) NULL,
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_submitted_at (submitted_at),
    INDEX idx_type_status (type, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create fort_info table
CREATE TABLE fort_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT,
    fort_name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty ENUM('easy', 'moderate', 'difficult', 'very-difficult'),
    duration VARCHAR(100),
    best_time_to_visit VARCHAR(255),
    entry_fee VARCHAR(100),
    facilities TEXT,
    safety_tips TEXT,
    images JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (submission_id) REFERENCES content_submissions(id) ON DELETE CASCADE,
    INDEX idx_fort_name (fort_name),
    INDEX idx_difficulty (difficulty),
    FULLTEXT KEY idx_search (fort_name, location, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create guide_contacts table
CREATE TABLE guide_contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT,
    guide_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    experience VARCHAR(100),
    specialization TEXT,
    languages VARCHAR(255),
    rate VARCHAR(100),
    availability VARCHAR(255),
    description TEXT,
    rating DECIMAL(3,2) DEFAULT 0,
    total_reviews INT DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (submission_id) REFERENCES content_submissions(id) ON DELETE CASCADE,
    INDEX idx_guide_name (guide_name),
    INDEX idx_is_verified (is_verified),
    FULLTEXT KEY idx_search (guide_name, specialization, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create additional_info table
CREATE TABLE additional_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT,
    title VARCHAR(255) NOT NULL,
    category ENUM('travel-tip', 'route-info', 'accommodation', 'food', 'transportation', 'safety', 'weather', 'other') NOT NULL,
    content TEXT NOT NULL,
    related_fort VARCHAR(255),
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (submission_id) REFERENCES content_submissions(id) ON DELETE CASCADE,
    INDEX idx_category (category),
    INDEX idx_related_fort (related_fort),
    FULLTEXT KEY idx_search (title, content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create trek_enquiries table
CREATE TABLE trek_enquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT,
    fort_name VARCHAR(255) NOT NULL,
    preferred_date DATE NOT NULL,
    number_of_people INT NOT NULL,
    duration ENUM('half-day', 'full-day', 'overnight', 'multi-day'),
    customer_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    special_requests TEXT,
    enquiry_status ENUM('new', 'contacted', 'quoted', 'booked', 'completed', 'cancelled') DEFAULT 'new',
    assigned_to VARCHAR(255),
    estimated_cost DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (submission_id) REFERENCES content_submissions(id) ON DELETE CASCADE,
    INDEX idx_fort_name (fort_name),
    INDEX idx_preferred_date (preferred_date),
    INDEX idx_enquiry_status (enquiry_status),
    INDEX idx_customer_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create file_uploads table
CREATE TABLE file_uploads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT,
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    upload_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (submission_id) REFERENCES content_submissions(id) ON DELETE CASCADE,
    INDEX idx_submission_id (submission_id),
    INDEX idx_stored_name (stored_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create fort_reviews table
CREATE TABLE fort_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    fort_id INT,
    fort_name VARCHAR(255) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    photos JSON,
    visit_date DATE,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_fort_name (fort_name),
    INDEX idx_is_approved (is_approved),
    INDEX idx_rating (rating),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create trek_plans table
CREATE TABLE trek_plans (
    id VARCHAR(255) PRIMARY KEY,
    user_id INT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    selected_forts JSON NOT NULL,
    trek_date DATE,
    group_size VARCHAR(50),
    experience VARCHAR(50),
    preferences JSON,
    notes TEXT,
    estimated_duration VARCHAR(50),
    total_distance DECIMAL(8,2),
    difficulty ENUM('Easy', 'Moderate', 'Difficult', 'Expert'),
    gear_checklist JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_trek_date (trek_date),
    INDEX idx_difficulty (difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enable full-text search optimization
-- OPTIMIZE TABLE fort_info;
-- OPTIMIZE TABLE guide_contacts;
-- OPTIMIZE TABLE additional_info;

COMMIT;
