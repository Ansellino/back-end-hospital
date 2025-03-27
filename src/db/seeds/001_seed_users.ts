import db from "../../config/database";
import { logger } from "../../utils/logger";
import bcryptjs from "bcryptjs";

export const seed = async () => {
  try {
    const now = new Date().toISOString();

    // Use the exact passwords from mockAuthService.ts
    const adminPassword = await bcryptjs.hash("admin123", 10);
    const doctorPassword = await bcryptjs.hash("doctor123", 10);
    const nursePassword = await bcryptjs.hash("nurse123", 10);
    const receptionistPassword = await bcryptjs.hash("reception123", 10);

    // Insert users
    logger.info("Seeding users...");

    // Admin user - fixed to match mockAuthService
    db.prepare(
      `
      INSERT INTO users (username, email, password, firstName, lastName, role, permissions, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      "admin",
      "admin@healthcare.com", // Changed to match mockAuthService
      adminPassword, // Changed to match mockAuthService
      "Admin",
      "User",
      "admin",
      JSON.stringify(["*:*"]),
      now,
      now
    );

    // Doctor user
    db.prepare(
      `
      INSERT INTO users (username, email, password, firstName, lastName, role, permissions, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      "doctor",
      "doctor@healthcare.com", // Changed domain to match mockAuthService
      doctorPassword, // Changed to match mockAuthService
      "John",
      "Smith",
      "doctor",
      JSON.stringify([
        "view:patients",
        "edit:patients",
        "view:appointments",
        "create:appointments",
        "edit:appointments",
        "view:medical-records",
        "create:medical-records",
        "edit:medical-records",
      ]),
      now,
      now
    );

    // Nurse user
    db.prepare(
      `
      INSERT INTO users (username, email, password, firstName, lastName, role, permissions, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      "nurse",
      "nurse@healthcare.com", // Changed domain to match mockAuthService
      nursePassword, // Changed to match mockAuthService
      "Jane",
      "Doe",
      "nurse",
      JSON.stringify([
        "view:patients",
        "view:appointments",
        "view:medical-records",
      ]),
      now,
      now
    );

    // Receptionist user
    db.prepare(
      `
      INSERT INTO users (username, email, password, firstName, lastName, role, permissions, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      "receptionist",
      "reception@healthcare.com", // Changed to match mockAuthService
      receptionistPassword, // Changed to match mockAuthService
      "Mary",
      "Johnson",
      "receptionist",
      JSON.stringify([
        "view:patients",
        "create:patients",
        "view:appointments",
        "create:appointments",
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
