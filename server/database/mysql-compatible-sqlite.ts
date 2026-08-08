import Database from "better-sqlite3";
import type { Database as DatabaseType } from "better-sqlite3";
import path from "path";
import fs from "fs";

// Database file path
const dbPath = path.join(process.cwd(), "data", "forttracker.db");

// Lazy database connection
let db: DatabaseType | null = null;
let initialized = false;

function getDB(): DatabaseType {
  if (!db) {
    // Ensure data directory exists
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Create SQLite database connection
    db = new Database(dbPath);

    // Enable foreign keys
    db.exec("PRAGMA foreign_keys = ON");
  }
  return db;
}

// MySQL-compatible database initialization
export async function initializeDatabase(): Promise<void> {
  // For SQLite, just ensure the database file exists
  getDB();
  console.log("✅ Database 'forttracker' ensured to exist (SQLite)");
}

// Test database connection (MySQL-compatible interface)
export async function testConnection(): Promise<boolean> {
  try {
    getDB();
    console.log("✅ Database connection successful (SQLite)");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}

// MySQL-compatible query execution helpers
export async function executeQuery<T = any>(
  query: string,
  params: any[] = [],
): Promise<T[]> {
  try {
    const database = getDB();
    
    // Convert MySQL syntax to SQLite syntax
    const sqliteQuery = convertMySQLToSQLite(query);
    
    if (sqliteQuery.toLowerCase().includes('select')) {
      const stmt = database.prepare(sqliteQuery);
      return stmt.all(...params) as T[];
    } else {
      const stmt = database.prepare(sqliteQuery);
      stmt.run(...params);
      return [] as T[];
    }
  } catch (error) {
    console.error("❌ Query execution failed:", error);
    console.error("Query:", query);
    console.error("Params:", params);
    throw error;
  }
}

export async function executeQuerySingle<T = any>(
  query: string,
  params: any[] = [],
): Promise<T | null> {
  const results = await executeQuery<T>(query, params);
  return results.length > 0 ? results[0] : null;
}

export async function executeInsert(
  query: string,
  params: any[] = [],
): Promise<{ insertId: number; affectedRows: number }> {
  try {
    const database = getDB();
    const sqliteQuery = convertMySQLToSQLite(query);
    const stmt = database.prepare(sqliteQuery);
    const result = stmt.run(...params);
    
    return {
      insertId: Number(result.lastInsertRowid),
      affectedRows: result.changes,
    };
  } catch (error) {
    console.error("❌ Insert execution failed:", error);
    console.error("Query:", query);
    console.error("Params:", params);
    throw error;
  }
}

export async function executeUpdate(
  query: string,
  params: any[] = [],
): Promise<{ affectedRows: number; changedRows: number }> {
  try {
    const database = getDB();
    const sqliteQuery = convertMySQLToSQLite(query);
    const stmt = database.prepare(sqliteQuery);
    const result = stmt.run(...params);
    
    return {
      affectedRows: result.changes,
      changedRows: result.changes,
    };
  } catch (error) {
    console.error("❌ Update execution failed:", error);
    console.error("Query:", query);
    console.error("Params:", params);
    throw error;
  }
}

// Gracefully close the connection
export async function closeDatabase(): Promise<void> {
  try {
    if (db) {
      db.close();
      db = null;
    }
    console.log("✅ Database connections closed (SQLite)");
  } catch (error) {
    console.error("❌ Error closing database connections:", error);
  }
}

// Convert MySQL syntax to SQLite syntax
function convertMySQLToSQLite(query: string): string {
  let sqliteQuery = query;
  
  // Replace MySQL-specific syntax with SQLite equivalents
  sqliteQuery = sqliteQuery.replace(/\bAUTO_INCREMENT\b/gi, 'AUTOINCREMENT');
  sqliteQuery = sqliteQuery.replace(/\bINT\b/gi, 'INTEGER');
  sqliteQuery = sqliteQuery.replace(/\bTIMESTAMP\b/gi, 'DATETIME');
  sqliteQuery = sqliteQuery.replace(/\bCURRENT_TIMESTAMP\b/gi, 'CURRENT_TIMESTAMP');
  sqliteQuery = sqliteQuery.replace(/\bNOW\(\)/gi, 'CURRENT_TIMESTAMP');
  sqliteQuery = sqliteQuery.replace(/\bENUM\([^)]+\)/gi, 'TEXT');
  sqliteQuery = sqliteQuery.replace(/\bDECIMAL\([^)]+\)/gi, 'REAL');
  sqliteQuery = sqliteQuery.replace(/\bVARCHAR\([^)]+\)/gi, 'TEXT');
  sqliteQuery = sqliteQuery.replace(/\bTEXT\b/gi, 'TEXT');
  sqliteQuery = sqliteQuery.replace(/\bBOOLEAN\b/gi, 'INTEGER');
  sqliteQuery = sqliteQuery.replace(/\bJSON\b/gi, 'TEXT');
  sqliteQuery = sqliteQuery.replace(/\bDATE\b/gi, 'TEXT');
  
  // Remove MySQL-specific clauses
  sqliteQuery = sqliteQuery.replace(/\bENGINE\s*=\s*InnoDB\b/gi, '');
  sqliteQuery = sqliteQuery.replace(/\bDEFAULT\s+CHARSET\s*=\s*utf8mb4\b/gi, '');
  sqliteQuery = sqliteQuery.replace(/\bCOLLATE\s*=\s*utf8mb4_unicode_ci\b/gi, '');
  sqliteQuery = sqliteQuery.replace(/\bON\s+UPDATE\s+CURRENT_TIMESTAMP\b/gi, '');
  sqliteQuery = sqliteQuery.replace(/\bFULLTEXT\s+KEY\s+[^,)]+/gi, '');
  sqliteQuery = sqliteQuery.replace(/,\s*,/g, ','); // Clean up double commas
  
  // Handle INDEX creation differently
  sqliteQuery = sqliteQuery.replace(/,\s*INDEX\s+(\w+)\s*\(([^)]+)\)/gi, '');
  
  // Remove trailing commas before closing parentheses
  sqliteQuery = sqliteQuery.replace(/,\s*\)/g, ')');
  
  return sqliteQuery;
}

