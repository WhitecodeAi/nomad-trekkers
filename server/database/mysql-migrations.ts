import { executeQuery, executeUpdate } from "./connection.js";
import bcrypt from 'bcrypt';

// Database schema creation for MySQL
export async function runMigrations(): Promise<void> {
  console.log("🚀 Running MySQL database migrations...");

  try {
    // Create content_submissions table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS content_submissions (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create fort_info table for structured fort information
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS fort_info (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create guide_contacts table for structured guide information
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS guide_contacts (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create additional_info table for structured additional information
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS additional_info (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create trek_enquiries table for structured trek booking enquiries
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS trek_enquiries (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create file_uploads table for tracking uploaded files
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS file_uploads (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create users table for authentication
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS users (
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
        INDEX idx_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create user_sessions table for session management
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_session_token (session_token),
        INDEX idx_user_id (user_id),
        INDEX idx_expires_at (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create fort_reviews table for user reviews and photos
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS fort_reviews (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create trek_plans table for user trek plans
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS trek_plans (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create trek_groups table for group treks
    await executeQuery(`
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
        content JSON,
        status ENUM('open', 'full', 'closed', 'cancelled') DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_organizer (organizer_id),
        INDEX idx_fort_name (fort_name),
        INDEX idx_trek_date (trek_date),
        INDEX idx_difficulty (difficulty),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create trek_group_participants table for tracking group joins
    await executeQuery(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create site_content table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS site_content (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type ENUM('footer', 'page', 'announcement', 'feature') NOT NULL,
        slug VARCHAR(255) NULL,
        content JSON NOT NULL,
        is_published BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_type (type),
        INDEX idx_slug (slug),
        INDEX idx_is_published (is_published),
        UNIQUE KEY unique_type_slug (type, slug)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Insert default footer content if not exists
    try {
      const footerExists = await executeQuery(`SELECT id FROM site_content WHERE type = 'footer'`);
      if (footerExists.length === 0) {
        await executeQuery(`
          INSERT INTO site_content (type, content) VALUES
          ('footer', ?)
        `, [JSON.stringify({
          aboutText: 'NomadTrekkers helps you discover and explore the magnificent forts of Maharashtra. Plan your treks, read reviews, and connect with fellow trekkers for unforgettable adventures.',
          contactEmail: 'contact@nomadtrekkers.org',
          contactPhone: '+91 9876543210',
          address: 'Pune, Maharashtra, India',
          socialLinks: {
            facebook: 'https://www.facebook.com/NomadTrekkers/',
            twitter: 'https://twitter.com/nomadtrekkers',
            instagram: 'https://instagram.com/nomadtrekkers',
            youtube: 'https://youtube.com/nomadtrekkers'
          },
          quickLinks: [
            { name: 'About Us', url: '/about' },
            { name: 'All Forts', url: '/forts' },
            { name: 'Trek Planner', url: '/trek-planner' },
            { name: 'Find Groups', url: '/trek-groups' },
            { name: 'Guides', url: '/guides' },
            { name: 'Contact', url: '/contact' }
          ]
        })])
        console.log("✅ Default footer content created");
      }
    } catch (error: any) {
      console.log("ℹ️ Default footer content creation skipped/failed:", error.message);
    }

    // Insert default admin user if not exists
    try {
      const adminExists = await executeQuery(`SELECT id FROM users WHERE email = ? AND role = 'admin'`, ['admin@nomadtrekkers.org']);
      if (adminExists.length === 0) {
        const hashedPassword = await bcrypt.hash('admin123', 10);

        await executeQuery(`
          INSERT INTO users (email, password_hash, full_name, role, is_active, email_verified)
          VALUES (?, ?, ?, ?, ?, ?)
        `, ['admin@nomadtrekkers.org', hashedPassword, 'System Administrator', 'admin', true, true]);

        console.log("✅ Default admin user created (admin@nomadtrekkers.org / admin123)");
      }
    } catch (error) {
      console.log("ℹ️ Admin user creation skipped (table may already be populated)");
    }

    console.log("✅ MySQL database migrations completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Function to check if migrations are needed
export async function checkMigrationStatus(): Promise<boolean> {
  try {
    const requiredTables = ['content_submissions', 'trek_groups', 'trek_group_participants', 'site_content'];
    const tables = await executeQuery(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME IN (?, ?, ?, ?)
    `, requiredTables);

    const existingTableNames = tables.map((row: any) => row.TABLE_NAME);
    const missingTables = requiredTables.filter((table) => !existingTableNames.includes(table));

    if (missingTables.length > 0) {
      console.log(`⚠️ Missing migration tables: ${missingTables.join(', ')}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("❌ Failed to check migration status:", error);
    return false;
  }
}

// Seed some sample data for development
export async function seedSampleData(): Promise<void> {
  console.log("🌱 Seeding sample data...");

  try {
    // Check if data already exists
    const existingData = await executeQuery(
      "SELECT COUNT(*) as count FROM content_submissions",
    );
    if (existingData[0].count > 0) {
      console.log("📊 Sample data already exists, skipping seed");
      return;
    }

    // Sample fort info submission
    await executeQuery(
      `
      INSERT INTO content_submissions (type, title, content, submitted_by, status)
      VALUES (?, ?, ?, ?, ?)
    `,
      [
        "fort-info",
        "Rajgad Fort Information",
        JSON.stringify({
          fortName: "Rajgad Fort",
          location: "Pune, Maharashtra",
          description:
            "Rajgad is a hill fort situated in the Pune district of Maharashtra, India. Formerly known as Murumdev, the fort was the capital of the Maratha Empire under the rule of Chhatrapati Shivaji Maharaj for almost 26 years.",
          difficulty: "moderate",
          duration: "5-6 hours",
          bestTimeToVisit: "October to March",
          entryFee: "Free",
          facilities:
            "Parking available at base village, basic food stalls, water points along the trail",
          safetyTips:
            "Carry enough water, wear proper trekking shoes, avoid during monsoon due to slippery rocks",
          images: [],
        }),
        "Priya Sharma",
        "approved",
      ],
    );

    console.log("✅ Sample data seeded successfully");
  } catch (error) {
    console.error("❌ Failed to seed sample data:", error);
    throw error;
  }
}
