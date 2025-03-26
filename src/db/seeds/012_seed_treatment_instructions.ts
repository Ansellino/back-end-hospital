import db from "../../config/database";
import { logger } from "../../utils/logger";

interface MedicalRecord {
  id: number;
  patientId: number;
  doctorId: string;
}

export const seed = async () => {
  try {
    logger.info("Seeding treatment instructions...");

    // Check if treatment_instructions table exists
    const tableExists = db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='treatment_instructions'`
      )
      .get();

    if (!tableExists) {
      logger.warn(
        "Treatment instructions table doesn't exist, skipping seeding"
      );
      return;
    }

    // Get medical records
    const medicalRecords = db
      .prepare(`SELECT id, patientId, doctorId FROM medical_records`)
      .all() as MedicalRecord[];

    if (medicalRecords.length === 0) {
      logger.warn(
        "No medical records found, skipping treatment instructions seeding"
      );
      return;
    }

    const instructionTemplates = [
      "Rest and drink plenty of fluids. Take medication as prescribed.",
      "Apply ice to affected area for 20 minutes every 2-3 hours. Elevate the injured limb above heart level.",
      "Take medication with food to avoid stomach upset. Complete full course of antibiotics.",
      "Monitor blood pressure daily and log readings. Follow low-sodium diet plan.",
      "Perform prescribed exercises twice daily. Gradually increase intensity as pain allows.",
      "Avoid strenuous activity for 2 weeks. Use assistive devices as recommended.",
      "Follow dietary restrictions provided. Schedule follow-up appointment in 3 weeks.",
      "Apply prescribed ointment to affected area twice daily. Keep area clean and dry.",
      "Use inhaler as directed before physical activity. Avoid known triggers.",
      "Take medication 30 minutes before meals. Report any severe side effects immediately.",
    ];

    // Add treatment instructions to each medical record
    for (const record of medicalRecords) {
      try {
        // Generate detailed instructions
        const baseInstruction =
          instructionTemplates[
            Math.floor(Math.random() * instructionTemplates.length)
          ];
        const additionalInstructions =
          Math.random() > 0.5
            ? "\n\nReturn to clinic if symptoms worsen or fail to improve within 48 hours."
            : "\n\nSchedule follow-up appointment in 2 weeks to assess progress.";

        const fullInstructions = baseInstruction + additionalInstructions;

        db.prepare(
          `
          INSERT INTO treatment_instructions (
            medicalRecordId, instructions
          ) VALUES (?, ?)
        `
        ).run(record.id, fullInstructions);
      } catch (error) {
        logger.error(
          `Error inserting treatment instructions for record ${record.id}:`,
          error
        );
      }
    }

    logger.info("Treatment instructions seeded successfully");
  } catch (error) {
    logger.error("Error in treatment instructions seed:", error);
    throw error;
  }
};
