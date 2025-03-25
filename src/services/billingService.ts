import BillingModel from "../models/Billing";
import PatientModel from "../models/Patient";
import AppointmentModel from "../models/Appointment";
import {
  Invoice,
  InvoiceItem,
  Payment,
  InvoiceWithItems,
  InvoiceStatus,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  RecordPaymentRequest,
} from "../types/billing";
import { logger } from "../utils/logger";

/**
 * Get all invoices
 */
export const getAllInvoices = async (): Promise<InvoiceWithItems[]> => {
  try {
    return await BillingModel.getAllInvoices();
  } catch (error) {
    logger.error("Error in billingService.getAllInvoices:", error);
    throw new Error("Failed to retrieve invoices");
  }
};

/**
 * Get a single invoice by ID
 */
export const getInvoiceById = async (
  id: string
): Promise<InvoiceWithItems | null> => {
  try {
    return await BillingModel.getInvoiceById(id);
  } catch (error) {
    logger.error(`Error in billingService.getInvoiceById for ID ${id}:`, error);
    throw new Error("Failed to retrieve invoice");
  }
};

/**
 * Get invoices for a specific patient
 */
export const getInvoicesByPatientId = async (
  patientId: number
): Promise<InvoiceWithItems[]> => {
  try {
    // Verify patient exists
    const patient = await PatientModel.findById(patientId);
    if (!patient) {
      throw new Error("Patient not found");
    }

    return await BillingModel.getInvoicesByPatientId(patientId);
  } catch (error) {
    logger.error(
      `Error in billingService.getInvoicesByPatientId for patient ${patientId}:`,
      error
    );
    throw error;
  }
};

/**
 * Create a new invoice
 */
export const createInvoice = async (
  data: CreateInvoiceRequest
): Promise<InvoiceWithItems> => {
  try {
    // Validate patient
    const patient = await PatientModel.findById(data.patientId);
    if (!patient) {
      throw new Error("Patient not found");
    }

    // Validate appointment if provided
    if (data.appointmentId) {
      // Convert string ID to number before passing to the model
      const appointmentIdNum = parseInt(data.appointmentId, 10);

      // Verify it's a valid number
      if (isNaN(appointmentIdNum)) {
        throw new Error("Invalid appointment ID format");
      }

      const appointment = await AppointmentModel.getAppointmentById(
        appointmentIdNum
      );
      if (!appointment) {
        throw new Error("Appointment not found");
      }
    }

    // Validate items
    if (!data.items || data.items.length === 0) {
      throw new Error("At least one invoice item is required");
    }

    // Calculate totals
    let totalAmount = 0;
    for (const item of data.items) {
      if (!item.description) {
        throw new Error("Item description is required");
      }
      if (item.quantity <= 0) {
        throw new Error("Item quantity must be greater than zero");
      }
      if (item.unitPrice < 0) {
        throw new Error("Item unit price cannot be negative");
      }

      const amount = item.quantity * item.unitPrice;
      item.amount = amount;
      totalAmount += amount;
    }

    // Prepare invoice data
    const invoiceData: Omit<Invoice, "id" | "createdAt" | "updatedAt"> & {
      items: Omit<
        InvoiceItem,
        "id" | "invoiceId" | "createdAt" | "updatedAt"
      >[];
    } = {
      patientId: data.patientId,
      appointmentId: data.appointmentId,
      totalAmount,
      amountPaid: 0,
      balance: totalAmount,
      status: data.status || "draft",
      dueDate: data.dueDate,
      notes: data.notes,
      items: data.items,
    };

    // Create the invoice
    return await BillingModel.createInvoice(invoiceData);
  } catch (error) {
    logger.error("Error in billingService.createInvoice:", error);
    throw error;
  }
};

/**
 * Update an invoice
 */
export const updateInvoice = async (
  id: string,
  data: UpdateInvoiceRequest
): Promise<InvoiceWithItems | null> => {
  try {
    // Verify invoice exists
    const invoice = await BillingModel.getInvoiceById(id);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // Prevent updating paid invoices unless explicitly reverting status
    if (
      invoice.status === "paid" &&
      data.status !== "partially_paid" &&
      data.status !== "sent"
    ) {
      throw new Error("Paid invoices cannot be modified");
    }

    // Update the invoice
    return await BillingModel.updateInvoice(id, data);
  } catch (error) {
    logger.error(`Error in billingService.updateInvoice for ID ${id}:`, error);
    throw error;
  }
};

/**
 * Delete an invoice
 */
export const deleteInvoice = async (id: string): Promise<boolean> => {
  try {
    // Verify invoice exists
    const invoice = await BillingModel.getInvoiceById(id);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // Only draft invoices can be deleted
    if (invoice.status !== "draft") {
      throw new Error("Only draft invoices can be deleted");
    }

    return await BillingModel.deleteInvoice(id);
  } catch (error) {
    logger.error(`Error in billingService.deleteInvoice for ID ${id}:`, error);
    throw error;
  }
};

/**
 * Get payments for an invoice
 */
export const getInvoicePayments = async (
  invoiceId: string
): Promise<Payment[]> => {
  try {
    // Verify invoice exists
    const invoice = await BillingModel.getInvoiceById(invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    return await BillingModel.getInvoicePayments(invoiceId);
  } catch (error) {
    logger.error(
      `Error in billingService.getInvoicePayments for invoice ${invoiceId}:`,
      error
    );
    throw error;
  }
};

/**
 * Record a payment
 */
export const recordPayment = async (
  data: RecordPaymentRequest
): Promise<Payment> => {
  try {
    // Verify invoice exists
    const invoice = await BillingModel.getInvoiceById(data.invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // Validate payment amount
    if (data.amount <= 0) {
      throw new Error("Payment amount must be greater than zero");
    }

    if (data.amount > invoice.balance) {
      throw new Error(
        `Payment amount cannot exceed the invoice balance (${invoice.balance})`
      );
    }

    // Prepare payment data
    const paymentData: Omit<Payment, "id" | "createdAt" | "updatedAt"> = {
      invoiceId: data.invoiceId,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      transactionId: data.transactionId,
      notes: data.notes,
      processedBy: data.processedBy,
      processedDate: data.processedDate || new Date().toISOString(),
    };

    // Record the payment
    return await BillingModel.recordPayment(paymentData);
  } catch (error) {
    logger.error("Error in billingService.recordPayment:", error);
    throw error;
  }
};

/**
 * Get billing statistics
 */
export const getBillingStats = async (
  startDate?: string,
  endDate?: string
): Promise<any> => {
  try {
    return await BillingModel.getBillingStats(startDate, endDate);
  } catch (error) {
    logger.error("Error in billingService.getBillingStats:", error);
    throw new Error("Failed to retrieve billing statistics");
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
