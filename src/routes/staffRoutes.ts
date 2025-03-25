import { Router } from "express";
import * as staffController from "../controllers/staffController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validationMiddleware";
import { body, param, query } from "express-validator";

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Validations
const validateStaffInput = validate([
  body("firstName").notEmpty().withMessage("First name is required"),
  body("lastName").notEmpty().withMessage("Last name is required"),
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format"),
  body("contactNumber").notEmpty().withMessage("Contact number is required"),
  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["doctor", "nurse", "admin", "receptionist", "pharmacist"])
    .withMessage("Invalid role"),
  body("department").notEmpty().withMessage("Department is required"),
  body("joinDate").notEmpty().withMessage("Join date is required"),
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["active", "inactive", "on-leave"])
    .withMessage("Invalid status"),
  body("workSchedule").isArray().withMessage("Work schedule must be an array"),
  body("workSchedule.*.day")
    .isIn([
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ])
    .withMessage("Invalid day in work schedule"),
  body("workSchedule.*.startTime")
    .notEmpty()
    .withMessage("Start time is required"),
  body("workSchedule.*.endTime").notEmpty().withMessage("End time is required"),
]);

const validateStaffIdParam = validate([
  param("id").notEmpty().withMessage("Staff ID is required"),
]);

// GET /api/staff - Get all staff members with optional filtering
router.get("/", staffController.getAllStaff);

// GET /api/staff/doctors - Get all doctors (for appointment forms)
router.get("/doctors", staffController.getDoctors);

// GET /api/staff/departments - Get unique departments for filtering
router.get("/departments", staffController.getDepartments);

// GET /api/staff/stats - Get staff statistics for dashboard
router.get("/stats", staffController.getStaffStats);

// GET /api/staff/search - Search staff
router.get(
  "/search",
  validate([query("q").exists().withMessage("Search query is required")]),
  staffController.searchStaff
);

// GET /api/staff/:id - Get staff by ID
router.get("/:id", validateStaffIdParam, staffController.getStaffById);

// POST /api/staff - Create new staff member
router.post(
  "/",
  authorize(["admin"]), // Only admins can create staff
  validateStaffInput,
  staffController.createStaff
);

// PUT /api/staff/:id - Update staff member
router.put(
  "/:id",
  authorize(["admin"]), // Only admins can update staff
  validateStaffIdParam,
  validateStaffInput,
  staffController.updateStaff
);

// DELETE /api/staff/:id - Delete staff member
router.delete(
  "/:id",
  authorize(["admin"]), // Only admins can delete staff
  validateStaffIdParam,
  staffController.deleteStaff
);

export default router;
