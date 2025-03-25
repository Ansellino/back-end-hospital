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
    logger.info("Seeding prescriptions...");

    // Check if prescriptions table exists
    const tableExists = db
      .prepare(
        `
      SELECT name FROM sqlite_master WHERE type='table' AND name='prescriptions'
    `
      )
      .get();

    if (!tableExists) {
      logger.warn(
        "Prescriptions table doesn't exist, skipping prescriptions seeding"
      );
      return;
    }

    // Get medical records to link prescriptions
    const medicalRecords = db
      .prepare(
        `
      SELECT id, patientId, doctorId FROM medical_records
    `
      )
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
      // Random number of medications (1-3) per record
      const medCount = Math.floor(Math.random() * 3) + 1;

      for (let i = 0; i < medCount; i++) {
        const medication =
          medications[Math.floor(Math.random() * medications.length)];

        // Random duration (1-12 months)
        const duration = `${Math.floor(Math.random() * 12) + 1} ${
          Math.random() < 0.7 ? "months" : "weeks"
        }`;

        // Random refills (0-3)
        const refills = Math.floor(Math.random() * 4);

        // Random status
        const status =
          Math.random() < 0.2
            ? "pending"
            : Math.random() < 0.8
            ? "active"
            : "completed";

        try {
          db.prepare(
            `
            INSERT INTO prescriptions (medicalRecordId, patientId, doctorId, medication, dosage, frequency, duration, refills, instructions, status, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `
          ).run(
            record.id,
            record.patientId,
            record.doctorId,
            medication.name,
            medication.dosage,
            medication.frequency,
            duration,
            refills,
            "Take as directed. Contact physician with any concerns or side effects.",
            status,
            now,
            now
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
