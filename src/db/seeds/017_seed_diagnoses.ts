import db from "../../config/database";
import { logger } from "../../utils/logger";

interface MedicalRecord {
  id: number;
  patientId: number;
  doctorId: string;
}

export const seed = async () => {
  try {
    logger.info("Seeding diagnoses...");

    // Check if diagnoses table exists
    const tableExists = db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='diagnoses'`
      )
      .get();

    if (!tableExists) {
      logger.warn("Diagnoses table doesn't exist, skipping diagnoses seeding");
      return;
    }

    // Get medical records
    const medicalRecords = db
      .prepare(`SELECT id, patientId, doctorId FROM medical_records`)
      .all() as MedicalRecord[];

    if (medicalRecords.length === 0) {
      logger.warn("No medical records found, skipping diagnoses seeding");
      return;
    }

    const diagnoses = [
      {
        code: "J06.9",
        description: "Acute upper respiratory infection",
        type: "primary",
        notes: "Viral origin suspected",
      },
      {
        code: "I10",
        description: "Essential hypertension",
        type: "secondary",
        notes: "Well-controlled with medication",
      },
      {
        code: "E11.9",
        description: "Type 2 diabetes mellitus",
        type: "secondary",
        notes: "Without complications",
      },
      {
        code: "M54.5",
        description: "Low back pain",
        type: "primary",
        notes: "Mechanical in nature",
      },
      {
        code: "J45.909",
        description: "Unspecified asthma",
        type: "secondary",
        notes: "Mild intermittent",
      },
      {
        code: "K21.9",
        description: "Gastroesophageal reflux disease",
        type: "secondary",
        notes: "Without esophagitis",
      },
      {
        code: "F41.1",
        description: "Generalized anxiety disorder",
        type: "primary",
        notes: "Moderate severity",
      },
      {
        code: "J02.9",
        description: "Acute pharyngitis",
        type: "primary",
        notes: "Likely viral",
      },
      {
        code: "M25.562",
        description: "Pain in knee",
        type: "primary",
        notes: "Left knee, osteoarthritis suspected",
      },
      {
        code: "N39.0",
        description: "Urinary tract infection",
        type: "primary",
        notes: "Uncomplicated",
      },
    ];

    // Every medical record should have at least one diagnosis
    for (const record of medicalRecords) {
      try {
        // Random number of diagnoses (1-3) per record
        const diagCount = Math.floor(Math.random() * 3) + 1;

        // Select random diagnoses without duplicates
        const selectedDiagIndices = new Set<number>();
        while (selectedDiagIndices.size < diagCount) {
          selectedDiagIndices.add(Math.floor(Math.random() * diagnoses.length));
        }

        // Insert each selected diagnosis
        for (const diagIndex of selectedDiagIndices) {
          const diagnosis = diagnoses[diagIndex];

          db.prepare(
            `
            INSERT INTO diagnoses (
              medicalRecordId, code, description, type, notes
            ) VALUES (?, ?, ?, ?, ?)
          `
          ).run(
            record.id,
            diagnosis.code,
            diagnosis.description,
            diagnosis.type,
            diagnosis.notes
          );
        }
      } catch (error) {
        logger.error(
          `Error inserting diagnosis for record ${record.id}:`,
          error
        );
      }
    }

    logger.info("Diagnoses seeded successfully");
  } catch (error) {
    logger.error("Error in diagnoses seed:", error);
    throw error;
  }
};
