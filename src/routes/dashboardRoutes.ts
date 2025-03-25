import { Router } from "express";
import * as dashboardController from "../controllers/dashboardController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validationMiddleware";
import { query } from "express-validator";

const router = Router();

// Apply authentication to all dashboard routes
router.use(authenticate);

// Only allow admin and staff with appropriate permissions to access dashboard
router.use(authorize(["admin", "manager", "doctor", "receptionist"]));

// Validate date params
const validateDateParams = validate([
  query("startDate")
    .optional()
    .isDate()
    .withMessage("Start date must be a valid date in YYYY-MM-DD format"),
  query("endDate")
    .optional()
    .isDate()
    .withMessage("End date must be a valid date in YYYY-MM-DD format"),
]);

// Validate limit param
const validateLimitParam = validate([
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),
]);

// GET /api/dashboard/stats - Get dashboard summary statistics
router.get("/stats", dashboardController.getDashboardStats);

// GET /api/dashboard/patients - Get patient statistics
router.get("/patients", dashboardController.getPatientStats);

// GET /api/dashboard/appointments - Get appointment statistics
router.get(
  "/appointments",
  validateDateParams,
  dashboardController.getAppointmentStats
);

// GET /api/dashboard/revenue - Get revenue statistics
router.get("/revenue", validateDateParams, dashboardController.getRevenueStats);

// GET /api/dashboard/staff-performance - Get staff performance metrics
router.get("/staff-performance", dashboardController.getStaffPerformance);

// GET /api/dashboard/activity - Get recent activity feed
router.get(
  "/activity",
  validateLimitParam,
  dashboardController.getRecentActivity
);

export default router;
