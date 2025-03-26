import db from "../../config/database";
import { logger } from "../../utils/logger";

interface MedicalRecord {
  id: number;
  patientId: number;
  doctorId: string;
}

export const seed = async () => {
  try {
    const now = new Date().toISOString();
    logger.info("Seeding medications...");

    // Check if medications table exists
    const tableExists = db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='medications'`
      )
      .get();

    if (!tableExists) {
      logger.warn(
        "Medications table doesn't exist, skipping medications seeding"
      );
      return;
    }

    // Get medical records to link medications
    const medicalRecords = db
      .prepare(`SELECT id, patientId, doctorId FROM medical_records`)
      .all() as MedicalRecord[];

    if (medicalRecords.length === 0) {
      logger.warn("No medical records found, skipping medications seeding");
      return;
    }

    const medications = [
      { name: "Lisinopril", dosage: "10mg", frequency: "Once daily" },
      {
        name: "Metformin",
        dosage: "500mg",
        frequency: "Twice daily with meals",
      },
      {
        name: "Amoxicillin",
        dosage: "500mg",
        frequency: "Every 8 hours for 10 days",
      },
      {
        name: "Atorvastatin",
        dosage: "20mg",
        frequency: "Once daily at bedtime",
      },
      {
        name: "Levothyroxine",
        dosage: "75mcg",
        frequency: "Once daily on empty stomach",
      },
      { name: "Amlodipine", dosage: "5mg", frequency: "Once daily" },
      {
        name: "Omeprazole",
        dosage: "20mg",
        frequency: "Once daily before breakfast",
      },
      { name: "Gabapentin", dosage: "300mg", frequency: "Three times daily" },
      {
        name: "Albuterol",
        dosage: "90mcg",
        frequency: "2 puffs every 4-6 hours as needed",
      },
      {
        name: "Prednisone",
        dosage: "10mg",
        frequency: "Once daily for 5 days",
      },
    ];

    // Create medications for approximately 70% of medical records
    for (const record of medicalRecords) {
      if (Math.random() < 0.7) {
        // Random medication
        const medication =
          medications[Math.floor(Math.random() * medications.length)];

        // Generate duration, quantity and refills
        const duration = `${Math.floor(Math.random() * 30) + 7} days`;
        const quantity = Math.floor(Math.random() * 90) + 30; // 30-120 units
        const refills = Math.floor(Math.random() * 3); // 0-2 refills

        try {
          db.prepare(
            `
            INSERT INTO medications (
              medicalRecordId, medicationId, name, dosage, 
              frequency, duration, quantity, refills, instructions
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `
          ).run(
            record.id,
            `med-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            medication.name,
            medication.dosage,
            medication.frequency,
            duration,
            quantity,
            refills,
            "Take as directed. Contact doctor if side effects occur."
          );
        } catch (error) {
          logger.error(
            `Error inserting medication for record ${record.id}:`,
            error
          );
        }
      }
    }

    logger.info("Medications seeded successfully");
  } catch (error) {
    logger.error("Error in medications seed:", error);
    throw error;
  }
};
