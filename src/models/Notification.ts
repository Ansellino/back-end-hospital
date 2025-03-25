import db from "../config/database";
import { logger } from "../utils/logger";
import {
  Notification,
  NotificationType,
  NotificationQueryParams,
} from "../types/notification";

/**
 * Initialize notifications table
 */
export const createNotificationsTable = async (): Promise<void> => {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipientId INTEGER NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        isRead INTEGER DEFAULT 0,
        relatedId TEXT,
        actionUrl TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (recipientId) REFERENCES users (id) ON DELETE CASCADE
      )
    `);
    logger.info("Notifications table initialized");
  } catch (error) {
    logger.error("Error initializing notifications table:", error);
    throw new Error("Failed to initialize notifications table");
  }
};

/**
 * Initialize notification preferences table
 */
export const createNotificationPreferencesTable = async (): Promise<void> => {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS notification_preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL UNIQUE,
        email INTEGER DEFAULT 1,
        sms INTEGER DEFAULT 0,
        push INTEGER DEFAULT 1,
        appointmentReminders INTEGER DEFAULT 1,
        patientUpdates INTEGER DEFAULT 1,
        billingAlerts INTEGER DEFAULT 1,
        systemUpdates INTEGER DEFAULT 1, 
        newFeatures INTEGER DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
      )
    `);
    logger.info("Notification preferences table initialized");
  } catch (error) {
    logger.error("Error initializing notification preferences table:", error);
    throw new Error("Failed to initialize notification preferences table");
  }
};

/**
 * Get all notifications for a specific user
 */
export const getNotificationsByUserId = async (
  userId: number,
  params: NotificationQueryParams = {}
): Promise<Notification[]> => {
  try {
    let query = `
      SELECT * FROM notifications
      WHERE recipientId = ?
    `;

    const queryParams: any[] = [userId];

    // Add filter by type
    if (params.type) {
      if (Array.isArray(params.type)) {
        query += ` AND type IN (${params.type.map(() => "?").join(",")})`;
        queryParams.push(...params.type);
      } else {
        query += ` AND type = ?`;
        queryParams.push(params.type);
      }
    }

    // Add filter by read status
    if (params.isRead !== undefined) {
      query += ` AND isRead = ?`;
      queryParams.push(params.isRead ? 1 : 0);
    }

    // Add date range filter
    if (params.startDate) {
      query += ` AND createdAt >= ?`;
      queryParams.push(params.startDate);
    }

    if (params.endDate) {
      query += ` AND createdAt <= ?`;
      queryParams.push(params.endDate);
    }

    // Order by createdAt desc (newest first)
    query += ` ORDER BY createdAt DESC`;

    // Add limit if specified
    if (params.limit) {
      query += ` LIMIT ?`;
      queryParams.push(params.limit);
    }

    // Add pagination if specified
    if (params.page && params.limit) {
      const offset = (params.page - 1) * params.limit;
      query += ` OFFSET ?`;
      queryParams.push(offset);
    }

    const notifications = db
      .prepare(query)
      .all(...queryParams) as Notification[];

    // Convert isRead from INTEGER to boolean
    return notifications.map((notification) => ({
      ...notification,
      isRead: Boolean(notification.isRead),
    }));
  } catch (error) {
    logger.error(`Error getting notifications for user ${userId}:`, error);
    throw new Error("Failed to retrieve notifications");
  }
};

/**
 * Get unread notification count for a user
 */
export const getUnreadCount = async (userId: number): Promise<number> => {
  try {
    const result = db
      .prepare(
        `
      SELECT COUNT(*) as count FROM notifications
      WHERE recipientId = ? AND isRead = 0
    `
      )
      .get(userId) as { count: number };

    return result.count;
  } catch (error) {
    logger.error(`Error getting unread count for user ${userId}:`, error);
    throw new Error("Failed to retrieve unread notification count");
  }
};

/**
 * Get a single notification by ID
 */
