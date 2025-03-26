import db from "../../config/database";
import { logger } from "../../utils/logger";

interface User {
  id: number;
  role: string;
}

export const seed = async () => {
  try {
    const now = new Date().toISOString();
    logger.info("Seeding notifications...");

    // Check if notifications table exists
    const tableExists = db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='notifications'`
      )
      .get();

    if (!tableExists) {
      logger.warn(
        "Notifications table doesn't exist, skipping notifications seeding"
      );
      return;
    }

    // Get users
    const users = db.prepare(`SELECT id, role FROM users`).all() as User[];

    if (users.length === 0) {
      logger.warn("No users found, skipping notifications seeding");
      return;
    }

    const notifications = [
      {
        type: "appointment",
        title: "Appointment Reminder",
        content: "You have an upcoming appointment tomorrow at 10:00 AM.",
      },
      {
        type: "appointment",
        title: "Appointment Changed",
        content: "Your appointment has been rescheduled to next week.",
      },
      {
        type: "system",
        title: "System Update",
        content: "We've improved the patient portal with new features.",
      },
      {
        type: "patient",
        title: "Test Results Available",
        content: "Your recent lab test results are now available for review.",
      },
      {
        type: "medical_record",
        title: "Medical Record Updated",
        content: "Your medical record has been updated with new information.",
      },
      {
        type: "billing",
        title: "Invoice Generated",
        content: "A new invoice has been generated for your recent visit.",
      },
      {
        type: "system",
        title: "System Maintenance",
        content: "The system will be down for maintenance tonight from 2-4 AM.",
      },
      {
        type: "message",
        title: "New Message",
        content:
          "You have received a new message from your healthcare provider.",
      },
    ];

    // Create notifications for each user
    for (const user of users) {
      // 1-4 random notifications per user
      const notificationCount = Math.floor(Math.random() * 4) + 1;

      for (let i = 0; i < notificationCount; i++) {
        // Random notification
        const notification =
          notifications[Math.floor(Math.random() * notifications.length)];

        // Random creation date within past 30 days
        const creationDate = new Date();
        creationDate.setDate(
          creationDate.getDate() - Math.floor(Math.random() * 30)
        );

        // 70% chance of being read
        const isRead = Math.random() < 0.7;

        // If read, add read date between creation date and now
        let readDate = null;
        if (isRead) {
          readDate = new Date(creationDate);
          readDate.setHours(
            readDate.getHours() + Math.floor(Math.random() * 48)
          );

          // Make sure read date is not in the future
          if (readDate > new Date()) {
            readDate = new Date();
          }
        }

        try {
          // Insert notification with schema that matches your db structure
          db.prepare(
            `
            INSERT INTO notifications (
              recipientId, title, message, type, isRead, relatedId, actionUrl, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `
          ).run(
            user.id,
            notification.title,
            notification.content + ` (User role: ${user.role})`,
            notification.type,
            isRead ? 1 : 0,
            null, // relatedId
            null, // actionUrl
            creationDate.toISOString(),
            now
          );
        } catch (error) {
          logger.error(
            `Error inserting notification for user ${user.id}:`,
            error
          );
        }
      }
    }

    logger.info("Notifications seeded successfully");
  } catch (error) {
    logger.error("Error in notifications seed:", error);
    throw error;
  }
};
