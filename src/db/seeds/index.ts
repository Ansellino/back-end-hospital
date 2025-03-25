import { seed as seedUsers } from "./001_seed_users";
import { seed as seedMedicalRecords } from "./002_seed_medical_records";
import { seed as seedPrescriptions } from "./003_seed_prescriptions";
import { seed as seedBilling } from "./004_seed_billing";
import { seed as seedNotifications } from "./005_seed_notifications";
import { logger } from "../../utils/logger";

export const runSeeds = async () => {
  try {
    logger.info("Starting database seeding...");

    // Run seeds in sequence to maintain data integrity
    await seedUsers();
    logger.info("Base users, staff, patients and appointments seeded");

    await seedMedicalRecords();
    logger.info("Medical records seeded");

    await seedPrescriptions();
    logger.info("Prescriptions seeded");

    await seedBilling();
    logger.info("Billing records seeded");

    await seedNotifications();
    logger.info("Notifications seeded");

    logger.info("All seeds completed successfully");
  } catch (error) {
    logger.error("Error running seeds:", error);
    throw error;
  }
};
