import { Router } from "express";
import * as appointmentController from "../controllers/appointmentController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validationMiddleware";
import { body, param, query } from "express-validator";

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Validation schemas
const validateAppointmentInput = validate([
  body("patientId")
    .notEmpty()
    .withMessage("Patient ID is required")
    .isNumeric(),
  body("doctorId").notEmpty().withMessage("Doctor ID is required").isNumeric(),
  body("title").notEmpty().withMessage("Title is required").isString(),
  body("startTime")
    .notEmpty()
    .withMessage("Start time is required")
    .isISO8601(),
  body("endTime").notEmpty().withMessage("End time is required").isISO8601(),
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["scheduled", "completed", "canceled", "no-show"])
    .withMessage("Invalid appointment status"),
  body("type")
    .notEmpty()
    .withMessage("Type is required")
    .isIn(["follow-up", "new-patient", "emergency", "routine"])
    .withMessage("Invalid appointment type"),
]);

const validateDateParams = validate([
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date"),
  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid ISO 8601 date"),
]);

const validateSearchQuery = validate([
  query("q").exists().withMessage("Search query parameter 'q' is required"),
]);

const validateIdParam = validate([
  param("id").isNumeric().withMessage("ID must be a number"),
]);

// GET /api/appointments - Get all appointments or filtered by date range
router.get(
  "/",
  authorize(["doctor", "nurse", "admin", "receptionist"]),
  validateDateParams,
  appointmentController.getAllAppointments
);

// GET /api/appointments/search - Search appointments
router.get(
  "/search",
  authorize(["doctor", "nurse", "admin", "receptionist"]),
  validateSearchQuery,
  appointmentController.searchAppointments
);

// GET /api/appointments/upcoming - Get upcoming appointments
router.get(
  "/upcoming",
  authorize(["doctor", "nurse", "admin", "receptionist"]),
  appointmentController.getUpcomingAppointments
);

// GET /api/appointments/stats - Get appointment statistics
router.get(
  "/stats",
  authorize(["admin", "doctor"]),
  appointmentController.getAppointmentStats
);

// GET /api/appointments/patient/:patientId - Get appointments for a specific patient
router.get(
  "/patient/:patientId",
  authorize(["doctor", "nurse", "admin", "receptionist"]),
  validate([
    param("patientId").isNumeric().withMessage("Patient ID must be a number"),
  ]),
  appointmentController.getAppointmentsByPatientId
);

// GET /api/appointments/doctor/:doctorId - Get appointments for a specific doctor
router.get(
  "/doctor/:doctorId",
  authorize(["doctor", "nurse", "admin", "receptionist"]),
  validate([
    param("doctorId").isNumeric().withMessage("Doctor ID must be a number"),
  ]),
  appointmentController.getAppointmentsByDoctorId
);

// GET /api/appointments/:id - Get a single appointment
router.get(
  "/:id",
  authorize(["doctor", "nurse", "admin", "receptionist"]),
  validateIdParam,
  appointmentController.getAppointmentById
);

// POST /api/appointments - Create a new appointment
router.post(
  "/",
  authorize(["doctor", "nurse", "admin", "receptionist"]),
  validateAppointmentInput,
  appointmentController.createAppointment
);

// PUT /api/appointments/:id - Update an appointment
router.put(
  "/:id",
  authorize(["doctor", "nurse", "admin", "receptionist"]),
  validateIdParam,
  appointmentController.updateAppointment
);

// DELETE /api/appointments/:id - Delete an appointment
router.delete(
  "/:id",
  authorize(["doctor", "admin"]),
  validateIdParam,
  appointmentController.deleteAppointment
);

export default router;
