import { Router } from "express";
import * as billingController from "../controllers/billingController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validationMiddleware";
import { body, param, query } from "express-validator";

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Input validation middleware
const validateInvoiceInput = validate([
  body("patientId").isInt().withMessage("Patient ID must be a number"),
  body("dueDate").isDate().withMessage("Due date must be a valid date"),
  body("items")
    .isArray({ min: 1 })
    .withMessage("At least one item is required"),
  body("items.*.description")
    .notEmpty()
    .withMessage("Item description is required"),
  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),
  body("items.*.unitPrice")
    .isFloat({ min: 0 })
    .withMessage("Unit price cannot be negative"),
]);

const validatePaymentInput = validate([
  body("invoiceId").notEmpty().withMessage("Invoice ID is required"),
  body("amount")
    .isFloat({ min: 0.01 })
    .withMessage("Amount must be greater than zero"),
  body("paymentMethod")
    .isIn([
      "cash",
      "credit_card",
      "debit_card",
      "insurance",
      "bank_transfer",
      "check",
    ])
    .withMessage("Invalid payment method"),
]);

const validateIdParam = validate([
  param("id").notEmpty().withMessage("ID is required"),
]);

const validatePatientIdParam = validate([
  param("patientId").isInt().withMessage("Patient ID must be a number"),
]);

// GET /api/billing/invoices
router.get(
  "/invoices",
  authorize(["admin", "receptionist", "accountant"]),
  billingController.getAllInvoices
);

// GET /api/billing/invoices/:id
router.get(
  "/invoices/:id",
  authorize(["admin", "receptionist", "accountant", "doctor"]),
  validateIdParam,
  billingController.getInvoiceById
);

// GET /api/billing/patients/:patientId/invoices
router.get(
  "/patients/:patientId/invoices",
  authorize(["admin", "receptionist", "accountant", "doctor"]),
  validatePatientIdParam,
  billingController.getInvoicesByPatientId
);

// POST /api/billing/invoices
router.post(
  "/invoices",
  authorize(["admin", "receptionist", "accountant"]),
  validateInvoiceInput,
  billingController.createInvoice
);

// PUT /api/billing/invoices/:id
router.put(
  "/invoices/:id",
  authorize(["admin", "receptionist", "accountant"]),
  validateIdParam,
  billingController.updateInvoice
);

// DELETE /api/billing/invoices/:id
router.delete(
  "/invoices/:id",
  authorize(["admin"]),
  validateIdParam,
  billingController.deleteInvoice
);

// GET /api/billing/invoices/:id/payments
router.get(
  "/invoices/:id/payments",
  authorize(["admin", "receptionist", "accountant"]),
  validateIdParam,
  billingController.getInvoicePayments
);

// POST /api/billing/payments
router.post(
  "/payments",
  authorize(["admin", "receptionist", "accountant"]),
  validatePaymentInput,
  billingController.recordPayment
);

// GET /api/billing/stats
router.get(
  "/stats",
  authorize(["admin", "accountant"]),
  billingController.getBillingStats
);

export default router;
