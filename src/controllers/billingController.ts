import { Request, Response } from "express";
import billingService from "../services/billingService";
import { successResponse, errorResponse } from "../utils/apiResponse";
import { logger } from "../utils/logger";

/**
 * Get all invoices
 * @route GET /api/billing/invoices
 */
export const getAllInvoices = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const invoices = await billingService.getAllInvoices();

    res
      .status(200)
      .json(successResponse("Invoices retrieved successfully", invoices));
  } catch (error) {
    logger.error("Error retrieving invoices:", error);
    res.status(500).json(errorResponse("Failed to retrieve invoices"));
  }
};

/**
 * Get a single invoice by ID
 * @route GET /api/billing/invoices/:id
 */
export const getInvoiceById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const invoice = await billingService.getInvoiceById(id);

    if (!invoice) {
      res.status(404).json(errorResponse("Invoice not found"));
      return;
    }

    res
      .status(200)
      .json(successResponse("Invoice retrieved successfully", invoice));
  } catch (error) {
    logger.error(`Error retrieving invoice ${req.params.id}:`, error);
    res.status(500).json(errorResponse("Failed to retrieve invoice"));
  }
};

/**
 * Get invoices for a specific patient
 * @route GET /api/billing/patients/:patientId/invoices
 */
export const getInvoicesByPatientId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const patientId = parseInt(req.params.patientId);

    if (isNaN(patientId)) {
      res.status(400).json(errorResponse("Invalid patient ID"));
      return;
    }

    const invoices = await billingService.getInvoicesByPatientId(patientId);

    res
      .status(200)
      .json(
        successResponse("Patient invoices retrieved successfully", invoices)
      );
  } catch (error) {
    logger.error(
      `Error retrieving invoices for patient ${req.params.patientId}:`,
      error
    );

    if (error instanceof Error && error.message === "Patient not found") {
      res.status(404).json(errorResponse(error.message));
      return;
    }

    res.status(500).json(errorResponse("Failed to retrieve patient invoices"));
  }
};

/**
 * Create a new invoice
 * @route POST /api/billing/invoices
 */
export const createInvoice = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const invoiceData = req.body;

    const newInvoice = await billingService.createInvoice(invoiceData);

    res
      .status(201)
      .json(successResponse("Invoice created successfully", newInvoice));
  } catch (error) {
    logger.error("Error creating invoice:", error);

    if (error instanceof Error) {
      // Return specific validation errors
      if (
        error.message === "Patient not found" ||
        error.message === "Appointment not found" ||
        error.message === "At least one invoice item is required" ||
        error.message === "Item description is required" ||
        error.message === "Item quantity must be greater than zero" ||
        error.message === "Item unit price cannot be negative"
      ) {
        res.status(400).json(errorResponse(error.message));
        return;
      }
    }

    res.status(500).json(errorResponse("Failed to create invoice"));
  }
};

/**
 * Update an invoice
 * @route PUT /api/billing/invoices/:id
 */
export const updateInvoice = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const invoiceData = req.body;

    const updatedInvoice = await billingService.updateInvoice(id, invoiceData);

    if (!updatedInvoice) {
      res.status(404).json(errorResponse("Invoice not found"));
      return;
    }

    res
      .status(200)
      .json(successResponse("Invoice updated successfully", updatedInvoice));
  } catch (error) {
    logger.error(`Error updating invoice ${req.params.id}:`, error);

    if (error instanceof Error) {
      if (
        error.message === "Invoice not found" ||
        error.message === "Paid invoices cannot be modified"
      ) {
        const status = error.message === "Invoice not found" ? 404 : 400;
        res.status(status).json(errorResponse(error.message));
        return;
      }
    }

    res.status(500).json(errorResponse("Failed to update invoice"));
  }
};

/**
 * Delete an invoice
 * @route DELETE /api/billing/invoices/:id
 */
export const deleteInvoice = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await billingService.deleteInvoice(id);

    if (!result) {
      res.status(404).json(errorResponse("Invoice not found"));
      return;
    }

    res.status(200).json(successResponse("Invoice deleted successfully"));
  } catch (error) {
    logger.error(`Error deleting invoice ${req.params.id}:`, error);

    if (error instanceof Error) {
      if (
        error.message === "Invoice not found" ||
        error.message === "Only draft invoices can be deleted"
      ) {
        const status = error.message === "Invoice not found" ? 404 : 400;
        res.status(status).json(errorResponse(error.message));
        return;
      }
    }

    res.status(500).json(errorResponse("Failed to delete invoice"));
  }
};

/**
 * Get payments for an invoice
 * @route GET /api/billing/invoices/:id/payments
 */
export const getInvoicePayments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const payments = await billingService.getInvoicePayments(id);

    res
      .status(200)
      .json(
        successResponse("Invoice payments retrieved successfully", payments)
      );
  } catch (error) {
    logger.error(
      `Error retrieving payments for invoice ${req.params.id}:`,
      error
    );

    if (error instanceof Error && error.message === "Invoice not found") {
      res.status(404).json(errorResponse(error.message));
      return;
    }

    res.status(500).json(errorResponse("Failed to retrieve invoice payments"));
  }
};

/**
 * Record a payment
 * @route POST /api/billing/payments
 */
export const recordPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const paymentData = req.body;

    const newPayment = await billingService.recordPayment({
      ...paymentData,
      processedBy: req.user?.id || "SYSTEM", // Get from authenticated user
    });

    res
      .status(201)
      .json(successResponse("Payment recorded successfully", newPayment));
  } catch (error) {
    logger.error("Error recording payment:", error);

    if (error instanceof Error) {
      if (
        error.message === "Invoice not found" ||
        error.message === "Payment amount must be greater than zero" ||
        error.message.startsWith("Payment amount cannot exceed")
      ) {
        const status = error.message === "Invoice not found" ? 404 : 400;
        res.status(status).json(errorResponse(error.message));
        return;
      }
    }

    res.status(500).json(errorResponse("Failed to record payment"));
  }
};

/**
 * Get billing statistics
 * @route GET /api/billing/stats
 */
export const getBillingStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await billingService.getBillingStats(
      startDate as string,
      endDate as string
    );

    res
      .status(200)
      .json(
        successResponse("Billing statistics retrieved successfully", stats)
      );
  } catch (error) {
    logger.error("Error retrieving billing statistics:", error);
    res
      .status(500)
      .json(errorResponse("Failed to retrieve billing statistics"));
  }
};

export default {
  getAllInvoices,
  getInvoiceById,
  getInvoicesByPatientId,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoicePayments,
  recordPayment,
  getBillingStats,
};
