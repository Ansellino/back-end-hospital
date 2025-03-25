/**
 * Notification related types for the healthcare management system
 */

// Notification types matching frontend
export type NotificationType = "appointment" | "system" | "patient" | "billing" | "staff";

// Database model for notifications
export interface Notification {
  id?: number;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  recipientId: number;
  createdAt?: string;
  updatedAt?: string;
  relatedId?: string;
  actionUrl?: string;
}

// Database model for notification preferences
export interface NotificationPreferences {
  id?: number;
  userId: number;
  email: boolean;
  sms: boolean;
  push: boolean;
  appointmentReminders: boolean;
  patientUpdates: boolean;
  billingAlerts: boolean;
  systemUpdates: boolean;
  newFeatures: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// API request/response types
export interface NotificationListResponse {
  success: boolean;
  data: Notification[];
  meta?: {
    total: number;
    unread: number;
  };
}

export interface NotificationCountResponse {
  success: boolean;
  count: number;
}

export interface CreateNotificationRequest {
  title: string;
  message: string;
  type: NotificationType;
  recipientId: number;
  relatedId?: string;
  actionUrl?: string;
}

export interface UpdateNotificationRequest {
  isRead?: boolean;
}

// Query parameters for filtering notifications
export interface NotificationQueryParams {
  recipientId?: number;
  type?: NotificationType | NotificationType[];
  isRead?: boolean;
  startDate?: string;
  endDate?: string;
  limit?: number;
  page?: number;
}

// Default notification preferences (for new users)
export const DEFAULT_NOTIFICATION_PREFERENCES = {
  email: true,
  sms: false,
  push: true,
  appointmentReminders: true,
  patientUpdates: true,
  billingAlerts: true,
  systemUpdates: true,
  newFeatures: true
};