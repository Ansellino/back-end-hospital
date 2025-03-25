import { up as initMigration } from "../db/migrations/001_init";
import { runSeeds, refreshDatabase } from "../db/seeds";
import { logger } from "../utils/logger";

// Process command line arguments
const args = process.argv.slice(2);
const runMigrations = !args.includes("--skip-migrations");
const runSeedData = !args.includes("--skip-seeds");
const forceClear = args.includes("--force-clear");
const refreshMode = args.includes("--refresh");

(async () => {
  try {
    // If refresh mode is active, do a complete refresh (like Laravel migrate:refresh --seed)
    if (refreshMode) {
      try {
        await refreshDatabase();
        logger.info("Database refreshed successfully");
        process.exit(0);
      } catch (error) {
        logger.error("Database refresh failed:", error);
        process.exit(1);
      }
      return;
    }

    // Normal mode - migrations and seeds separately
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
        await runSeeds(forceClear);
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
