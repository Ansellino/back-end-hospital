import db from "../../config/database";
import { logger } from "../../utils/logger";

interface User {
  id: number;
  role: string;
}

export const seed = async () => {
  try {
    const now = new Date().toISOString();
    logger.info("Seeding notification preferences...");

    // Check if notification_preferences table exists
    const tableExists = db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='notification_preferences'`
      )
      .get();

    if (!tableExists) {
      logger.warn(
        "Notification preferences table doesn't exist, skipping seeding"
      );
      return;
    }

    // Get users
    const users = db.prepare(`SELECT id, role FROM users`).all() as User[];

    if (users.length === 0) {
      logger.warn("No users found, skipping notification preferences seeding");
      return;
    }

    // Insert preferences for each user
    for (const user of users) {
      try {
        // Check if user already has preferences
        const existingPref = db
          .prepare(`SELECT id FROM notification_preferences WHERE userId = ?`)
          .get(user.id);

        if (existingPref) {
          // Skip if user already has preferences
          continue;
        }

        // Different defaults based on role
        let emailEnabled = 1;
        let smsEnabled =
          user.role === "admin" || user.role === "doctor" ? 1 : 0;
        let pushEnabled = 1;
        let appointmentReminders = 1;
        let patientUpdates =
          user.role === "admin" ||
          user.role === "doctor" ||
          user.role === "nurse"
            ? 1
            : 0;
        let billingAlerts = user.role === "admin" ? 1 : 0;
        let systemUpdates = user.role === "admin" ? 1 : 0;
        let newFeatures = Math.random() > 0.3 ? 1 : 0; // 70% of users want to hear about new features

        db.prepare(
          `
          INSERT INTO notification_preferences (
            userId, email, sms, push, appointmentReminders, 
            patientUpdates, billingAlerts, systemUpdates, newFeatures,
            createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
        ).run(
          user.id,
          emailEnabled,
          smsEnabled,
          pushEnabled,
          appointmentReminders,
          patientUpdates,
          billingAlerts,
          systemUpdates,
          newFeatures,
          now,
          now
        );
      } catch (error) {
        logger.error(
          `Error inserting notification preferences for user ${user.id}:`,
          error
        );
      }
    }

    logger.info("Notification preferences seeded successfully");
  } catch (error) {
    logger.error("Error in notification preferences seed:", error);
    throw error;
  }
};
