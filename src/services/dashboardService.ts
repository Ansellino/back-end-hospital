import DashboardModel from "../models/Dashboard";
import PatientModel from "../models/Patient";
import AppointmentModel from "../models/Appointment";
import BillingModel from "../models/Billing";
import { logger } from "../utils/logger";
import { DashboardStats, StaffPerformance } from "../types/dashboard";

/**
 * Get dashboard summary statistics
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    return await DashboardModel.getDashboardStats();
  } catch (error) {
    logger.error("Error in dashboardService.getDashboardStats:", error);
    throw new Error("Failed to retrieve dashboard statistics");
  }
};

/**
 * Get detailed patient statistics
 */
export const getPatientStats = async () => {
  try {
    return await DashboardModel.getPatientStats();
  } catch (error) {
    logger.error("Error in dashboardService.getPatientStats:", error);
    throw new Error("Failed to retrieve patient statistics");
  }
};

/**
 * Get appointment statistics
 */
export const getAppointmentStats = async (
  startDate?: string,
  endDate?: string
) => {
  try {
    // Validate date format if provided
    if (startDate && !isValidDate(startDate)) {
      throw new Error("Invalid start date format. Use YYYY-MM-DD");
    }

    if (endDate && !isValidDate(endDate)) {
      throw new Error("Invalid end date format. Use YYYY-MM-DD");
    }

    return await DashboardModel.getAppointmentStats(startDate, endDate);
  } catch (error) {
    logger.error("Error in dashboardService.getAppointmentStats:", error);
    throw error;
  }
};

/**
 * Get revenue statistics
 */
export const getRevenueStats = async (startDate?: string, endDate?: string) => {
  try {
    // Validate date format if provided
    if (startDate && !isValidDate(startDate)) {
      throw new Error("Invalid start date format. Use YYYY-MM-DD");
    }

    if (endDate && !isValidDate(endDate)) {
      throw new Error("Invalid end date format. Use YYYY-MM-DD");
    }

    return await DashboardModel.getRevenueStats(startDate, endDate);
  } catch (error) {
    logger.error("Error in dashboardService.getRevenueStats:", error);
    throw error;
  }
};

/**
 * Get staff performance metrics
 */
export const getStaffPerformance = async (): Promise<StaffPerformance[]> => {
  try {
    return await DashboardModel.getStaffPerformance();
  } catch (error) {
    logger.error("Error in dashboardService.getStaffPerformance:", error);
    throw new Error("Failed to retrieve staff performance metrics");
  }
};

/**
 * Get recent activity feed
 */
export const getRecentActivity = async (limit: number = 10) => {
  try {
    // Validate limit parameter
    if (isNaN(limit) || limit < 1 || limit > 50) {
      limit = 10; // Default to 10 if invalid
    }

    return await DashboardModel.getRecentActivity(limit);
  } catch (error) {
    logger.error("Error in dashboardService.getRecentActivity:", error);
    throw new Error("Failed to retrieve recent activity");
  }
};

/**
 * Helper function to validate date format (YYYY-MM-DD)
 */
function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

export default {
  getDashboardStats,
  getPatientStats,
  getAppointmentStats,
  getRevenueStats,
  getStaffPerformance,
  getRecentActivity,
};
