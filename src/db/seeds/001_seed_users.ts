import db from "../../config/database";
import bcryptjs from "bcryptjs";
import { logger } from "../../utils/logger";

export const seed = async () => {
  try {
    const now = new Date().toISOString();
    const hashedPassword = await bcryptjs.hash("password123", 10);

    // Insert users
    logger.info("Seeding users...");
    
    // Admin user
    db.prepare(`
      INSERT INTO users (username, email, password, firstName, lastName, role, permissions, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "admin",
      "admin@hospital.com",
      hashedPassword,
      "Admin",
      "User",
      "admin",
      JSON.stringify(["*:*"]),
      now,
      now
    );

    // Doctor user
    db.prepare(`
      INSERT INTO users (username, email, password, firstName, lastName, role, permissions, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "doctor",
      "doctor@hospital.com",
      hashedPassword,
      "John",
      "Smith",
      "doctor",
      JSON.stringify([
        "view:patients",
        "create:medical-records",
        "edit:appointments",
      ]),
      now,
      now
    );

    // Nurse user
    db.prepare(`
      INSERT INTO users (username, email, password, firstName, lastName, role, permissions, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "nurse",
      "nurse@hospital.com",
      hashedPassword,
      "Jane",
      "Doe",
      "nurse",
      JSON.stringify(["view:patients", "view:medical-records"]),
      now,
      now
    );

    // Receptionist user
    db.prepare(`
      INSERT INTO users (username, email, password, firstName, lastName, role, permissions, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "receptionist",
      "receptionist@hospital.com",
      hashedPassword,
      "Mary",
      "Johnson",
      "receptionist",
      JSON.stringify([
        "view:patients",
        "create:appointments",
        "edit:appointments",
      ]),
      now,
      now
    );
    
    logger.info("Users seeded successfully");
  } catch (error) {
    logger.error("Error seeding users:", error);
    throw error;
  }
};