import NotificationModel from "../models/Notification";
import UserModel from "../models/User";
import {
  Notification,
  NotificationType,
  NotificationQueryParams,
  CreateNotificationRequest,
  UpdateNotificationRequest,
} from "../types/notification";
import { logger } from "../utils/logger";

/**
 * Get all notifications for a user
 */
export const getNotificationsByUserId = async (
  userId: number,
  params: NotificationQueryParams = {}
): Promise<Notification[]> => {
  try {
    // Verify the user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    return await NotificationModel.getNotificationsByUserId(userId, params);
  } catch (error) {
    logger.error(
      `Error in notificationService.getNotificationsByUserId for user ${userId}:`,
      error
    );
    throw error;
  }
};

/**
 * Get recent notifications for a user
 */
export const getRecentNotifications = async (
  userId: number,
  limit: number = 5
): Promise<Notification[]> => {
  try {
    return await NotificationModel.getNotificationsByUserId(userId, { limit });
  } catch (error) {
    logger.error(
      `Error in notificationService.getRecentNotifications for user ${userId}:`,
      error
    );
    throw error;
  }
};

/**
 * Get unread notification count for a user
 */
export const getUnreadCount = async (userId: number): Promise<number> => {
  try {
    // Verify the user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    return await NotificationModel.getUnreadCount(userId);
  } catch (error) {
    logger.error(
      `Error in notificationService.getUnreadCount for user ${userId}:`,
      error
    );
    throw error;
  }
};

/**
 * Get a notification by ID
 */
export const getNotificationById = async (
  id: number
): Promise<Notification | null> => {
  try {
    return await NotificationModel.getNotificationById(id);
  } catch (error) {
    logger.error(
      `Error in notificationService.getNotificationById for ID ${id}:`,
      error
    );
    throw error;
  }
};

/**
 * Create a new notification
 */
export const createNotification = async (
  data: CreateNotificationRequest
): Promise<Notification> => {
  try {
    // Verify the recipient exists
    const user = await UserModel.findById(data.recipientId);
    if (!user) {
      throw new Error("Recipient user not found");
    }

    // Validate notification type
    const validTypes: NotificationType[] = [
      "appointment",
      "system",
      "patient",
      "billing",
      "staff",
    ];
    if (!validTypes.includes(data.type as NotificationType)) {
      throw new Error("Invalid notification type");
    }

    return await NotificationModel.createNotification(data);
  } catch (error) {
    logger.error("Error in notificationService.createNotification:", error);
    throw error;
  }
};

/**
 * Mark a notification as read
 */
export const markAsRead = async (
  id: number,
  userId: number
): Promise<Notification | null> => {
  try {
    const notification = await NotificationModel.getNotificationById(id);

    if (!notification) {
      throw new Error("Notification not found");
    }

    // Make sure the notification belongs to the user
    if (notification.recipientId !== userId) {
      throw new Error("Unauthorized access to notification");
    }

    return await NotificationModel.markAsRead(id);
  } catch (error) {
    logger.error(
      `Error in notificationService.markAsRead for ID ${id}:`,
      error
    );
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (userId: number): Promise<boolean> => {
  try {
    // Verify the user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    return await NotificationModel.markAllAsRead(userId);
  } catch (error) {
    logger.error(
      `Error in notificationService.markAllAsRead for user ${userId}:`,
      error
    );
    throw error;
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (
  id: number,
  userId: number
): Promise<boolean> => {
  try {
    const notification = await NotificationModel.getNotificationById(id);

    if (!notification) {
      throw new Error("Notification not found");
    }

    // Make sure the notification belongs to the user
    if (notification.recipientId !== userId) {
      throw new Error("Unauthorized access to notification");
    }

    return await NotificationModel.deleteNotification(id);
  } catch (error) {
    logger.error(
      `Error in notificationService.deleteNotification for ID ${id}:`,
      error
    );
    throw error;
  }
};

/**
 * Delete all notifications for a user
 */
export const deleteAllNotifications = async (
  userId: number
): Promise<boolean> => {
  try {
    // Verify the user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    return await NotificationModel.deleteAllNotifications(userId);
  } catch (error) {
    logger.error(
      `Error in notificationService.deleteAllNotifications for user ${userId}:`,
      error
    );
    throw error;
  }
};

/**
 * Get notification preferences for a user
 */
export const getNotificationPreferences = async (
  userId: number
): Promise<any> => {
  try {
    // Verify the user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    return await NotificationModel.getNotificationPreferences(userId);
  } catch (error) {
    logger.error(
      `Error in notificationService.getNotificationPreferences for user ${userId}:`,
      error
    );
    throw error;
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
    // Verify the user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    return await NotificationModel.updateNotificationPreferences(userId, data);
  } catch (error) {
    logger.error(
      `Error in notificationService.updateNotificationPreferences for user ${userId}:`,
      error
    );
    throw error;
  }
};

/**
 * Send notification to a user
 * This is a convenience function for creating notifications
 */
export const sendNotification = async (
  userId: number,
  title: string,
  message: string,
  type: NotificationType,
  relatedId?: string,
  actionUrl?: string
): Promise<Notification> => {
  try {
    return await createNotification({
      recipientId: userId,
      title,
      message,
      type,
      relatedId,
      actionUrl,
    });
  } catch (error) {
    logger.error(
      `Error in notificationService.sendNotification to user ${userId}:`,
      error
    );
    throw error;
  }
};

export default {
  getNotificationsByUserId,
  getRecentNotifications,
  getUnreadCount,
  getNotificationById,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getNotificationPreferences,
  updateNotificationPreferences,
  sendNotification,
};
