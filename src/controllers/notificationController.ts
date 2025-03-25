import { Request, Response } from "express";
import notificationService from "../services/notificationService";
import { successResponse, errorResponse } from "../utils/apiResponse";
import { logger } from "../utils/logger";

/**
 * Get all notifications for the authenticated user
 * @route GET /api/notifications
 */
export const getNotifications = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }

    const userId = req.user.id;
    const { type, isRead, limit, page, startDate, endDate } = req.query;

    // Build query params
    const params: any = {};

    if (type) {
      params.type = type;
    }

    if (isRead !== undefined) {
      params.isRead = isRead === "true";
    }

    if (limit) {
      params.limit = parseInt(limit as string);
    }

    if (page) {
      params.page = parseInt(page as string);
    }

    if (startDate) {
      params.startDate = startDate as string;
    }

    if (endDate) {
      params.endDate = endDate as string;
    }

    const notifications = await notificationService.getNotificationsByUserId(
      userId,
      params
    );
    const unreadCount = await notificationService.getUnreadCount(userId);

    // Include metadata as part of the data object instead of as a separate
    res.status(200).json(
      successResponse("Notifications retrieved successfully", {
        notifications,
        total: notifications.length,
        unread: unreadCount,
      })
    );
  } catch (error) {
    logger.error("Error retrieving notifications:", error);

    if (error instanceof Error && error.message === "User not found") {
      res.status(404).json(errorResponse(error.message));
      return;
    }

    res.status(500).json(errorResponse("Failed to retrieve notifications"));
  }
};

/**
 * Get recent notifications for the authenticated user
 * @route GET /api/notifications/recent
 */
export const getRecentNotifications = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }

    const userId = req.user.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;

    const notifications = await notificationService.getRecentNotifications(
      userId,
      limit
    );

    res
      .status(200)
      .json(
        successResponse(
          "Recent notifications retrieved successfully",
          notifications
        )
      );
  } catch (error) {
    logger.error("Error retrieving recent notifications:", error);

    if (error instanceof Error && error.message === "User not found") {
      res.status(404).json(errorResponse(error.message));
      return;
    }

    res
      .status(500)
      .json(errorResponse("Failed to retrieve recent notifications"));
  }
};

/**
 * Get unread notification count for the authenticated user
 * @route GET /api/notifications/unread/count
 */
export const getUnreadCount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }

    const userId = req.user.id;
    const count = await notificationService.getUnreadCount(userId);

    res
      .status(200)
      .json(successResponse("Unread count retrieved successfully", { count }));
  } catch (error) {
    logger.error("Error retrieving unread count:", error);

    if (error instanceof Error && error.message === "User not found") {
      res.status(404).json(errorResponse(error.message));
      return;
    }

    res.status(500).json(errorResponse("Failed to retrieve unread count"));
  }
};

/**
 * Mark a notification as read
 * @route PUT /api/notifications/:id/read
 */
export const markAsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }

    const userId = req.user.id;
    const notificationId = parseInt(req.params.id);

    if (isNaN(notificationId)) {
      res.status(400).json(errorResponse("Invalid notification ID"));
      return;
    }

    const notification = await notificationService.markAsRead(
      notificationId,
      userId
    );

    if (!notification) {
      res.status(404).json(errorResponse("Notification not found"));
      return;
    }

    res
      .status(200)
      .json(successResponse("Notification marked as read", notification));
  } catch (error) {
    logger.error(`Error marking notification ${req.params.id} as read:`, error);

    if (error instanceof Error) {
      if (error.message === "Notification not found") {
        res.status(404).json(errorResponse(error.message));
        return;
      }

      if (error.message === "Unauthorized access to notification") {
        res.status(403).json(errorResponse(error.message));
        return;
      }
    }

    res.status(500).json(errorResponse("Failed to mark notification as read"));
  }
};

/**
 * Mark all notifications as read for the authenticated user
 * @route PUT /api/notifications/mark-all-read
 */
