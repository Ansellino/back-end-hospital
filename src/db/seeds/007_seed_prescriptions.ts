import db from "../../config/database";
import { logger } from "../../utils/logger";

interface MedicalRecord {
  id: number;
  patientId: number;
  doctorId: string;
}

// Add this interface to define the query result shape
interface CountResult {
  count: number;
}

export const seed = async () => {
  try {
    const now = new Date().toISOString();
    logger.info("Seeding medications as prescriptions...");

    // Check if medications table exists (we'll use this for prescriptions)
    const tableExists = db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='medications'`
      )
      .get();

    if (!tableExists) {
      logger.warn(
        "Medications table doesn't exist, skipping prescriptions seeding"
      );
      return;
    }

    // Get medical records to link prescriptions
    const medicalRecords = db
      .prepare(`SELECT id, patientId, doctorId FROM medical_records`)
      .all() as MedicalRecord[];

    if (medicalRecords.length === 0) {
      logger.warn("No medical records found, skipping prescriptions seeding");
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

    // Add prescriptions for each medical record
    for (const record of medicalRecords) {
      // Fix the type issue by adding an explicit type cast
      const existingMedications = db
        .prepare(
          `SELECT COUNT(*) as count FROM medications WHERE medicalRecordId = ?`
        )
        .get(record.id) as CountResult;

      if (existingMedications.count > 0) {
        logger.info(`Skipping record ${record.id}, medications already exist`);
        continue;
      }

      // Random number of medications (1-3) per record
      const medCount = Math.floor(Math.random() * 3) + 1;

      for (let i = 0; i < medCount; i++) {
        const medication =
          medications[Math.floor(Math.random() * medications.length)];

        // Generate durations and quantities that make sense
        const duration =
          Math.floor(Math.random() * 12) +
          1 +
          " " +
          (Math.random() < 0.7 ? "weeks" : "months");
        const quantity = Math.floor(Math.random() * 90) + 30; // 30-120 units
        const refills = Math.floor(Math.random() * 4); // 0-3 refills

        // Generate reasonable instructions
        const instructions =
          "Take as directed. " +
          (Math.random() < 0.5 ? "Take with food. " : "") +
          (Math.random() < 0.3 ? "Avoid alcohol. " : "") +
          "Contact physician with any concerns.";

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
            `med-${Date.now()}-${i}`,
            medication.name,
            medication.dosage,
            medication.frequency,
            duration,
            quantity,
            refills,
            instructions
          );
        } catch (error) {
          logger.error(
            `Error inserting prescription for record ${record.id}:`,
            error
          );
        }
      }
    }

    logger.info("Prescriptions seeded successfully");
  } catch (error) {
    logger.error("Error in prescriptions seed:", error);
    throw error;
  }
};
