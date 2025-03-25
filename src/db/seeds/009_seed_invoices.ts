import db from "../../config/database";
import { logger } from "../../utils/logger";
import { v4 as uuidv4 } from "uuid";

interface AppointmentRecord {
  id: number;
  patientId: number;
}

// Interface for the database row ID result
interface RowIdResult {
  id: number;
}

export const seed = async () => {
  try {
    const now = new Date().toISOString();
    logger.info("Seeding invoices and billing records...");

    // Check if invoices table exists
    const invoicesTableExists = db
      .prepare(
        `
      SELECT name FROM sqlite_master WHERE type='table' AND name='invoices'
    `
      )
      .get();

    // Check if billing table exists
    const billingTableExists = db
      .prepare(
        `
      SELECT name FROM sqlite_master WHERE type='table' AND name='billing'
    `
      )
      .get();

    if (!invoicesTableExists && !billingTableExists) {
      logger.warn(
        "Neither invoices nor billing table exists, skipping invoice seeding"
      );
      return;
    }

    // Get completed appointments to link invoices
    const appointments = db
      .prepare(
        `
      SELECT id, patientId FROM appointments
      WHERE status = 'completed'
    `
      )
      .all() as AppointmentRecord[];

    if (appointments.length === 0) {
      logger.warn("No completed appointments found, skipping invoice seeding");
      return;
    }

    const billingItems = [
      {
        description: "Office Visit - New Patient",
        code: "99201",
        amount: 85.0,
      },
      {
        description: "Office Visit - Established Patient",
        code: "99213",
        amount: 65.0,
      },
      {
        description: "Preventative Visit - Annual Physical",
        code: "99395",
        amount: 120.0,
      },
      {
        description: "Consultation - 30 minutes",
        code: "99242",
        amount: 110.0,
      },
      {
        description: "Blood Test - Basic Metabolic Panel",
        code: "80048",
        amount: 45.0,
      },
      {
        description: "Blood Test - Complete Blood Count",
        code: "85025",
        amount: 35.0,
      },
      { description: "X-Ray - Chest", code: "71045", amount: 95.0 },
      { description: "ECG - Standard", code: "93000", amount: 75.0 },
      { description: "Vaccination - Influenza", code: "90686", amount: 40.0 },
    ];

    // Create invoices for each completed appointment
    for (const appointment of appointments) {
      // Generate invoice ID
      const generatedInvoiceId = `INV-${
        Math.floor(Math.random() * 900000) + 100000
      }`;

      // Invoice date (slightly in the past)
      const invoiceDate = new Date();
      invoiceDate.setDate(
        invoiceDate.getDate() - Math.floor(Math.random() * 30)
      );

      // Due date (30 days after invoice date)
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + 30);

      // Random number of items (1-3)
      const itemCount = Math.floor(Math.random() * 3) + 1;
      let totalAmount = 0;
      const items = [];

      for (let i = 0; i < itemCount; i++) {
        const item =
          billingItems[Math.floor(Math.random() * billingItems.length)];
        totalAmount += item.amount;
        items.push(item);
      }

      // Random payment status
      const status =
        Math.random() < 0.7
          ? "paid"
          : Math.random() < 0.5
          ? "pending"
          : "overdue";

      // Try inserting into invoices table if it exists
      if (invoicesTableExists) {
        try {
          const invoiceResult = db
            .prepare(
              `
            INSERT INTO invoices (invoiceNumber, patientId, appointmentId, issueDate, dueDate, totalAmount, status, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `
            )
            .run(
              generatedInvoiceId,
              appointment.patientId,
              appointment.id,
              invoiceDate.toISOString(),
              dueDate.toISOString(),
              totalAmount,
              status,
              now,
              now
            );

          // Get the invoice ID and create invoice items
          const rowIdResult = db
            .prepare("SELECT last_insert_rowid() as id")
            .get() as RowIdResult;

          const dbInvoiceId = rowIdResult.id;

          // Add invoice items
          for (const item of items) {
            db.prepare(
              `
              INSERT INTO invoice_items (invoiceId, description, code, amount, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?)
            `
            ).run(
              dbInvoiceId,
              item.description,
              item.code,
              item.amount,
              now,
              now
            );
          }

          // If paid, create a payment record
          if (status === "paid") {
            db.prepare(
              `
              INSERT INTO payments (invoiceId, patientId, amount, paymentDate, paymentMethod, transactionId, status, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `
            ).run(
              dbInvoiceId,
              appointment.patientId,
              totalAmount,
              new Date(
                invoiceDate.getTime() +
                  Math.random() * (dueDate.getTime() - invoiceDate.getTime())
              ).toISOString(),
              ["Credit Card", "Cash", "Insurance", "Bank Transfer"][
                Math.floor(Math.random() * 4)
              ],
              `TXN-${Math.floor(Math.random() * 1000000)}`,
              "completed",
              now,
              now
            );
          }
        } catch (error) {
          logger.error(
            `Error inserting invoice for appointment ${appointment.id}:`,
            error
          );
        }
      }

      // Try inserting into billing table if it exists
      if (billingTableExists) {
        try {
          db.prepare(
            `
            INSERT INTO billing (invoiceId, patientId, appointmentId, invoiceDate, dueDate, amount, status, items, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `
          ).run(
            generatedInvoiceId,
            appointment.patientId,
            appointment.id,
            invoiceDate.toISOString(),
            dueDate.toISOString(),
            totalAmount,
            status,
            JSON.stringify(items),
            now,
            now
          );
        } catch (error) {
          logger.error(
            `Error inserting billing record for appointment ${appointment.id}:`,
            error
          );
        }
      }
    }

    logger.info("Invoices and billing records seeded successfully");
  } catch (error) {
    logger.error("Error in invoices seed:", error);
    throw error;
  }
};
