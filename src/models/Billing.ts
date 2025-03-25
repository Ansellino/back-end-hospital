import db from "../config/database";
import { logger } from "../utils/logger";
import { v4 as uuidv4 } from "uuid";
import {
  Invoice,
  InvoiceItem,
  Payment,
  InvoiceWithItems,
  InvoiceStatus,
  PaymentMethod,
} from "../types/billing";

/**
 * Initialize invoices table
 */
export const createInvoicesTable = async (): Promise<void> => {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        patientId INTEGER NOT NULL,
        appointmentId TEXT,
        totalAmount REAL NOT NULL,
        amountPaid REAL NOT NULL DEFAULT 0,
        balance REAL NOT NULL,
        status TEXT NOT NULL,
        dueDate TEXT NOT NULL,
        paidDate TEXT,
        paymentMethod TEXT,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (patientId) REFERENCES patients (id) ON DELETE CASCADE
      )
    `);
    logger.info("Invoices table initialized");
  } catch (error) {
    logger.error("Error initializing invoices table:", error);
    throw new Error("Failed to initialize invoices table");
  }
};

/**
 * Initialize invoice items table
 */
export const createInvoiceItemsTable = async (): Promise<void> => {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id TEXT PRIMARY KEY,
        invoiceId TEXT NOT NULL,
        description TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unitPrice REAL NOT NULL,
        amount REAL NOT NULL,
        serviceCode TEXT,
        taxRate REAL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (invoiceId) REFERENCES invoices (id) ON DELETE CASCADE
      )
    `);
    logger.info("Invoice items table initialized");
  } catch (error) {
    logger.error("Error initializing invoice items table:", error);
    throw new Error("Failed to initialize invoice items table");
  }
};

/**
 * Initialize payments table
 */