// Initialize database tables with MySQL-compatible structure
export async function runMigrations(): Promise<void> {
  console.log("🚀 Running database migrations (SQLite with MySQL compatibility)...");

  try {
    // Create content_submissions table
    await executeUpdate(`
      CREATE TABLE IF NOT EXISTS content_submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL CHECK (type IN ('fort-info', 'guide-contact', 'additional-info', 'trek-enquiry')),
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        submitted_by TEXT NOT NULL,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        admin_notes TEXT,
        reviewed_by TEXT,
        reviewed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create content_submissions indexes
    await executeUpdate(`CREATE INDEX IF NOT EXISTS idx_content_type ON content_submissions(type)`);
    await executeUpdate(`CREATE INDEX IF NOT EXISTS idx_content_status ON content_submissions(status)`);
    await executeUpdate(`CREATE INDEX IF NOT EXISTS idx_content_submitted_at ON content_submissions(submitted_at)`);

    // Create fort_info table
    await executeUpdate(`
      CREATE TABLE IF NOT EXISTS fort_info (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        submission_id INTEGER,
        fort_name TEXT NOT NULL,
        location TEXT NOT NULL,
        description TEXT,
        difficulty TEXT CHECK (difficulty IN ('easy', 'moderate', 'difficult', 'very-difficult')),
        duration TEXT,
        best_time_to_visit TEXT,
        entry_fee TEXT,
        facilities TEXT,
        safety_tips TEXT,
        images TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (submission_id) REFERENCES content_submissions(id) ON DELETE CASCADE
      )
    `);

    // Create guide_contacts table
    await executeUpdate(`
      CREATE TABLE IF NOT EXISTS guide_contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        submission_id INTEGER,
        guide_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        experience TEXT,
        specialization TEXT,
        languages TEXT,
        rate TEXT,
        availability TEXT,
        description TEXT,
        rating REAL DEFAULT 0,
        total_reviews INTEGER DEFAULT 0,
        is_verified INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (submission_id) REFERENCES content_submissions(id) ON DELETE CASCADE
      )
    `);

    // Create additional_info table
    await executeUpdate(`
      CREATE TABLE IF NOT EXISTS additional_info (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        submission_id INTEGER,
        title TEXT NOT NULL,
        category TEXT NOT NULL CHECK (category IN ('travel-tip', 'route-info', 'accommodation', 'food', 'transportation', 'safety', 'weather', 'other')),
        content TEXT NOT NULL,
        related_fort TEXT,
        helpful_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (submission_id) REFERENCES content_submissions(id) ON DELETE CASCADE
      )
    `);

    // Create trek_enquiries table
    await executeUpdate(`
      CREATE TABLE IF NOT EXISTS trek_enquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        submission_id INTEGER,
        fort_name TEXT NOT NULL,
        preferred_date TEXT NOT NULL,
        number_of_people INTEGER NOT NULL,
        duration TEXT CHECK (duration IN ('half-day', 'full-day', 'overnight', 'multi-day')),
        customer_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        special_requests TEXT,
        enquiry_status TEXT DEFAULT 'new' CHECK (enquiry_status IN ('new', 'contacted', 'quoted', 'booked', 'completed', 'cancelled')),
        assigned_to TEXT,
        estimated_cost REAL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (submission_id) REFERENCES content_submissions(id) ON DELETE CASCADE
      )
    `);

    // Create file_uploads table
    await executeUpdate(`
      CREATE TABLE IF NOT EXISTS file_uploads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        submission_id INTEGER,
        original_name TEXT NOT NULL,
        stored_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        upload_status TEXT DEFAULT 'pending' CHECK (upload_status IN ('pending', 'completed', 'failed')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (submission_id) REFERENCES content_submissions(id) ON DELETE CASCADE
      )
    `);

    // Create users table for authentication
    await executeUpdate(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT,
        role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
        is_active INTEGER DEFAULT 1,
        email_verified INTEGER DEFAULT 0,
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create user_sessions table for session management
    await executeUpdate(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        session_token TEXT UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create fort_reviews table for user reviews and photos
    await executeUpdate(`
      CREATE TABLE IF NOT EXISTS fort_reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        fort_id INTEGER,
        fort_name TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review_text TEXT,
        photos TEXT, -- JSON array of photo URLs
        visit_date TEXT,
        is_approved INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Create trek_plans table for user trek plans
    await executeUpdate(`
      CREATE TABLE IF NOT EXISTS trek_plans (
        id TEXT PRIMARY KEY,
        user_id INTEGER,
        name TEXT NOT NULL,
        description TEXT,
        selected_forts TEXT NOT NULL, -- JSON array of fort IDs
        trek_date TEXT,
        group_size TEXT,
        experience TEXT,
        preferences TEXT, -- JSON array of preferences
        notes TEXT,
        estimated_duration TEXT,
        total_distance REAL,
        difficulty TEXT CHECK (difficulty IN ('Easy', 'Moderate', 'Difficult', 'Expert')),
        gear_checklist TEXT, -- JSON array of gear items
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Create indexes for users table
    await executeUpdate(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await executeUpdate(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
    await executeUpdate(`CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token)`);
    await executeUpdate(`CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id)`);
    await executeUpdate(`CREATE INDEX IF NOT EXISTS idx_reviews_user ON fort_reviews(user_id)`);
    await executeUpdate(`CREATE INDEX IF NOT EXISTS idx_reviews_fort ON fort_reviews(fort_name)`);
    await executeUpdate(`CREATE INDEX IF NOT EXISTS idx_reviews_approved ON fort_reviews(is_approved)`);
    await executeUpdate(`CREATE INDEX IF NOT EXISTS idx_trek_plans_user ON trek_plans(user_id)`);
    await executeUpdate(`CREATE INDEX IF NOT EXISTS idx_trek_plans_created ON trek_plans(created_at)`);

    // Insert default admin user if not exists
    try {
      const adminExists = await executeQuery(`SELECT id FROM users WHERE email = ? AND role = 'admin'`, ['admin@nomadtrekkers.org']);
      if (adminExists.length === 0) {
        // Default password: admin123 (in production, this should be changed)
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash('admin123', 10);

        await executeQuery(`
          INSERT INTO users (email, password_hash, full_name, role, is_active, email_verified)
          VALUES (?, ?, ?, ?, ?, ?)
        `, ['admin@nomadtrekkers.org', hashedPassword, 'System Administrator', 'admin', 1, 1]);

        console.log("✅ Default admin user created (admin@nomadtrekkers.org / admin123)");
      }
    } catch (error) {
      console.log("ℹ️ Admin user creation skipped (table may already be populated)");
    }

    console.log("✅ Database migrations completed successfully (SQLite with MySQL compatibility)");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Check if migrations are needed
export async function checkMigrationStatus(): Promise<boolean> {
  try {
    // Check for all required tables
    const requiredTables = [
      'content_submissions',
      'fort_info',
      'guide_contacts',
      'additional_info',
      'trek_enquiries',
      'file_uploads',
      'users',
      'user_sessions',
      'fort_reviews',
      'trek_plans'
    ];

    const tables = await executeQuery(`
      SELECT name FROM sqlite_master
      WHERE type='table'
    `);

    const existingTableNames = tables.map(t => t.name);
    console.log("📋 Existing tables:", existingTableNames);

    const missingTables = requiredTables.filter(table =>
      !existingTableNames.includes(table)
    );

    if (missingTables.length > 0) {
    console.log("❌ Missing tables:", missingTables);
    return false;
  }

  console.log("✅ All required tables exist");

  // Always check admin user creation
  try {
    const adminExists = await executeQuery(`SELECT id FROM users WHERE email = ? AND role = 'admin'`, ['admin@nomadtrekkers.org']);
    if (adminExists.length === 0) {
      console.log("🔧 Creating default admin user...");
      return false; // Force migration to run
    }
  } catch (error) {
    console.log("⚠️ Could not check admin user, forcing migration...");
    return false;
  }

  return true;
  } catch (error) {
    console.error("❌ Failed to check migration status:", error);
    return false;
  }
}

// Seed sample data
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

    // Sample guide contact submission
    await executeQuery(
      `
      INSERT INTO content_submissions (type, title, content, submitted_by, status, reviewed_by, reviewed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [
        "guide-contact",
        "Experienced Trek Guide - Anil Jadhav",
        JSON.stringify({
          guideName: "Anil Jadhav",
          phone: "+91 9876543210",
          email: "anil.jadhav@example.com",
          experience: "8 years",
          specialization: "Sahyadri Range, Western Ghats",
          languages: "Marathi, Hindi, English",
          rate: "₹1500 per day",
          availability: "Weekends and holidays",
          description:
            "Certified trekking guide with extensive knowledge of Sahyadri forts. Specializes in historical storytelling and safe trekking practices.",
        }),
        "Rajesh Kumar",
        "approved",
        "admin",
        new Date().toISOString(),
      ],
    );

    // Sample trek enquiry
    await executeQuery(
      `
      INSERT INTO content_submissions (type, title, content, submitted_by, status)
      VALUES (?, ?, ?, ?, ?)
    `,
      [
        "trek-enquiry",
        "Trek Booking for Sinhagad Fort",
        JSON.stringify({
          fortName: "Sinhagad Fort",
          preferredDate: "2024-02-15",
          numberOfPeople: "6",
          duration: "full-day",
          customerName: "Amit Patil",
          phone: "+91 9123456789",
          email: "amit.patil@example.com",
          specialRequests:
            "Need vegetarian meal arrangements and first aid kit",
        }),
        "Amit Patil",
        "pending",
      ],
    );

    console.log("✅ Sample data seeded successfully");
  } catch (error) {
    console.error("❌ Failed to seed sample data:", error);
    throw error;
  }
}
