import db from "../../config/database";
import { logger } from "../../utils/logger";
import { v4 as uuidv4 } from "uuid";

interface AppointmentRecord {
  id: number;
  patientId: number;
  doctorId: string;
  startTime: string;
}

// Interface for the database row ID result
interface RowIdResult {
  id: number;
}

export const seed = async () => {
  try {
    const now = new Date().toISOString();
    logger.info("Seeding invoices...");

    // Check if invoices table exists
    const invoicesTableExists = db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='invoices'`
      )
      .get();

    if (!invoicesTableExists) {
      logger.warn("Invoices table doesn't exist, skipping invoice seeding");
      return;
    }

    // Get completed appointments to link invoices
    const appointments = db
      .prepare(
        `
        SELECT id, patientId, doctorId, startTime FROM appointments
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
      try {
        // Generate invoice ID using UUID for uniqueness
        const invoiceId = `INV-${uuidv4().substring(0, 8)}`;

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

        // Select random items
        const selectedItems = [];
        for (let i = 0; i < itemCount; i++) {
          const item =
            billingItems[Math.floor(Math.random() * billingItems.length)];
          totalAmount += item.amount;
          selectedItems.push(item);
        }

        // Random payment status and amount paid based on status
        let status,
          amountPaid,
          balance,
          paidDate = null,
          paymentMethod = null;
        const randomValue = Math.random();

        if (randomValue < 0.6) {
          // 60% fully paid
          status = "paid";
          amountPaid = totalAmount;
          balance = 0;
          paidDate = new Date(
            invoiceDate.getTime() +
              Math.random() * (Date.now() - invoiceDate.getTime())
          ).toISOString();
          paymentMethod = ["cash", "credit_card", "insurance", "check"][
            Math.floor(Math.random() * 4)
          ];
        } else if (randomValue < 0.8) {
          // 20% partially paid
          status = "partially_paid";
          amountPaid =
            Math.round(Math.random() * 0.8 * totalAmount * 100) / 100; // 0-80% paid
          balance = totalAmount - amountPaid;
        } else {
          // 20% unpaid
          status = Math.random() < 0.5 ? "sent" : "overdue";
          amountPaid = 0;
          balance = totalAmount;
        }

        // Insert the invoice
        db.prepare(
          `
          INSERT INTO invoices (
            id, patientId, appointmentId, totalAmount, amountPaid, 
            balance, status, dueDate, paidDate, paymentMethod, 
            notes, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
        ).run(
          invoiceId,
          appointment.patientId,
          appointment.id,
          totalAmount,
          amountPaid,
          balance,
          status,
          dueDate.toISOString(),
          paidDate,
          paymentMethod,
          "Generated from appointment",
          now,
          now
        );

        logger.info(
          `Created invoice ${invoiceId} for appointment ${appointment.id}`
        );
      } catch (error) {
        logger.error(
          `Error inserting invoice for appointment ${appointment.id}:`,
          error
        );
      }
    }

    logger.info("Invoices seeded successfully");
  } catch (error) {
    logger.error("Error in invoices seed:", error);
    throw error;
  }
};