export const getNotificationById = async (
  id: number
): Promise<Notification | null> => {
  try {
    const notification = db
      .prepare(
        `
      SELECT * FROM notifications
      WHERE id = ?
    `
      )
      .get(id) as Notification | undefined;

    if (!notification) {
      return null;
    }

    return {
      ...notification,
      isRead: Boolean(notification.isRead),
    };
  } catch (error) {
    logger.error(`Error getting notification with id ${id}:`, error);
    throw new Error("Failed to retrieve notification");
  }
};

/**
 * Create a new notification
 */
export const createNotification = async (
  data: Omit<Notification, "id" | "createdAt" | "updatedAt" | "isRead">
): Promise<Notification> => {
  try {
    const now = new Date().toISOString();

    const result = db
      .prepare(
        `
      INSERT INTO notifications (
        recipientId, title, message, type, isRead,
        relatedId, actionUrl, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        data.recipientId,
        data.title,
        data.message,
        data.type,
        0, // isRead = false
        data.relatedId || null,
        data.actionUrl || null,
        now,
        now
      );

    if (!result.lastInsertRowid) {
      throw new Error("Failed to create notification");
    }

    return getNotificationById(
      result.lastInsertRowid as number
    ) as Promise<Notification>;
  } catch (error) {
    logger.error("Error creating notification:", error);
    throw new Error("Failed to create notification");
  }
};

/**
 * Update a notification
 */
export const updateNotification = async (
  id: number,
  data: Partial<Omit<Notification, "id" | "createdAt" | "updatedAt">>
): Promise<Notification | null> => {
  try {
    const notification = await getNotificationById(id);
    if (!notification) {
      return null;
    }

    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: any[] = [];

    // Build the SET clause dynamically
    if (data.recipientId !== undefined) {
      updates.push("recipientId = ?");
      values.push(data.recipientId);
    }

    if (data.title !== undefined) {
      updates.push("title = ?");
      values.push(data.title);
    }

    if (data.message !== undefined) {
      updates.push("message = ?");
      values.push(data.message);
    }

    if (data.type !== undefined) {
      updates.push("type = ?");
      values.push(data.type);
    }

    if (data.isRead !== undefined) {
      updates.push("isRead = ?");
      values.push(data.isRead ? 1 : 0);
    }

    if (data.relatedId !== undefined) {
      updates.push("relatedId = ?");
      values.push(data.relatedId);
    }

    if (data.actionUrl !== undefined) {
      updates.push("actionUrl = ?");
      values.push(data.actionUrl);
    }

    // Always update the updatedAt timestamp
    updates.push("updatedAt = ?");
    values.push(now);

    if (updates.length === 0) {
      return notification;
    }

    values.push(id); // For the WHERE clause

    // Update the notification
    db.prepare(
      `
      UPDATE notifications
      SET ${updates.join(", ")}
      WHERE id = ?
    `
    ).run(...values);

    return getNotificationById(id);
  } catch (error) {
    logger.error(`Error updating notification ${id}:`, error);
    throw new Error("Failed to update notification");
  }
};

/**
 * Mark a notification as read
 */
export const markAsRead = async (id: number): Promise<Notification | null> => {
  return updateNotification(id, { isRead: true });
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (userId: number): Promise<boolean> => {
  try {
    const now = new Date().toISOString();

    const result = db
      .prepare(
        `
      UPDATE notifications
      SET isRead = 1, updatedAt = ?
      WHERE recipientId = ? AND isRead = 0
    `
      )
      .run(now, userId);

    return result.changes > 0;
  } catch (error) {
    logger.error(
      `Error marking all notifications as read for user ${userId}:`,
      error
    );
    throw new Error("Failed to mark notifications as read");
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (id: number): Promise<boolean> => {
  try {
    const result = db
      .prepare(
        `
      DELETE FROM notifications
      WHERE id = ?
    `
      )
      .run(id);

    return result.changes > 0;
  } catch (error) {
    logger.error(`Error deleting notification ${id}:`, error);
    throw new Error("Failed to delete notification");
  }
};

/**
 * Delete all notifications for a user
 */
export const deleteAllNotifications = async (
  userId: number
): Promise<boolean> => {
  try {
    const result = db
      .prepare(
        `
      DELETE FROM notifications
      WHERE recipientId = ?
    `
      )
      .run(userId);

    return result.changes > 0;
  } catch (error) {
    logger.error(`Error deleting all notifications for user ${userId}:`, error);
    throw new Error("Failed to delete notifications");
  }
};

/**
 * Get notification preferences for a user
 */
export const getNotificationPreferences = async (
  userId: number
): Promise<any> => {
  try {
    // Define the type for database preferences
    interface DbNotificationPreferences {
      id: number;
      userId: number;
      email: number; // SQLite stores booleans as 0/1
      sms: number;
      push: number;
      appointmentReminders: number;
      patientUpdates: number;
      billingAlerts: number;
      systemUpdates: number;
      newFeatures: number;
      createdAt: string;
      updatedAt: string;
    }

    const preferences = db
      .prepare(
        `
        SELECT * FROM notification_preferences
        WHERE userId = ?
      `
      )
      .get(userId) as DbNotificationPreferences | undefined;

    if (!preferences) {
      // Return default preferences
      return createNotificationPreferences(userId);
    }

    // Convert INTEGER values to boolean
    return {
      ...preferences,
      email: Boolean(preferences.email),
      sms: Boolean(preferences.sms),
      push: Boolean(preferences.push),
      appointmentReminders: Boolean(preferences.appointmentReminders),
      patientUpdates: Boolean(preferences.patientUpdates),
      billingAlerts: Boolean(preferences.billingAlerts),
      systemUpdates: Boolean(preferences.systemUpdates),
      newFeatures: Boolean(preferences.newFeatures),
    };
  } catch (error) {
    logger.error(
      `Error getting notification preferences for user ${userId}:`,
      error
    );
    throw new Error("Failed to retrieve notification preferences");
  }
};

/**
 * Create notification preferences for a user
 */
export const createNotificationPreferences = async (
  userId: number
): Promise<any> => {
  try {
    const now = new Date().toISOString();

    const result = db
      .prepare(
        `
      INSERT INTO notification_preferences (
        userId, email, sms, push, appointmentReminders,
        patientUpdates, billingAlerts, systemUpdates, newFeatures,
        createdAt, updatedAt
      ) VALUES (?, 1, 0, 1, 1, 1, 1, 1, 1, ?, ?)
    `
      )
      .run(userId, now, now);

    if (!result.lastInsertRowid) {
      throw new Error("Failed to create notification preferences");
    }

    return getNotificationPreferences(userId);
  } catch (error) {
    logger.error(
      `Error creating notification preferences for user ${userId}:`,
      error
    );
    throw new Error("Failed to create notification preferences");
  }
};

/**
 * Update notification preferences for a user
 */
export const updateNotificationPreferences = async (
  userId: number,
  data: any
): Promise<any> => {
  try {
    // Check if preferences exist
    const preferences = await getNotificationPreferences(userId);

    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: any[] = [];

    // Build the SET clause dynamically
    for (const [key, value] of Object.entries(data)) {
      if (
        key !== "id" &&
        key !== "userId" &&
        key !== "createdAt" &&
        key !== "updatedAt"
      ) {
        updates.push(`${key} = ?`);
        values.push(value ? 1 : 0);
      }
    }

    if (updates.length === 0) {
      return preferences;
    }

    // Always update the updatedAt timestamp
    updates.push("updatedAt = ?");
    values.push(now);

    values.push(userId); // For the WHERE clause

    // Update the preferences
    db.prepare(
      `
      UPDATE notification_preferences
      SET ${updates.join(", ")}
      WHERE userId = ?
    `
    ).run(...values);

    return getNotificationPreferences(userId);
  } catch (error) {
    logger.error(
      `Error updating notification preferences for user ${userId}:`,
      error
    );
    throw new Error("Failed to update notification preferences");
  }
};

export default {
  createNotificationsTable,
  createNotificationPreferencesTable,
  getNotificationsByUserId,
  getUnreadCount,
  getNotificationById,
  createNotification,
  updateNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getNotificationPreferences,
  createNotificationPreferences,
  updateNotificationPreferences,
};