export const createPaymentsTable = async (): Promise<void> => {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        invoiceId TEXT NOT NULL,
        amount REAL NOT NULL,
        paymentMethod TEXT NOT NULL,
        transactionId TEXT,
        notes TEXT,
        processedBy TEXT NOT NULL,
        processedDate TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (invoiceId) REFERENCES invoices (id) ON DELETE CASCADE
      )
    `);
    logger.info("Payments table initialized");
  } catch (error) {
    logger.error("Error initializing payments table:", error);
    throw new Error("Failed to initialize payments table");
  }
};

/**
 * Get all invoices
 */
export const getAllInvoices = async (): Promise<InvoiceWithItems[]> => {
  try {
    const invoices = db
      .prepare(
        `
      SELECT * FROM invoices
      ORDER BY createdAt DESC
    `
      )
      .all() as Invoice[];

    // Get items for each invoice
    return await Promise.all(
      invoices.map(async (invoice) => {
        const items = await getInvoiceItems(invoice.id);
        return { ...invoice, items };
      })
    );
  } catch (error) {
    logger.error("Error getting all invoices:", error);
    throw new Error("Failed to retrieve invoices");
  }
};

/**
 * Get invoice by ID
 */
export const getInvoiceById = async (
  id: string
): Promise<InvoiceWithItems | null> => {
  try {
    const invoice = db
      .prepare(
        `
      SELECT * FROM invoices
      WHERE id = ?
    `
      )
      .get(id) as Invoice | undefined;

    if (!invoice) {
      return null;
    }

    // Get items for this invoice
    const items = await getInvoiceItems(id);

    return { ...invoice, items };
  } catch (error) {
    logger.error(`Error getting invoice with id ${id}:`, error);
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
    const invoices = db
      .prepare(
        `
      SELECT * FROM invoices
      WHERE patientId = ?
      ORDER BY createdAt DESC
    `
      )
      .all(patientId) as Invoice[];

    // Get items for each invoice
    return await Promise.all(
      invoices.map(async (invoice) => {
        const items = await getInvoiceItems(invoice.id);
        return { ...invoice, items };
      })
    );
  } catch (error) {
    logger.error(`Error getting invoices for patient ${patientId}:`, error);
    throw new Error("Failed to retrieve patient invoices");
  }
};

/**
 * Get invoice items
 */
export const getInvoiceItems = async (
  invoiceId: string
): Promise<InvoiceItem[]> => {
  try {
    const items = db
      .prepare(
        `
      SELECT * FROM invoice_items
      WHERE invoiceId = ?
    `
      )
      .all(invoiceId) as InvoiceItem[];

    return items;
  } catch (error) {
    logger.error(`Error getting items for invoice ${invoiceId}:`, error);
    throw new Error("Failed to retrieve invoice items");
  }
};

/**
 * Create a new invoice
 */
export const createInvoice = async (
  data: Omit<Invoice, "id" | "createdAt" | "updatedAt"> & {
    items: Omit<InvoiceItem, "id" | "invoiceId" | "createdAt" | "updatedAt">[];
  }
): Promise<InvoiceWithItems> => {
  try {
    const now = new Date().toISOString();
    const invoiceId = `INV-${uuidv4().split("-")[0]}`;

    // Insert invoice
    db.prepare(
      `
      INSERT INTO invoices (
        id, patientId, appointmentId, totalAmount, amountPaid, balance,
        status, dueDate, paidDate, paymentMethod, notes, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      invoiceId,
      data.patientId,
      data.appointmentId || null,
      data.totalAmount,
      data.amountPaid,
      data.balance,
      data.status,
      data.dueDate,
      data.paidDate || null,
      data.paymentMethod || null,
      data.notes || null,
      now,
      now
    );

    // Insert invoice items
    const itemInsertStmt = db.prepare(`
      INSERT INTO invoice_items (
        id, invoiceId, description, quantity, unitPrice, amount,
        serviceCode, taxRate, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of data.items) {
      const itemId = `ITEM-${uuidv4().split("-")[0]}`;
      itemInsertStmt.run(
        itemId,
        invoiceId,
        item.description,
        item.quantity,
        item.unitPrice,
        item.amount,
        item.serviceCode || null,
        item.taxRate || null,
        now,
        now
      );
    }

    return (await getInvoiceById(invoiceId)) as InvoiceWithItems;
  } catch (error) {
    logger.error("Error creating invoice:", error);
    throw new Error("Failed to create invoice");
  }
};

/**
 * Update an invoice
 */
export const updateInvoice = async (
  id: string,
  data: Partial<Omit<Invoice, "id" | "createdAt" | "updatedAt">>
): Promise<InvoiceWithItems | null> => {
  try {
    const invoice = await getInvoiceById(id);
    if (!invoice) {
      return null;
    }

    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: any[] = [];

    // Build the SET clause dynamically
    for (const [key, value] of Object.entries(data)) {
      updates.push(`${key} = ?`);
      values.push(value === undefined ? null : value);
    }

    // Always update the updatedAt timestamp
    updates.push("updatedAt = ?");
    values.push(now);
    values.push(id); // For the WHERE clause

    // Update the invoice
    db.prepare(
      `
      UPDATE invoices
      SET ${updates.join(", ")}
      WHERE id = ?
    `
    ).run(...values);

    return await getInvoiceById(id);
  } catch (error) {
    logger.error(`Error updating invoice ${id}:`, error);
    throw new Error("Failed to update invoice");
  }
};

/**
 * Delete an invoice
 */
export const deleteInvoice = async (id: string): Promise<boolean> => {
  try {
    const invoice = await getInvoiceById(id);
    if (!invoice) {
      return false;
    }

    // Due to CASCADE constraints, this will also delete
    // any related invoice items and payments
    const result = db
      .prepare(
        `
      DELETE FROM invoices
      WHERE id = ?
    `
      )
      .run(id);

    return result.changes > 0;
  } catch (error) {
    logger.error(`Error deleting invoice ${id}:`, error);
    throw new Error("Failed to delete invoice");
  }
};

/**
 * Get payments for an invoice
 */
export const getInvoicePayments = async (
  invoiceId: string
): Promise<Payment[]> => {
  try {
    const payments = db
      .prepare(
        `
      SELECT * FROM payments
      WHERE invoiceId = ?
      ORDER BY processedDate DESC
    `
      )
      .all(invoiceId) as Payment[];

    return payments;
  } catch (error) {
    logger.error(`Error getting payments for invoice ${invoiceId}:`, error);
    throw new Error("Failed to retrieve invoice payments");
  }
};

/**
 * Record a payment
 */
export const recordPayment = async (
  data: Omit<Payment, "id" | "createdAt" | "updatedAt">
): Promise<Payment> => {
  try {
    const now = new Date().toISOString();
    const paymentId = `PAY-${uuidv4().split("-")[0]}`;

    // Insert payment
    db.prepare(
      `
      INSERT INTO payments (
        id, invoiceId, amount, paymentMethod, transactionId,
        notes, processedBy, processedDate, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      paymentId,
      data.invoiceId,
      data.amount,
      data.paymentMethod,
      data.transactionId || null,
      data.notes || null,
      data.processedBy,
      data.processedDate,
      now,
      now
    );

    // Get the invoice to update its balance
    const invoice = await getInvoiceById(data.invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // Update invoice balance
    const newAmountPaid = invoice.amountPaid + data.amount;
    const newBalance = invoice.totalAmount - newAmountPaid;

    // Determine new status
    let newStatus: InvoiceStatus = invoice.status;
    if (newBalance <= 0) {
      newStatus = "paid";
    } else if (newBalance < invoice.totalAmount) {
      newStatus = "partially_paid";
    }

    // Update the invoice
    await updateInvoice(data.invoiceId, {
      amountPaid: newAmountPaid,
      balance: newBalance,
      status: newStatus,
      paidDate: newBalance <= 0 ? now : undefined,
      paymentMethod: data.paymentMethod,
    });

    // Get the created payment
    const payment = db
      .prepare(
        `
      SELECT * FROM payments
      WHERE id = ?
    `
      )
      .get(paymentId) as Payment;

    return payment;
  } catch (error) {
    logger.error("Error recording payment:", error);
    throw new Error("Failed to record payment");
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
    const now = new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = endDate
      ? new Date(endDate)
      : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Total invoiced amount
    const totalInvoiced = db
      .prepare(
        `
      SELECT SUM(totalAmount) as total
      FROM invoices
      WHERE createdAt BETWEEN ? AND ?
    `
      )
      .get(start.toISOString(), end.toISOString()) as { total: number };

    // Total paid amount
    const totalPaid = db
      .prepare(
        `
      SELECT SUM(amount) as total
      FROM payments
      WHERE processedDate BETWEEN ? AND ?
    `
      )
      .get(start.toISOString(), end.toISOString()) as { total: number };

    // Outstanding balance
    const outstandingBalance = db
      .prepare(
        `
      SELECT SUM(balance) as total
      FROM invoices
      WHERE status != 'paid' AND status != 'cancelled'
    `
      )
      .get() as { total: number };

    // Invoices by status
    const statusCounts = db
      .prepare(
        `
      SELECT status, COUNT(*) as count
      FROM invoices
      GROUP BY status
    `
      )
      .all() as Array<{ status: InvoiceStatus; count: number }>;

    // Convert to object with status as keys
    const invoicesByStatus: Record<string, number> = {};
    for (const { status, count } of statusCounts) {
      invoicesByStatus[status] = count;
    }

    // Recent payments
    const recentPayments = db
      .prepare(
        `
      SELECT *
      FROM payments
      ORDER BY processedDate DESC
      LIMIT 5
    `
      )
      .all() as Payment[];

    return {
      totalInvoiced: totalInvoiced.total || 0,
      totalPaid: totalPaid.total || 0,
      outstandingBalance: outstandingBalance.total || 0,
      invoicesByStatus,
      recentPayments,
    };
  } catch (error) {
    logger.error("Error getting billing statistics:", error);
    throw new Error("Failed to retrieve billing statistics");
  }
};

export default {
  createInvoicesTable,
  createInvoiceItemsTable,
  createPaymentsTable,
  getAllInvoices,
  getInvoiceById,
  getInvoicesByPatientId,
  getInvoiceItems,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoicePayments,
  recordPayment,
  getBillingStats,
};
