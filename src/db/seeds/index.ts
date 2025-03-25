import { seed as seedUsers } from "./001_seed_users";
import { seed as seedStaff } from "./002_seed_staff";
import { seed as seedPatients } from "./003_seed_patients";
import { seed as seedAppointments } from "./004_seed_appointments";
import { seed as seedMedicalRecords } from "./005_seed_medical_records";
import { seed as seedMedications } from "./006_seed_medications";
import { seed as seedPrescriptions } from "./007_seed_prescriptions";
import { seed as seedProcedures } from "./008_seed_procedures";
import { seed as seedInvoices } from "./009_seed_invoices";
import { seed as seedNotifications } from "./010_seed_notifications";
import { logger } from "../../utils/logger";
import db from "../../config/database";
import {
  up as initMigration,
  down as dropMigration,
} from "../migrations/001_init";

/**
 * Check if a table exists in the database
 */
const tableExists = (tableName: string): boolean => {
  try {
    const result = db
      .prepare(
        `
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name=?
    `
      )
      .get(tableName);
    return !!result;
  } catch (error) {
    return false;
  }
};

/**
 * Check if the database is empty
 */
const isDatabaseEmpty = (): boolean => {
  try {
    // Check if users table exists and has data
    if (!tableExists("users")) return true;

    const userCount = db
      .prepare("SELECT COUNT(*) as count FROM users")
      .get() as { count: number };
    return userCount.count === 0;
  } catch (error) {
    // If error occurs, consider it empty
    return true;
  }
};

/**
 * Clear all data from the database without dropping tables
 */
export const clearDatabase = (): void => {
  try {
    // Disable foreign key checks temporarily
    db.pragma("foreign_keys = OFF");

    // List of tables to clear (in reverse order of dependencies)
    const tables = [
      "notification_preferences",
      "notifications",
      "payments",
      "invoice_items",
      "invoices",
      "attachments",
      "treatment_instructions",
      "procedures",
      "medications",
      "diagnoses",
      "vital_signs",
      "medical_records",
      "appointments",
      "staff_qualifications",
      "staff_schedule",
      "staff",
      "patients",
      "users",
    ];

    // Delete all data from each table
    tables.forEach((table) => {
      try {
        if (tableExists(table)) {
          db.prepare(`DELETE FROM ${table}`).run();
          logger.info(`Cleared table: ${table}`);
        }
      } catch (error: unknown) {
        // Table might not exist yet, which is fine
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logger.debug(`Could not clear table ${table}: ${errorMessage}`);
      }
    });

    // Re-enable foreign key checks
    db.pragma("foreign_keys = ON");

    logger.info("Database cleared successfully");
  } catch (error: unknown) {
    logger.error(
      "Error clearing database:",
      error instanceof Error ? error : String(error)
    );
    throw error;
  }
};

/**
 * Run seeders in sequence with detailed error handling
 */
export const runAllSeeds = async (): Promise<void> => {
  try {
    // Run all seeders in sequence
    await clearDatabase();
    try {
      await seedUsers();
      logger.info("Users seeded successfully");

      await seedStaff();
      logger.info("Staff seeded successfully");

      await seedPatients();
      logger.info("Patients seeded successfully");

      await seedAppointments();
      logger.info("Appointments seeded successfully");

      await seedMedicalRecords();
      logger.info("Medical records seeded successfully");

      await seedMedications();
      logger.info("Medications seeded successfully");

      await seedPrescriptions();
      logger.info("Prescriptions seeded successfully");

      await seedProcedures();
      logger.info("Procedures seeded successfully");

      await seedInvoices();
      logger.info("Invoices seeded successfully");

      await seedNotifications();
      logger.info("Notifications seeded successfully");
    } catch (error) {
      logger.error("Error in seeding:", error);
      throw error;
    }

    logger.info("Database seeding completed successfully");
  } catch (error: unknown) {
    logger.error(
      "Error running seeds:",
      error instanceof Error ? error : String(error)
    );
    throw error;
  }
};

/**
 * Standard seeding function with safety checks
 */
export const runSeeds = async (forceClear = false): Promise<void> => {
  try {
    logger.info("Starting database seeding process...");

    // Check if database exists and has data
    const isEmpty = isDatabaseEmpty();

    if (!isEmpty && !forceClear) {
      logger.warn(
        "Database already contains data. Skipping seed process. Use --force-clear flag to force reseeding."
      );
      return;
    }

    // Clear existing data if needed
    if (forceClear || !isEmpty) {
      clearDatabase();
    }

    // Run all seeders
    await runAllSeeds();
  } catch (error: unknown) {
    logger.error(
      "Error in seed process:",
      error instanceof Error ? error : String(error)
    );
    throw error;
  }
};

/**
 * Migrate:refresh equivalent - drops and recreates schema, then seeds
 */
export const refreshDatabase = async (): Promise<void> => {
  try {
    logger.info("Starting complete database refresh...");

    // 1. Disable foreign key constraints
    db.pragma("foreign_keys = OFF");
    logger.info("Foreign key constraints disabled");

    try {
      // 2. Drop all tables
      logger.info("Dropping all tables...");
      dropMigration();
      logger.info("All tables dropped successfully");

      // 3. Run migrations to recreate schema
      logger.info("Running migrations to recreate schema...");
      initMigration();
      logger.info("Schema recreation completed successfully");

      // 4. Re-enable foreign keys
      db.pragma("foreign_keys = ON");
      logger.info("Foreign key constraints re-enabled");

      // 5. Seed with fresh data
      logger.info("Seeding fresh data...");
      await runAllSeeds();
    } catch (error) {
      // Re-enable foreign keys even on error
      db.pragma("foreign_keys = ON");
      throw error;
    }

    logger.info("Database refresh completed successfully");
  } catch (error: unknown) {
    logger.error(
      "Error during database refresh:",
      error instanceof Error ? error : String(error)
    );
    throw error;
  }
};
