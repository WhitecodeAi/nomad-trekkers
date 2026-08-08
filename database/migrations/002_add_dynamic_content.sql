-- Add tables for dynamic content management
USE forttracker;

-- Create site_content table for footer, pages, and other dynamic content
CREATE TABLE IF NOT EXISTS site_content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    `type` VARCHAR(50) NOT NULL,
    slug VARCHAR(255) NULL DEFAULT NULL,
    content LONGTEXT NOT NULL,  -- Use LONGTEXT for MySQL < 5.7.8
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_type (`type`),
    INDEX idx_slug (slug),
    INDEX idx_is_published (is_published),
    UNIQUE KEY unique_type_slug (`type`, slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create trek_groups table
CREATE TABLE IF NOT EXISTS trek_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organizer_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    fort_name VARCHAR(255) NOT NULL,
    trek_date DATE NOT NULL,
    duration VARCHAR(50) NOT NULL,
    difficulty ENUM('Easy', 'Moderate', 'Difficult', 'Expert') NOT NULL,
    max_participants INT NOT NULL,
    current_participants INT DEFAULT 0,
    meeting_point VARCHAR(255) NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    content JSON, -- For included items, requirements, tags, etc.
    status ENUM('open', 'full', 'closed', 'cancelled') DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_organizer (organizer_id),
    INDEX idx_fort_name (fort_name),
    INDEX idx_trek_date (trek_date),
    INDEX idx_difficulty (difficulty),
    INDEX idx_status (status),
    FULLTEXT KEY idx_search (title, description, fort_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SHOW WARNINGS;

SHOW ERRORS;

-- Create trek_group_participants table
CREATE TABLE IF NOT EXISTS trek_group_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('joined', 'confirmed', 'cancelled') DEFAULT 'joined',
    
    FOREIGN KEY (group_id) REFERENCES trek_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_group_user (group_id, user_id),
    INDEX idx_group_id (group_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default footer content
INSERT IGNORE INTO site_content (type, content) VALUES
('footer', JSON_OBJECT(
    'aboutText', 'NomadTrekkers helps you discover and explore the magnificent forts of Maharashtra. Plan your treks, read reviews, and connect with fellow trekkers for unforgettable adventures.',
    'contactEmail', 'contact@nomadtrekkers.org',
    'contactPhone', '+91 9876543210',
    'address', 'Pune, Maharashtra, India',
    'socialLinks', JSON_OBJECT(
        'facebook', 'https://www.facebook.com/NomadTrekkers/',
        'twitter', 'https://twitter.com/nomadtrekkers',
        'instagram', 'https://instagram.com/nomadtrekkers',
        'youtube', 'https://youtube.com/nomadtrekkers'
    ),
    'quickLinks', JSON_ARRAY(
        JSON_OBJECT('name', 'About Us', 'url', '/about'),
        JSON_OBJECT('name', 'All Forts', 'url', '/forts'),
        JSON_OBJECT('name', 'Trek Planner', 'url', '/trek-planner'),
        JSON_OBJECT('name', 'Find Groups', 'url', '/trek-groups'),
        JSON_OBJECT('name', 'Guides', 'url', '/guides'),
        JSON_OBJECT('name', 'Contact', 'url', '/contact')
    )
));

COMMIT;
