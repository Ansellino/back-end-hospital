import { Router } from "express";
import * as medicalRecordController from "../controllers/medicalRecordController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validationMiddleware";
import { body, param, query } from "express-validator";

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Validation schemas
const validateMedicalRecordInput = validate([
  body("patientId")
    .notEmpty()
    .withMessage("Patient ID is required")
    .isNumeric(),
  body("doctorId").notEmpty().withMessage("Doctor ID is required").isNumeric(),
  body("visitDate").notEmpty().withMessage("Visit date is required").isString(),
  body("chiefComplaint")
    .notEmpty()
    .withMessage("Chief complaint is required")
    .isString(),
  body("vitalSigns").isObject().withMessage("Vital signs are required"),
  body("vitalSigns.temperature")
    .isNumeric()
    .withMessage("Temperature must be a number"),
  body("vitalSigns.bloodPressureSystolic")
    .isNumeric()
    .withMessage("Systolic blood pressure must be a number"),
  body("vitalSigns.bloodPressureDiastolic")
    .isNumeric()
    .withMessage("Diastolic blood pressure must be a number"),
  body("vitalSigns.heartRate")
    .isNumeric()
    .withMessage("Heart rate must be a number"),
  body("vitalSigns.respiratoryRate")
    .isNumeric()
    .withMessage("Respiratory rate must be a number"),
  body("vitalSigns.oxygenSaturation")
    .isNumeric()
    .withMessage("Oxygen saturation must be a number"),
  body("vitalSigns.height").isNumeric().withMessage("Height must be a number"),
  body("vitalSigns.weight").isNumeric().withMessage("Weight must be a number"),
  body("diagnosis").isArray().withMessage("Diagnosis must be an array"),
  body("diagnosis.*.code").notEmpty().withMessage("Diagnosis code is required"),
  body("diagnosis.*.description")
    .notEmpty()
    .withMessage("Diagnosis description is required"),
  body("diagnosis.*.type")
    .isIn(["primary", "secondary", "tertiary"])
    .withMessage("Invalid diagnosis type"),
  body("treatment").isObject().withMessage("Treatment is required"),
  body("treatment.medications")
    .isArray()
    .withMessage("Medications must be an array"),
  body("treatment.procedures")
    .isArray()
    .withMessage("Procedures must be an array"),
  body("followUpRecommended")
    .isBoolean()
    .withMessage("Follow-up recommended must be a boolean"),
  body("followUpDate")
    .optional({ nullable: true })
    .isString()
    .withMessage("Follow-up date must be a string"),
]);

const validateAttachmentInput = validate([
  body("name").notEmpty().withMessage("Attachment name is required"),
  body("type").notEmpty().withMessage("Attachment type is required"),
  body("url").notEmpty().withMessage("Attachment URL is required"),
]);

// GET /api/medical-records - Get all medical records with optional filters
router.get("/", medicalRecordController.getAllMedicalRecords);

// GET /api/medical-records/search - Search medical records
router.get(
  "/search",
  validate([query("q").exists().withMessage("Search query is required")]),
  medicalRecordController.searchMedicalRecords
);

// GET /api/medical-records/:id - Get a single medical record
router.get(
  "/:id",
  validate([
    param("id").isNumeric().withMessage("Medical record ID must be a number"),
  ]),
  medicalRecordController.getMedicalRecord
);

// POST /api/medical-records - Create a new medical record
router.post(
  "/",
  authorize(["doctor", "admin"]),
  validateMedicalRecordInput,
  medicalRecordController.createMedicalRecord
);

// PUT /api/medical-records/:id - Update a medical record
router.put(
  "/:id",
  authorize(["doctor", "admin"]),
  validate([
    param("id").isNumeric().withMessage("Medical record ID must be a number"),
  ]),
  medicalRecordController.updateMedicalRecord
);

// DELETE /api/medical-records/:id - Delete a medical record
router.delete(
  "/:id",
  authorize(["doctor", "admin"]),
  validate([
    param("id").isNumeric().withMessage("Medical record ID must be a number"),
  ]),
  medicalRecordController.deleteMedicalRecord
);

// POST /api/medical-records/:id/attachments - Add an attachment
router.post(
  "/:id/attachments",
  authorize(["doctor", "admin"]),
  validate([
    param("id").isNumeric().withMessage("Medical record ID must be a number"),
  ]),
  validateAttachmentInput,
  medicalRecordController.addAttachment
);

export default router;