export const markAllAsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }

    const userId = req.user.id;
    const success = await notificationService.markAllAsRead(userId);

    res
      .status(200)
      .json(successResponse("All notifications marked as read", { success }));
  } catch (error) {
    logger.error("Error marking all notifications as read:", error);

    if (error instanceof Error && error.message === "User not found") {
      res.status(404).json(errorResponse(error.message));
      return;
    }

    res
      .status(500)
      .json(errorResponse("Failed to mark all notifications as read"));
  }
};

/**
 * Delete a notification
 * @route DELETE /api/notifications/:id
 */
export const deleteNotification = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }

    const userId = req.user.id;
    const notificationId = parseInt(req.params.id);

    if (isNaN(notificationId)) {
      res.status(400).json(errorResponse("Invalid notification ID"));
      return;
    }

    const success = await notificationService.deleteNotification(
      notificationId,
      userId
    );

    if (!success) {
      res.status(404).json(errorResponse("Notification not found"));
      return;
    }

    res.status(200).json(successResponse("Notification deleted successfully"));
  } catch (error) {
    logger.error(`Error deleting notification ${req.params.id}:`, error);

    if (error instanceof Error) {
      if (error.message === "Notification not found") {
        res.status(404).json(errorResponse(error.message));
        return;
      }

      if (error.message === "Unauthorized access to notification") {
        res.status(403).json(errorResponse(error.message));
        return;
      }
    }

    res.status(500).json(errorResponse("Failed to delete notification"));
  }
};

/**
 * Delete all notifications for the authenticated user
 * @route DELETE /api/notifications/all
 */
export const deleteAllNotifications = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }

    const userId = req.user.id;
    const success = await notificationService.deleteAllNotifications(userId);

    res
      .status(200)
      .json(
        successResponse("All notifications deleted successfully", { success })
      );
  } catch (error) {
    logger.error("Error deleting all notifications:", error);

    if (error instanceof Error && error.message === "User not found") {
      res.status(404).json(errorResponse(error.message));
      return;
    }

    res.status(500).json(errorResponse("Failed to delete all notifications"));
  }
};

/**
 * Get notification preferences for the authenticated user
 * @route GET /api/notifications/preferences
 */
export const getNotificationPreferences = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }

    const userId = req.user.id;
    const preferences = await notificationService.getNotificationPreferences(
      userId
    );

    res
      .status(200)
      .json(
        successResponse(
          "Notification preferences retrieved successfully",
          preferences
        )
      );
  } catch (error) {
    logger.error("Error retrieving notification preferences:", error);

    if (error instanceof Error && error.message === "User not found") {
      res.status(404).json(errorResponse(error.message));
      return;
    }

    res
      .status(500)
      .json(errorResponse("Failed to retrieve notification preferences"));
  }
};

/**
 * Update notification preferences for the authenticated user
 * @route PUT /api/notifications/preferences
 */
export const updateNotificationPreferences = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }

    const userId = req.user.id;
    const data = req.body;

    const preferences = await notificationService.updateNotificationPreferences(
      userId,
      data
    );

    res
      .status(200)
      .json(
        successResponse(
          "Notification preferences updated successfully",
          preferences
        )
      );
  } catch (error) {
    logger.error("Error updating notification preferences:", error);

    if (error instanceof Error && error.message === "User not found") {
      res.status(404).json(errorResponse(error.message));
      return;
    }

    res
      .status(500)
      .json(errorResponse("Failed to update notification preferences"));
  }
};

/**
 * Create a new notification (admin only)
 * @route POST /api/notifications
 */
export const createNotification = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }

    // Only allow admins to create notifications for other users
    if (req.user.role !== "admin") {
      res
        .status(403)
        .json(errorResponse("Only administrators can create notifications"));
      return;
    }

    const notificationData = req.body;

    const notification = await notificationService.createNotification(
      notificationData
    );

    res
      .status(201)
      .json(successResponse("Notification created successfully", notification));
  } catch (error) {
    logger.error("Error creating notification:", error);

    if (error instanceof Error) {
      if (
        error.message === "Recipient user not found" ||
        error.message === "Invalid notification type"
      ) {
        res.status(400).json(errorResponse(error.message));
        return;
      }
    }

    res.status(500).json(errorResponse("Failed to create notification"));
  }
};

export default {
  getNotifications,
  getRecentNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getNotificationPreferences,
  updateNotificationPreferences,
  createNotification,
};
