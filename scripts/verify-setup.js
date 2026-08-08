#!/usr/bin/env node
import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "forttracker",
};

async function verifySetup() {
  let connection;

  try {
    console.log("🔍 Verifying database setup...");
    connection = await mysql.createConnection(dbConfig);

    // Check tables exist
    const [tables] = await connection.execute("SHOW TABLES");
    const tableNames = tables.map((row) => Object.values(row)[0]);

    const expectedTables = [
      "users",
      "user_sessions",
      "content_submissions",
      "fort_info",
      "guide_contacts",
      "additional_info",
      "trek_enquiries",
      "file_uploads",
      "fort_reviews",
      "trek_plans",
      "site_content",
      "trek_groups",
      "trek_group_participants",
    ];

    console.log("📋 Checking tables...");
    const missingTables = expectedTables.filter(
      (table) => !tableNames.includes(table),
    );

    if (missingTables.length > 0) {
      console.log("❌ Missing tables:", missingTables.join(", "));
      return false;
    }

    console.log("✅ All required tables exist");

    // Check data counts
    const queries = [
      "SELECT COUNT(*) as count FROM users",
      "SELECT COUNT(*) as count FROM fort_info",
      "SELECT COUNT(*) as count FROM content_submissions",
      "SELECT COUNT(*) as count FROM fort_reviews",
      "SELECT COUNT(*) as count FROM trek_groups",
      "SELECT COUNT(*) as count FROM site_content",
    ];

    console.log("📊 Data verification:");
    for (const query of queries) {
      const [result] = await connection.execute(query);
      const tableName = query.match(/FROM (\w+)/)[1];
      console.log(`   ${tableName}: ${result[0].count} records`);
    }

    // Test admin user
    const [adminUser] = await connection.execute(
      "SELECT email, role FROM users WHERE email = ?",
      ["admin@nomadtrekkers.org"],
    );

    if (adminUser.length > 0) {
      console.log("✅ Admin user exists");
    } else {
      console.log("❌ Admin user not found");
      return false;
    }

    // Test API connection simulation
    console.log("🔗 Testing database operations...");

    // Test insert
    await connection.execute(`
      INSERT INTO fort_reviews (fort_name, rating, review_text, is_approved, created_at)
      VALUES ('Test Fort', 5, 'Test review for verification', TRUE, NOW())
    `);

    // Test select
    const [testReview] = await connection.execute(
      "SELECT id FROM fort_reviews WHERE fort_name = ?",
      ["Test Fort"],
    );

    // Test delete
    if (testReview.length > 0) {
      await connection.execute("DELETE FROM fort_reviews WHERE id = ?", [
        testReview[0].id,
      ]);
    }

    console.log("✅ Database operations working correctly");

    console.log("\n🎉 Database setup verification completed successfully!");
    console.log("🚀 Your Fort Tracker application is ready to use!");
    console.log("\n📝 Next steps:");
    console.log("   1. Start the application: npm run dev");
    console.log("   2. Open browser: http://localhost:8080");
    console.log("   3. Login with: admin@nomadtrekkers.org / admin123");

    return true;
  } catch (error) {
    console.error("❌ Verification failed:", error.message);

    if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.log("\n💡 Fix: Check your database credentials in .env file");
    } else if (error.code === "ECONNREFUSED") {
      console.log("\n💡 Fix: Make sure MySQL server is running");
      console.log("   Windows: Start MySQL service");
      console.log("   macOS: brew services start mysql");
      console.log("   Linux: sudo systemctl start mysql");
    }

    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run verification
verifySetup().then((success) => {
  process.exit(success ? 0 : 1);
});
