import { Router } from "express";
import * as patientController from "../controllers/patientController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { body, param, query } from "express-validator";
import { validate } from "../middlewares/validationMiddleware";

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Input validation middleware
const validatePatientInput = validate([
  body("firstName").notEmpty().withMessage("First name is required"),
  body("lastName").notEmpty().withMessage("Last name is required"),
  body("dateOfBirth").notEmpty().withMessage("Date of birth is required"),
  body("gender").notEmpty().withMessage("Gender is required"),
  body("email").optional().isEmail().withMessage("Invalid email format"),
]);

const validateIdParam = validate([
  param("id").isInt().withMessage("Patient ID must be a number"),
]);

const validateSearchQuery = validate([
  query("q").notEmpty().withMessage("Search query is required"),
]);

// GET /api/patients
router.get(
  "/",
  authorize(["doctor", "nurse", "admin", "receptionist"]),
  patientController.getAllPatients
);

// GET /api/patients/search
router.get(
  "/search",
  authorize(["doctor", "nurse", "admin", "receptionist"]),
  validateSearchQuery,
  patientController.searchPatients
);

// GET /api/patients/stats
router.get(
  "/stats",
  authorize(["admin", "doctor"]),
  patientController.getPatientStats
);

// GET /api/patients/:id
router.get(
  "/:id",
  authorize(["doctor", "nurse", "admin", "receptionist"]),
  validateIdParam,
  patientController.getPatientById
);

// GET /api/patients/:id/medical-records
router.get(
  "/:id/medical-records",
  authorize(["doctor", "nurse", "admin"]),
  validateIdParam,
  patientController.getPatientMedicalRecords
);

// GET /api/patients/:id/appointments
router.get(
  "/:id/appointments",
  authorize(["doctor", "nurse", "admin", "receptionist"]),
  validateIdParam,
  patientController.getPatientAppointments
);

// POST /api/patients
router.post(
  "/",
  authorize(["doctor", "nurse", "admin", "receptionist"]),
  validatePatientInput,
  patientController.createPatient
);

// PUT /api/patients/:id
router.put(
  "/:id",
  authorize(["doctor", "nurse", "admin", "receptionist"]),
  validateIdParam,
  validatePatientInput,
  patientController.updatePatient
);

// DELETE /api/patients/:id
router.delete(
  "/:id",
  authorize(["admin"]),
  validateIdParam,
  patientController.deletePatient
);

export default router;
