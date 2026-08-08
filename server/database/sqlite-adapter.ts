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

// Initialize database tables (only called when needed)
function initializeTables(): void {
  if (initialized) return;

  const database = getDB();
  console.log("🚀 Initializing SQLite database...");

  // Create content_submissions table
  database.exec(`
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

  // Create indexes for better performance
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_content_type ON content_submissions(type);
    CREATE INDEX IF NOT EXISTS idx_content_status ON content_submissions(status);
    CREATE INDEX IF NOT EXISTS idx_content_submitted_at ON content_submissions(submitted_at);
  `);

  // Create file_uploads table
  database.exec(`
    CREATE TABLE IF NOT EXISTS file_uploads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_id INTEGER,
      original_name TEXT NOT NULL,
      stored_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      upload_status TEXT DEFAULT 'completed' CHECK (upload_status IN ('pending', 'completed', 'failed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (submission_id) REFERENCES content_submissions(id) ON DELETE CASCADE
    )
  `);

  // Insert sample data if tables are empty
  const count = database
    .prepare("SELECT COUNT(*) as count FROM content_submissions")
    .get() as { count: number };

  if (count.count === 0) {
    console.log("🌱 Seeding sample data...");

    // Sample fort info
    const insertSubmission = database.prepare(`
      INSERT INTO content_submissions (type, title, content, submitted_by, status, reviewed_by, reviewed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertSubmission.run(
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
      "admin",
      new Date().toISOString(),
    );

    // Sample guide contact
    insertSubmission.run(
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
    );

    // Sample trek enquiry
    insertSubmission.run(
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
        specialRequests: "Need vegetarian meal arrangements and first aid kit",
      }),
      "Amit Patil",
      "pending",
      null,
      null,
    );

    // Sample additional info
    insertSubmission.run(
      "additional-info",
      "Best Photography Spots at Lohagad",
      JSON.stringify({
        title: "Best Photography Spots at Lohagad",
        category: "travel-tip",
        content:
          "The top of Lohagad offers spectacular sunrise views. Best spots include the main citadel ruins, the cannon point, and the cliff edges overlooking the Sahyadri ranges. Early morning (5-7 AM) provides the best lighting conditions.",
        relatedFort: "Lohagad Fort",
      }),
      "Sneha Photography",
      "pending",
      null,
      null,
    );

    console.log("✅ Sample data seeded successfully");
  }

  initialized = true;
  console.log("✅ SQLite database initialized successfully");
}

// Public initialization function
export function initDB(): void {
  initializeTables();
}

// SQLite query helpers (all lazy)
export const sqliteHelpers = {
  // Get all content submissions
  getAllSubmissions(
    type: string,
    status: string,
    limit: number,
    offset: number,
  ) {
    initializeTables();
    return getDB()
      .prepare(
        `
      SELECT * FROM content_submissions 
      WHERE (? = 'all' OR type = ?) 
      AND (? = 'all' OR status = ?)
      ORDER BY submitted_at DESC
      LIMIT ? OFFSET ?
    `,
      )
      .all(type, type, status, status, limit, offset);
  },

  // Get submission by ID
  getSubmissionById(id: number) {
    initializeTables();
    return getDB()
      .prepare("SELECT * FROM content_submissions WHERE id = ?")
      .get(id);
  },

  // Create new submission
  createSubmission(
    type: string,
    title: string,
    content: string,
    submittedBy: string,
    status: string,
  ) {
    initializeTables();
    return getDB()
      .prepare(
        `
      INSERT INTO content_submissions (type, title, content, submitted_by, status)
      VALUES (?, ?, ?, ?, ?)
    `,
      )
      .run(type, title, content, submittedBy, status);
  },

  // Update submission status
  updateSubmissionStatus(
    status: string,
    adminNotes: string | null,
    reviewedBy: string,
    reviewedAt: string,
    id: number,
  ) {
    initializeTables();
    return getDB()
      .prepare(
        `
      UPDATE content_submissions 
      SET status = ?, admin_notes = ?, reviewed_by = ?, reviewed_at = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      )
      .run(status, adminNotes, reviewedBy, reviewedAt, id);
  },

  // Get statistics
  getStats: {
    total() {
      initializeTables();
      return getDB()
        .prepare("SELECT COUNT(*) as count FROM content_submissions")
        .get();
    },
    pending() {
      initializeTables();
      return getDB()
        .prepare(
          "SELECT COUNT(*) as count FROM content_submissions WHERE status = 'pending'",
        )
        .get();
    },
    approved() {
      initializeTables();
      return getDB()
        .prepare(
          "SELECT COUNT(*) as count FROM content_submissions WHERE status = 'approved'",
        )
        .get();
    },
    rejected() {
      initializeTables();
      return getDB()
        .prepare(
          "SELECT COUNT(*) as count FROM content_submissions WHERE status = 'rejected'",
        )
        .get();
    },
    byType(type: string) {
      initializeTables();
      return getDB()
        .prepare(
          "SELECT COUNT(*) as count FROM content_submissions WHERE type = ?",
        )
        .get(type);
    },
  },

  // Get approved guides
  getApprovedGuides(searchTerm: string, searchPattern: string, limit: number) {
    initializeTables();
    return getDB()
      .prepare(
        `
      SELECT * FROM content_submissions 
      WHERE type = 'guide-contact' AND status = 'approved'
      AND (? = '' OR content LIKE ?)
      ORDER BY submitted_at DESC
      LIMIT ?
    `,
      )
      .all(searchTerm, searchPattern, limit);
  },

  // Get approved additional info
  getApprovedInfo(
    fortTerm: string,
    fortPattern: string,
    categoryTerm: string,
    categoryPattern: string,
    limit: number,
  ) {
    initializeTables();
    return getDB()
      .prepare(
        `
      SELECT * FROM content_submissions 
      WHERE type = 'additional-info' AND status = 'approved'
      AND (? = '' OR content LIKE ?)
      AND (? = '' OR content LIKE ?)
      ORDER BY submitted_at DESC
      LIMIT ?
    `,
      )
      .all(fortTerm, fortPattern, categoryTerm, categoryPattern, limit);
  },

  // Get trek enquiries
  getTrekEnquiries(status: string, limit: number) {
    initializeTables();
    return getDB()
      .prepare(
        `
      SELECT * FROM content_submissions 
      WHERE type = 'trek-enquiry'
      AND (? = 'all' OR status = ?)
      ORDER BY submitted_at DESC
      LIMIT ?
    `,
      )
      .all(status, status, limit);
  },

  // Create file upload record
  createFileUpload(
    submissionId: number,
    originalName: string,
    storedName: string,
    filePath: string,
    fileSize: number,
    mimeType: string,
  ) {
    initializeTables();
    return getDB()
      .prepare(
        `
      INSERT INTO file_uploads (submission_id, original_name, stored_name, file_path, file_size, mime_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      )
      .run(
        submissionId,
        originalName,
        storedName,
        filePath,
        fileSize,
        mimeType,
      );
  },

  // Get files by submission ID
  getFilesBySubmission(submissionId: number) {
    initializeTables();
    return getDB()
      .prepare("SELECT * FROM file_uploads WHERE submission_id = ?")
      .all(submissionId);
  },
};

export default getDB;
