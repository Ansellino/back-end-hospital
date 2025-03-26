import db from "../../config/database";
import { logger } from "../../utils/logger";

interface MedicalRecord {
  id: number;
  patientId: number;
  doctorId: string;
}

export const seed = async () => {
  try {
    logger.info("Seeding procedures...");

    // Check if procedures table exists
    const tableExists = db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='procedures'`
      )
      .get();

    if (!tableExists) {
      logger.warn(
        "Procedures table doesn't exist, skipping procedures seeding"
      );
      return;
    }

    // Get medical records
    const medicalRecords = db
      .prepare(`SELECT id, patientId, doctorId FROM medical_records`)
      .all() as MedicalRecord[];

    if (medicalRecords.length === 0) {
      logger.warn("No medical records found, skipping procedures seeding");
      return;
    }

    const procedures = [
      {
        code: "99213",
        name: "Office visit, established patient",
        notes: "Routine follow-up",
      },
      {
        code: "99204",
        name: "Office visit, new patient, comprehensive",
        notes: "Initial evaluation",
      },
      {
        code: "93000",
        name: "Electrocardiogram (ECG)",
        notes: "Normal sinus rhythm",
      },
      {
        code: "85025",
        name: "Complete blood count (CBC)",
        notes: "Within normal limits",
      },
      {
        code: "80053",
        name: "Comprehensive metabolic panel",
        notes: "Slightly elevated glucose",
      },
      {
        code: "82947",
        name: "Glucose, quantitative, blood",
        notes: "Blood sugar monitoring",
      },
      {
        code: "71045",
        name: "Chest X-ray",
        notes: "No abnormalities detected",
      },
      {
        code: "29125",
        name: "Application of short arm splint",
        notes: "For wrist stabilization",
      },
      {
        code: "12001",
        name: "Simple suture, 2.5cm",
        notes: "Laceration repair, healing well",
      },
      {
        code: "99397",
        name: "Preventive visit, established patient",
        notes: "Annual wellness check",
      },
    ];

    // Add procedures to approximately 60% of medical records
    for (const record of medicalRecords) {
      if (Math.random() < 0.6) {
        // Random number of procedures (1-2) per record
        const procCount = Math.floor(Math.random() * 2) + 1;

        // Select random procedures without duplicates
        const selectedProcIndices = new Set<number>();
        while (selectedProcIndices.size < procCount) {
          selectedProcIndices.add(
            Math.floor(Math.random() * procedures.length)
          );
        }

        // Insert each selected procedure
        for (const procIndex of selectedProcIndices) {
          const procedure = procedures[procIndex];

          try {
            db.prepare(
              `
              INSERT INTO procedures (
                medicalRecordId, code, name, notes
              ) VALUES (?, ?, ?, ?)
            `
            ).run(record.id, procedure.code, procedure.name, procedure.notes);
          } catch (error) {
            logger.error(
              `Error inserting procedure for record ${record.id}:`,
              error
            );
          }
        }
      }
    }

    logger.info("Procedures seeded successfully");
  } catch (error) {
    logger.error("Error in procedures seed:", error);
    throw error;
  }
};
