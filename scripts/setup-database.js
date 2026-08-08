#!/usr/bin/env node
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "password",
  multipleStatements: true,
};

async function setupDatabase() {
  let connection;

  try {
    console.log("🚀 Connecting to MySQL server...");
    connection = await mysql.createConnection(dbConfig);
    console.log("✅ Connected to MySQL server");

    const dbName = process.env.DB_NAME || "forttracker";
    // Create database if it doesn't exist
    console.log(`📋 Creating database ${dbName} if not exists...`);
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    console.log(`✅ Database ${dbName} ensured`);

    // Use the database
    await connection.query(`USE \`${dbName}\``);

    // Read and execute migration files
    console.log("🔧 Running migrations...");

    // Run first migration
    const migration1Path = path.join(
      __dirname,
      "../database/migrations/001_create_tables.sql",
    );
    const migration1SQL = fs.readFileSync(migration1Path, "utf8");
    await connection.query(migration1SQL);
    console.log("✅ Basic tables migration completed");

    // Run second migration
    const migration2Path = path.join(
      __dirname,
      "../database/migrations/002_add_dynamic_content.sql",
    );
    const migration2SQL = fs.readFileSync(migration2Path, "utf8");
    await connection.query(migration2SQL);
    console.log("✅ Dynamic content migration completed");

    // Create admin user with hashed password
    console.log("👤 Creating admin user...");
    const adminPassword = await bcrypt.hash("admin123", 10);
    const demoPassword = await bcrypt.hash("demo123", 10);

    await connection.execute(
      `
      INSERT IGNORE INTO users (email, password_hash, full_name, role, is_active, email_verified) 
      VALUES 
      ('admin@nomadtrekkers.org', ?, 'System Administrator', 'admin', TRUE, TRUE),
      ('demo@nomadtrekkers.org', ?, 'Demo User', 'user', TRUE, TRUE)
    `,
      [adminPassword, demoPassword],
    );
    console.log("✅ Admin and demo users created");

    // Insert sample content submissions
    console.log("📝 Creating sample content...");
    const sampleSubmissions = [
      {
        type: "fort-info",
        title: "Rajgad Fort Information",
        content: {
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
        },
        submittedBy: "System Import",
      },
      {
        type: "fort-info",
        title: "Sinhagad Fort Information",
        content: {
          fortName: "Sinhagad Fort",
          location: "Pune, Maharashtra",
          description:
            "Sinhagad is a fortress located roughly 30 kilometres southwest of the city of Pune, India. Previously called Kondana, the fort has been the site of many important battles.",
          difficulty: "easy",
          duration: "3-4 hours",
          bestTimeToVisit: "October to March",
          entryFee: "Free",
          facilities: "Parking, food stalls, water points, restrooms",
          safetyTips:
            "Easy trek suitable for beginners, carry water, wear comfortable shoes",
          images: [],
        },
        submittedBy: "System Import",
      },
    ];

    for (const submission of sampleSubmissions) {
      await connection.execute(
        `
        INSERT INTO content_submissions (type, title, content, submitted_by, status, reviewed_by, reviewed_at)
        VALUES (?, ?, ?, ?, 'approved', 'admin', NOW())
      `,
        [
          submission.type,
          submission.title,
          JSON.stringify(submission.content),
          submission.submittedBy,
        ],
      );
    }

    // Insert fort_info records
    await connection.execute(`
      INSERT INTO fort_info (submission_id, fort_name, location, description, difficulty, duration, best_time_to_visit, entry_fee, facilities, safety_tips, images)
      SELECT 
        id,
        JSON_UNQUOTE(JSON_EXTRACT(content, '$.fortName')),
        JSON_UNQUOTE(JSON_EXTRACT(content, '$.location')),
        JSON_UNQUOTE(JSON_EXTRACT(content, '$.description')),
        JSON_UNQUOTE(JSON_EXTRACT(content, '$.difficulty')),
        JSON_UNQUOTE(JSON_EXTRACT(content, '$.duration')),
        JSON_UNQUOTE(JSON_EXTRACT(content, '$.bestTimeToVisit')),
        JSON_UNQUOTE(JSON_EXTRACT(content, '$.entryFee')),
        JSON_UNQUOTE(JSON_EXTRACT(content, '$.facilities')),
        JSON_UNQUOTE(JSON_EXTRACT(content, '$.safetyTips')),
        JSON_EXTRACT(content, '$.images')
      FROM content_submissions 
      WHERE type = 'fort-info' AND status = 'approved' AND submitted_by = 'System Import'
    `);

    // Insert sample reviews
    const demoUser = await connection.execute(
      "SELECT id FROM users WHERE email = ?",
      ["demo@nomadtrekkers.org"],
    );
    const demoUserId = demoUser[0][0]?.id;

    if (demoUserId) {
      await connection.execute(
        `
        INSERT INTO fort_reviews (user_id, fort_name, rating, review_text, photos, visit_date, is_approved)
        VALUES
        (?, 'Sinhagad Fort', 5, 'Amazing trek! Perfect for beginners and the views are breathtaking.', JSON_ARRAY(), '2024-01-15', TRUE),
        (?, 'Rajgad Fort', 4, 'Challenging but rewarding trek. The historical significance makes it even more special.', JSON_ARRAY(), '2024-01-20', TRUE)
      `,
        [demoUserId, demoUserId],
      );
    }

    // Insert sample trek groups
    const trekGroupsPath = path.join(
      __dirname,
      "../database/seeders/004_seed_trek_groups.sql",
    );
    const trekGroupsSQL = fs.readFileSync(trekGroupsPath, "utf8");
    await connection.query(trekGroupsSQL);

    console.log("✅ Sample content created");

    // Show setup summary
    const [userCount] = await connection.execute(
      "SELECT COUNT(*) as count FROM users",
    );
    const [fortCount] = await connection.execute(
      "SELECT COUNT(*) as count FROM fort_info",
    );
    const [reviewCount] = await connection.execute(
      "SELECT COUNT(*) as count FROM fort_reviews",
    );

    console.log("\n🎉 Database setup completed successfully!");
    console.log("📊 Setup Summary:");
    console.log(`   👥 Users: ${userCount[0].count}`);
    console.log(`   🏰 Forts: ${fortCount[0].count}`);
    console.log(`   ⭐ Reviews: ${reviewCount[0].count}`);
    console.log("\n🔐 Default Login Credentials:");
    console.log("   Admin: admin@nomadtrekkers.org / admin123");
    console.log("   Demo:  demo@nomadtrekkers.org / demo123");
    console.log("\n🚀 You can now start the application with: npm run dev");
  } catch (error) {
    console.error("❌ Database setup failed:", error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the setup
setupDatabase();
