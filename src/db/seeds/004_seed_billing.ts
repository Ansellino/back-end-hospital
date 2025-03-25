import db from "../../config/database";
import { logger } from "../../utils/logger";
import { v4 as uuidv4 } from "uuid";

// Define the structure of appointments from the database
interface AppointmentRecord {
  id: number;
  patientId: number;
}

export const seed = async () => {
  const now = new Date().toISOString();

  // Get all appointments for billing records with type assertion
  const appointments = db
    .prepare(
      `
    SELECT id, patientId FROM appointments
  `
    )
    .all() as AppointmentRecord[];

  if (appointments.length === 0) {
    logger.warn("No appointments found, skipping billing seeding");
    return;
  }

  const billingItems = [
    { description: "Office Visit - New Patient", code: "99201", amount: 85.0 },
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
    { description: "Consultation - 30 minutes", code: "99242", amount: 110.0 },
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

  // Add billing records for each appointment
  for (const appointment of appointments) {
    // Generate invoice ID
    const invoiceId = `INV-${Math.floor(Math.random() * 900000) + 100000}`;

    // Invoice date (slightly in the past)
    const invoiceDate = new Date();
    invoiceDate.setDate(invoiceDate.getDate() - Math.floor(Math.random() * 30));

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

    db.prepare(
      `
      INSERT INTO billing (invoiceId, patientId, appointmentId, invoiceDate, dueDate, amount, status, items, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      invoiceId,
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
  }

  logger.info("Billing records seeded successfully");
};
