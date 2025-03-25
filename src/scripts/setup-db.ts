import { up as initMigration } from "../db/migrations/001_init";
import { runSeeds } from "../db/seeds";
import { logger } from "../utils/logger";

// Process command line arguments
const args = process.argv.slice(2);
const runMigrations = !args.includes("--skip-migrations");
const runSeedData = !args.includes("--skip-seeds");

(async () => {
  try {
    if (runMigrations) {
      logger.info("Running database migrations...");
      try {
        initMigration();
        logger.info("Migrations completed successfully");
      } catch (migrationError) {
        logger.error("Migration failed:", migrationError);
        process.exit(1);
      }
    }

    if (runSeedData) {
      logger.info("Seeding database...");
      try {
        await runSeeds();
        logger.info("Database seeded successfully");
      } catch (seedError) {
        logger.error("Database seeding failed:", seedError);
        process.exit(1);
      }
    }

    logger.info("Database setup completed successfully");
    process.exit(0);
  } catch (error) {
    logger.error("Database setup failed:", error);
    process.exit(1);
  }
})();
