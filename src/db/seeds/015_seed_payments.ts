import db from "../../config/database";
import { logger } from "../../utils/logger";
import { v4 as uuidv4 } from "uuid";

interface Invoice {
  id: string;
  patientId: number;
  totalAmount: number;
  amountPaid: number;
  status: string;
}

interface User {
  id: number;
  role: string;
}

export const seed = async () => {
  try {
    const now = new Date().toISOString();
    logger.info("Seeding payments...");

    // Check if payments table exists
    const tableExists = db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='payments'`
      )
      .get();

    if (!tableExists) {
      logger.warn("Payments table doesn't exist, skipping seeding");
      return;
    }

    // Get invoices that have status='paid' or status='partial'
    const invoices = db
      .prepare(
        `
        SELECT id, patientId, totalAmount, amountPaid, status 
        FROM invoices 
        WHERE status = 'paid' OR status = 'partial'
      `
      )
      .all() as Invoice[];

    if (invoices.length === 0) {
      logger.warn("No paid invoices found, skipping payments seeding");
      return;
    }

    // Get staff IDs for processed by field
    const users = db
      .prepare(
        `SELECT id, role FROM users WHERE role = 'admin' OR role = 'receptionist'`
      )
      .all() as User[];

    if (users.length === 0) {
      logger.warn("No admin/receptionist users found for payment processing");
      return;
    }

    const paymentMethods = [
      "Credit Card",
      "Cash",
      "Insurance",
      "Bank Transfer",
    ];

    // For each invoice, create payment records
    for (const invoice of invoices) {
      try {
        // For paid invoices, create a single payment
        if (invoice.status === "paid") {
          const paymentMethod =
            paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
          const processedBy =
            users[Math.floor(Math.random() * users.length)].id.toString();
          const processedDate = new Date();

          // Payment between 0-30 days ago
          processedDate.setDate(
            processedDate.getDate() - Math.floor(Math.random() * 30)
          );

          // Transaction ID for card/bank transfers
          const transactionId =
            paymentMethod === "Credit Card" || paymentMethod === "Bank Transfer"
              ? `TXN-${Math.floor(Math.random() * 900000) + 100000}`
              : null;

          const paymentId = `PMT-${uuidv4().substring(0, 8)}`;

          db.prepare(
            `
            INSERT INTO payments (
              id, invoiceId, amount, paymentMethod, transactionId, 
              notes, processedBy, processedDate, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `
          ).run(
            paymentId,
            invoice.id,
            invoice.totalAmount,
            paymentMethod,
            transactionId,
            "Payment received in full.",
            processedBy,
            processedDate.toISOString(),
            now,
            now
          );
        }
        // For partial payments, create multiple payment records
        else if (invoice.status === "partial") {
          // Calculate how many payments (1-3)
          const numPayments = Math.floor(Math.random() * 3) + 1;

          // How much has been paid so far
          const paidAmount = invoice.amountPaid;

          // Divide payments into random chunks that sum to paid amount
          let remainingAmount = paidAmount;
          let paymentChunks = [];

          for (let i = 0; i < numPayments - 1; i++) {
            // Random proportion of remaining amount (25-75%)
            const proportion = Math.random() * 0.5 + 0.25;
            const amount = Math.round(remainingAmount * proportion * 100) / 100;
            paymentChunks.push(amount);
            remainingAmount -= amount;
          }

          // Last payment is whatever remains
          paymentChunks.push(Math.round(remainingAmount * 100) / 100);

          // Create each payment, with older dates for earlier payments
          for (let i = 0; i < numPayments; i++) {
            const paymentMethod =
              paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
            const processedBy =
              users[Math.floor(Math.random() * users.length)].id.toString();

            // Payment between (30 - i*10) days ago
            const processedDate = new Date();
            processedDate.setDate(
              processedDate.getDate() -
                (30 - i * 10) +
                Math.floor(Math.random() * 5)
            );

            const transactionId =
              paymentMethod === "Credit Card" ||
              paymentMethod === "Bank Transfer"
                ? `TXN-${Math.floor(Math.random() * 900000) + 100000}`
                : null;

            const paymentId = `PMT-${uuidv4().substring(0, 8)}`;
            const paymentNote =
              i === numPayments - 1
                ? "Partial payment received."
                : i === 0
                ? "Initial payment."
                : "Installment payment.";

            db.prepare(
              `
              INSERT INTO payments (
                id, invoiceId, amount, paymentMethod, transactionId, 
                notes, processedBy, processedDate, createdAt, updatedAt
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `
            ).run(
              paymentId,
              invoice.id,
              paymentChunks[i],
              paymentMethod,
              transactionId,
              paymentNote,
              processedBy,
              processedDate.toISOString(),
              now,
              now
            );
          }
        }
      } catch (error) {
        logger.error(
          `Error inserting payments for invoice ${invoice.id}:`,
          error
        );
      }
    }

    logger.info("Payments seeded successfully");
  } catch (error) {
    logger.error("Error in payments seed:", error);
    throw error;
  }
};
