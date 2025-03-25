import { Request, Response } from "express";
import dashboardService from "../services/dashboardService";
import { successResponse, errorResponse } from "../utils/apiResponse";
import { logger } from "../utils/logger";

/**
 * Get dashboard summary statistics
 * @route GET /api/dashboard/stats
 */
export const getDashboardStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const stats = await dashboardService.getDashboardStats();

    res
      .status(200)
      .json(
        successResponse("Dashboard statistics retrieved successfully", stats)
      );
  } catch (error) {
    logger.error("Error retrieving dashboard statistics:", error);
    res
      .status(500)
      .json(errorResponse("Failed to retrieve dashboard statistics"));
  }
};

/**
 * Get detailed patient statistics
 * @route GET /api/dashboard/patients
 */
export const getPatientStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const stats = await dashboardService.getPatientStats();

    res
      .status(200)
      .json(
        successResponse("Patient statistics retrieved successfully", stats)
      );
  } catch (error) {
    logger.error("Error retrieving patient statistics:", error);
    res
      .status(500)
      .json(errorResponse("Failed to retrieve patient statistics"));
  }
};

/**
 * Get appointment statistics
 * @route GET /api/dashboard/appointments
 */
export const getAppointmentStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await dashboardService.getAppointmentStats(
      startDate as string,
      endDate as string
    );

    res
      .status(200)
      .json(
        successResponse("Appointment statistics retrieved successfully", stats)
      );
  } catch (error) {
    logger.error("Error retrieving appointment statistics:", error);

    if (
      error instanceof Error &&
      (error.message.includes("Invalid start date") ||
        error.message.includes("Invalid end date"))
    ) {
      res.status(400).json(errorResponse(error.message));
      return;
    }

    res
      .status(500)
      .json(errorResponse("Failed to retrieve appointment statistics"));
  }
};

/**
 * Get revenue statistics
 * @route GET /api/dashboard/revenue
 */
export const getRevenueStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await dashboardService.getRevenueStats(
      startDate as string,
      endDate as string
    );

    res
      .status(200)
      .json(
        successResponse("Revenue statistics retrieved successfully", stats)
      );
  } catch (error) {
    logger.error("Error retrieving revenue statistics:", error);

    if (
      error instanceof Error &&
      (error.message.includes("Invalid start date") ||
        error.message.includes("Invalid end date"))
    ) {
      res.status(400).json(errorResponse(error.message));
      return;
    }

    res
      .status(500)
      .json(errorResponse("Failed to retrieve revenue statistics"));
  }
};

/**
 * Get staff performance metrics
 * @route GET /api/dashboard/staff-performance
 */
export const getStaffPerformance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const stats = await dashboardService.getStaffPerformance();

    res
      .status(200)
      .json(
        successResponse(
          "Staff performance metrics retrieved successfully",
          stats
        )
      );
  } catch (error) {
    logger.error("Error retrieving staff performance metrics:", error);
    res
      .status(500)
      .json(errorResponse("Failed to retrieve staff performance metrics"));
  }
};

/**
 * Get recent activity feed
 * @route GET /api/dashboard/activity
 */
export const getRecentActivity = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const activities = await dashboardService.getRecentActivity(limit);

    res
      .status(200)
      .json(
        successResponse("Recent activity retrieved successfully", activities)
      );
  } catch (error) {
    logger.error("Error retrieving recent activity:", error);
    res.status(500).json(errorResponse("Failed to retrieve recent activity"));
  }
};

export default {
  getDashboardStats,
  getPatientStats,
  getAppointmentStats,
  getRevenueStats,
  getStaffPerformance,
  getRecentActivity,
};
