import db from "../../config/database";
import { logger } from "../../utils/logger";
import { v4 as uuidv4 } from "uuid";

interface Invoice {
  id: string;
  totalAmount: number;
}

export const seed = async () => {
  try {
    const now = new Date().toISOString();
    logger.info("Seeding invoice items...");

    // Check if invoice_items table exists
    const tableExists = db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='invoice_items'`
      )
      .get();

    if (!tableExists) {
      logger.warn("Invoice items table doesn't exist, skipping seeding");
      return;
    }

    // Get invoices
    const invoices = db
      .prepare(`SELECT id, totalAmount FROM invoices`)
      .all() as Invoice[];

    if (invoices.length === 0) {
      logger.warn("No invoices found, skipping invoice items seeding");
      return;
    }

    const serviceItems = [
      { description: "Office Visit - New Patient", code: "99201", price: 85.0 },
      {
        description: "Office Visit - Established Patient",
        code: "99213",
        price: 65.0,
      },
      {
        description: "Consultation - Comprehensive",
        code: "99245",
        price: 150.0,
      },
      { description: "Blood Test Panel", code: "80053", price: 45.0 },
      { description: "X-Ray - Single View", code: "71045", price: 120.0 },
      { description: "EKG/ECG", code: "93000", price: 75.0 },
      { description: "Vaccination - Influenza", code: "90686", price: 35.0 },
      { description: "Physical Therapy - Initial", code: "97161", price: 95.0 },
      { description: "Medication Administration", code: "96372", price: 40.0 },
      { description: "Wound Care", code: "97597", price: 60.0 },
    ];

    const supplies = [
      { description: "Medical Supplies", code: "A4649", price: 25.0 },
      { description: "Dressing Supplies", code: "A6219", price: 18.5 },
      { description: "Injection Supplies", code: "A4209", price: 12.75 },
    ];

    // Add items to each invoice
    for (const invoice of invoices) {
      // Calculate how many items to create based on total invoice amount
      const targetAmount = invoice.totalAmount;
      let currentTotal = 0;
      let items = [];

      // Always add a primary service
      const primaryService =
        serviceItems[Math.floor(Math.random() * serviceItems.length)];
      const primaryQuantity = 1;
      const primaryAmount = primaryService.price * primaryQuantity;
      currentTotal += primaryAmount;

      items.push({
        id: `ITEM-${uuidv4().substring(0, 8)}`,
        invoiceId: invoice.id,
        description: primaryService.description,
        quantity: primaryQuantity,
        unitPrice: primaryService.price,
        amount: primaryAmount,
        serviceCode: primaryService.code,
        taxRate: 0,
        createdAt: now,
        updatedAt: now,
      });

      // Add additional services and supplies until we get close to the target amount
      while (currentTotal < targetAmount * 0.95) {
        // 70% chance of service, 30% chance of supply
        const item =
          Math.random() < 0.7
            ? serviceItems[Math.floor(Math.random() * serviceItems.length)]
            : supplies[Math.floor(Math.random() * supplies.length)];

        const quantity =
          item.price < 50 ? Math.floor(Math.random() * 3) + 1 : 1;
        const amount = item.price * quantity;

        // If adding this would exceed the target, break
        if (currentTotal + amount > targetAmount) {
          break;
        }

        currentTotal += amount;

        items.push({
          id: `ITEM-${uuidv4().substring(0, 8)}`,
          invoiceId: invoice.id,
          description: item.description,
          quantity: quantity,
          unitPrice: item.price,
          amount: amount,
          serviceCode: item.code,
          taxRate: 0,
          createdAt: now,
          updatedAt: now,
        });
      }

      // Insert all items
      for (const item of items) {
        try {
          db.prepare(
            `
            INSERT INTO invoice_items (
              id, invoiceId, description, quantity, unitPrice, amount, 
              serviceCode, taxRate, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `
          ).run(
            item.id,
            item.invoiceId,
            item.description,
            item.quantity,
            item.unitPrice,
            item.amount,
            item.serviceCode,
            item.taxRate,
            item.createdAt,
            item.updatedAt
          );
        } catch (error) {
          logger.error(
            `Error inserting invoice item for invoice ${invoice.id}:`,
            error
          );
        }
      }
    }

    logger.info("Invoice items seeded successfully");
  } catch (error) {
    logger.error("Error in invoice items seed:", error);
    throw error;
  }
};
