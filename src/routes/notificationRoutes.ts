import { Router } from "express";
import * as notificationController from "../controllers/notificationController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validationMiddleware";
import { body, param, query } from "express-validator";

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// Validate preferences input
const validatePreferencesInput = validate([
  body("email").optional().isBoolean().withMessage("Email must be a boolean"),
  body("sms").optional().isBoolean().withMessage("SMS must be a boolean"),
  body("push").optional().isBoolean().withMessage("Push must be a boolean"),
  body("appointmentReminders")
    .optional()
    .isBoolean()
    .withMessage("Appointment reminders must be a boolean"),
  body("patientUpdates")
    .optional()
    .isBoolean()
    .withMessage("Patient updates must be a boolean"),
  body("billingAlerts")
    .optional()
    .isBoolean()
    .withMessage("Billing alerts must be a boolean"),
  body("systemUpdates")
    .optional()
    .isBoolean()
    .withMessage("System updates must be a boolean"),
  body("newFeatures")
    .optional()
    .isBoolean()
    .withMessage("New features must be a boolean"),
]);

// Validate notification input
const validateNotificationInput = validate([
  body("recipientId").isInt().withMessage("Recipient ID must be a number"),
  body("title").notEmpty().withMessage("Title is required"),
  body("message").notEmpty().withMessage("Message is required"),
  body("type")
    .isIn(["appointment", "system", "patient", "billing", "staff"])
    .withMessage("Invalid notification type"),
  body("relatedId")
    .optional()
    .isString()
    .withMessage("Related ID must be a string"),
  body("actionUrl")
    .optional()
    .isString()
    .withMessage("Action URL must be a string"),
]);

// GET /api/notifications - Get all notifications for authenticated user
router.get("/", notificationController.getNotifications);

// GET /api/notifications/recent - Get recent notifications
router.get(
  "/recent",
  validate([
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
  ]),
  notificationController.getRecentNotifications
);

// GET /api/notifications/unread/count - Get unread count
router.get("/unread/count", notificationController.getUnreadCount);

// PUT /api/notifications/:id/read - Mark a notification as read
router.put(
  "/:id/read",
  validate([
    param("id").isInt().withMessage("Notification ID must be a number"),
  ]),
  notificationController.markAsRead
);

// PUT /api/notifications/mark-all-read - Mark all notifications as read
router.put("/mark-all-read", notificationController.markAllAsRead);

// DELETE /api/notifications/:id - Delete a notification
router.delete(
  "/:id",
  validate([
    param("id").isInt().withMessage("Notification ID must be a number"),
  ]),
  notificationController.deleteNotification
);

// DELETE /api/notifications/all - Delete all notifications
router.delete("/all", notificationController.deleteAllNotifications);

// GET /api/notifications/preferences - Get notification preferences
router.get("/preferences", notificationController.getNotificationPreferences);

// PUT /api/notifications/preferences - Update notification preferences
router.put(
  "/preferences",
  validatePreferencesInput,
  notificationController.updateNotificationPreferences
);

// POST /api/notifications - Create a new notification (admin only)
router.post(
  "/",
  authorize(["admin"]),
  validateNotificationInput,
  notificationController.createNotification
);

export default router;
