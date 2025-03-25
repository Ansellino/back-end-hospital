import { Request, Response, NextFunction } from "express";
import { body, param, query, validationResult } from "express-validator";

/**
 * Apply validation rules and handle errors
 */
export const validate = (validations: any[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    // Check if there were validation errors
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Send validation errors response but don't return the response object
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((err: any) => ({
        field: err.path || err.param,
        message: err.msg,
      })),
    });
    // Don't return anything here, just let the function complete
  };
};

// Define validation rules with the fixed middleware
export const validateIdParam = validate([
  param("id").isInt().withMessage("ID must be a number"),
]);

export const validateSearchQuery = validate([
  query("q").exists().withMessage("Search query parameter 'q' is required"),
]);

export const validatePatientInput = validate([
  body("firstName").notEmpty().withMessage("First name is required"),
  body("lastName").notEmpty().withMessage("Last name is required"),
  body("dateOfBirth").notEmpty().withMessage("Date of birth is required"),
  body("gender").notEmpty().withMessage("Gender is required"),
]);

/**
 * Validation rules for appointment input
 */
export const validateAppointmentInput = validate([
  body("patientId")
    .notEmpty()
    .withMessage("Patient ID is required")
    .isNumeric()
    .withMessage("Patient ID must be a number"),

  body("doctorId")
    .notEmpty()
    .withMessage("Doctor ID is required")
    .isNumeric()
    .withMessage("Doctor ID must be a number"),

  body("date")
    .notEmpty()
    .withMessage("Date is required")
    .isISO8601()
    .withMessage("Date must be a valid date format"),

  body("time")
    .notEmpty()
    .withMessage("Time is required")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Time must be in HH:MM format"),

  body("duration")
    .optional()
    .isNumeric()
    .withMessage("Duration must be a number"),

  body("reason").optional().isString().withMessage("Reason must be a string"),

  body("status")
    .optional()
    .isIn(["scheduled", "completed", "cancelled", "no-show"])
    .withMessage(
      "Status must be one of: scheduled, completed, cancelled, no-show"
    ),
]);

/**
 * Validation rules for user registration
 */
export const validateUserRegistration = validate([
  body("username")
    .notEmpty()
    .withMessage("Username is required")
    .isString()
    .withMessage("Username must be a string")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters"),

  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be valid"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),

  body("firstName")
    .notEmpty()
    .withMessage("First name is required")
    .isString()
    .withMessage("First name must be a string"),

  body("lastName")
    .notEmpty()
    .withMessage("Last name is required")
    .isString()
    .withMessage("Last name must be a string"),

  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["admin", "doctor", "nurse", "receptionist", "patient"])
    .withMessage(
      "Role must be one of: admin, doctor, nurse, receptionist, patient"
    ),
]);

/**
 * Validation rules for login
 */
export const validateLogin = validate([
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be valid"),

  body("password").notEmpty().withMessage("Password is required"),
]);

/**
 * Validation rules for medical records
 */
export const validateMedicalRecordInput = validate([
  body("patientId")
    .notEmpty()
    .withMessage("Patient ID is required")
    .isNumeric()
    .withMessage("Patient ID must be a number"),

  body("doctorId")
    .notEmpty()
    .withMessage("Doctor ID is required")
    .isNumeric()
    .withMessage("Doctor ID must be a number"),

  body("diagnosis")
    .notEmpty()
    .withMessage("Diagnosis is required")
    .isString()
    .withMessage("Diagnosis must be a string"),

  body("treatment")
    .optional()
    .isString()
    .withMessage("Treatment must be a string"),

  body("notes").optional().isString().withMessage("Notes must be a string"),

  body("date")
    .notEmpty()
    .withMessage("Date is required")
    .isISO8601()
    .withMessage("Date must be a valid date format"),
]);
