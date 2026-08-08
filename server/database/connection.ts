import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "forttracker",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
  timezone: "+00:00",
};

// Create connection pool
export const pool = mysql.createPool(dbConfig);

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    console.log("✅ MySQL database connection successful");
    connection.release();
    return true;
  } catch (error) {
    console.error("❌ MySQL database connection failed:", error);
    console.error("📋 To set up MySQL, please see README-MYSQL.md");
    console.error("🔧 Quick setup: docker-compose up -d mysql");
    return false;
  }
}

// Initialize database (create database if it doesn't exist)
export async function initializeDatabase(): Promise<void> {
  try {
    // First, try to connect to the specific database directly
    // This allows working with shared hosting where we can't connect without a DB selected
    try {
      const poolWithDb = mysql.createPool(dbConfig);
      const connection = await poolWithDb.getConnection();
      connection.release();
      await poolWithDb.end();
      console.log(`✅ Database '${dbConfig.database}' exists and is accessible`);
      return;
    } catch (err: any) {
      console.log(`ℹ️  Could not connect to database '${dbConfig.database}' directly, attempting to create it...`);
    }

    // Connect without specifying database to create it if needed
    const tempConfig = { ...dbConfig };
    delete tempConfig.database;
    const tempPool = mysql.createPool(tempConfig);

    const connection = await tempPool.getConnection();

    // Create database if it doesn't exist
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    console.log(`✅ Database '${dbConfig.database}' ensured to exist`);

    connection.release();
    await tempPool.end();

    // Test connection to the actual database
    await testConnection();
  } catch (error) {
    console.error("❌ Failed to initialize database:", error);
    throw error;
  }
}

// Helper function to execute queries with fallback
export async function executeQuery<T = any>(
  query: string,
  params: any[] = [],
): Promise<T[]> {
  try {
    const [rows] = await pool.execute(query, params);
    return rows as T[];
  } catch (error) {
    console.error("❌ Query execution failed:", error);
    if (error.code === 'ECONNREFUSED') {
      console.error("🔌 MySQL connection refused - returning empty result");
      return [];
    }
    console.error("Query:", query);
    console.error("Params:", params);
    throw error;
  }
}

// Helper function for single row queries with fallback
export async function executeQuerySingle<T = any>(
  query: string,
  params: any[] = [],
): Promise<T | null> {
  try {
    const results = await executeQuery<T>(query, params);
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error("🔌 MySQL connection refused - returning null");
      return null;
    }
    throw error;
  }
}

// Helper function for insert operations with fallback
export async function executeInsert(
  query: string,
  params: any[] = [],
): Promise<{ insertId: number; affectedRows: number }> {
  try {
    const [result] = await pool.execute(query, params);
    const insertResult = result as mysql.ResultSetHeader;
    return {
      insertId: insertResult.insertId,
      affectedRows: insertResult.affectedRows,
    };
  } catch (error) {
    console.error("❌ Insert execution failed:", error);
    if (error.code === 'ECONNREFUSED') {
      console.error("🔌 MySQL connection refused - returning mock insert result");
      return { insertId: 0, affectedRows: 0 };
    }
    console.error("Query:", query);
    console.error("Params:", params);
    throw error;
  }
}

// Helper function for update/delete operations with fallback
export async function executeUpdate(
  query: string,
  params: any[] = [],
): Promise<{ affectedRows: number; changedRows: number }> {
  try {
    const [result] = await pool.execute(query, params);
    const updateResult = result as mysql.ResultSetHeader;
    return {
      affectedRows: updateResult.affectedRows,
      changedRows: updateResult.changedRows || 0,
    };
  } catch (error) {
    console.error("❌ Update execution failed:", error);
    if (error.code === 'ECONNREFUSED') {
      console.error("🔌 MySQL connection refused - returning mock update result");
      return { affectedRows: 0, changedRows: 0 };
    }
    console.error("Query:", query);
    console.error("Params:", params);
    throw error;
  }
}

// Gracefully close the connection pool
export async function closeDatabase(): Promise<void> {
  try {
    await pool.end();
    console.log("✅ Database connections closed");
  } catch (error) {
    console.error("❌ Error closing database connections:", error);
  }
}
