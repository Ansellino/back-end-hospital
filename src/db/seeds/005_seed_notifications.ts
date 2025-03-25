import db from "../../config/database";
import { logger } from "../../utils/logger";
import { v4 as uuidv4 } from "uuid";

// Define interface for user data
interface UserRecord {
  id: number;
  role: string;
}

export const seed = async () => {
  const now = new Date().toISOString();

  // Get users to send notifications to with type assertion
  const users = db
    .prepare(
      `
    SELECT id, role FROM users
  `
    )
    .all() as UserRecord[];

  if (users.length === 0) {
    logger.warn("No users found, skipping notifications seeding");
    return;
  }

  const notificationTypes = [
    {
      type: "appointment",
      title: "Upcoming Appointment",
      content: "You have an appointment scheduled for tomorrow.",
    },
    {
      type: "medical_record",
      title: "Medical Record Updated",
      content: "Your medical record has been updated with new information.",
    },
    {
      type: "prescription",
      title: "New Prescription",
      content: "A new prescription has been added to your records.",
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
      content: "You have received a new message from your healthcare provider.",
    },
  ];

  // Create notifications for each user
  for (const user of users) {
    // 1-4 random notifications per user
    const notificationCount = Math.floor(Math.random() * 4) + 1;

    for (let i = 0; i < notificationCount; i++) {
      const notification =
        notificationTypes[Math.floor(Math.random() * notificationTypes.length)];

      // Random read status (70% chance of being read)
      const isRead = Math.random() < 0.7;

      // Random creation date (0-7 days ago)
      const creationDate = new Date();
      creationDate.setDate(
        creationDate.getDate() - Math.floor(Math.random() * 7)
      );

      // Read date if read (after creation date)
      let readDate = null;
      if (isRead) {
        readDate = new Date(creationDate);
        readDate.setHours(
          readDate.getHours() + Math.floor(Math.random() * 10) + 1
        );
      }

      db.prepare(
        `
        INSERT INTO notifications (userId, type, title, content, isRead, readAt, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
      ).run(
        user.id,
        notification.type,
        notification.title,
        notification.content + ` (User role: ${user.role})`,
        isRead ? 1 : 0,
        readDate ? readDate.toISOString() : null,
        creationDate.toISOString(),
        now
      );
    }
  }

  logger.info("Notifications seeded successfully");
};
