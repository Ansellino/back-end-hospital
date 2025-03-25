import db from "../../config/database";
import { logger } from "../../utils/logger";

// Define interface for database row ID result
interface RowIdResult {
  id: number;
}

export const seed = async () => {
  try {
    const now = new Date().toISOString();
    logger.info("Seeding procedures...");

    // Check if procedures table exists
    const tableExists = db
      .prepare(
        `
      SELECT name FROM sqlite_master WHERE type='table' AND name='procedures'
    `
      )
      .get();

    if (!tableExists) {
      logger.warn(
        "Procedures table doesn't exist, skipping procedures seeding"
      );
      return;
    }

    // Get completed appointments to link procedures
    const appointments = db
      .prepare(
        `
      SELECT id, patientId, doctorId FROM appointments
      WHERE status = 'completed'
    `
      )
      .all() as { id: number; patientId: number; doctorId: string }[];

    if (appointments.length === 0) {
      logger.warn(
        "No completed appointments found, skipping procedures seeding"
      );
      return;
    }

    const procedures = [
      {
        name: "Blood Draw",
        code: "36415",
        description: "Routine venipuncture for lab tests",
      },
      {
        name: "ECG",
        code: "93000",
        description: "Electrocardiogram with interpretation",
      },
      { name: "X-Ray", code: "71045", description: "Chest X-ray, single view" },
      {
        name: "Spirometry",
        code: "94010",
        description: "Pulmonary function test",
      },
      {
        name: "Vaccination",
        code: "90471",
        description: "Immunization administration",
      },
      {
        name: "Wound Care",
        code: "97597",
        description: "Debridement and cleaning of wound",
      },
      {
        name: "IV Therapy",
        code: "96365",
        description: "Intravenous infusion therapy",
      },
      {
        name: "Suture Removal",
        code: "15850",
        description: "Removal of stitches",
      },
    ];

    // Create procedures for 40% of completed appointments
    for (const appointment of appointments) {
      if (Math.random() < 0.4) {
        // Random procedure
        const procedure =
          procedures[Math.floor(Math.random() * procedures.length)];

        // Procedure date (same day as appointment)
        const procedureDate = new Date();
        procedureDate.setDate(
          procedureDate.getDate() - Math.floor(Math.random() * 30)
        ); // 0-30 days ago

        try {
          db.prepare(
            `
            INSERT INTO procedures (patientId, appointmentId, doctorId, name, procedureCode, description, procedureDate, notes, status, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `
          ).run(
            appointment.patientId,
            appointment.id,
            appointment.doctorId,
            procedure.name,
            procedure.code,
            procedure.description,
            procedureDate.toISOString(),
            "Procedure performed during appointment. No complications noted.",
            Math.random() < 0.9 ? "completed" : "scheduled",
            now,
            now
          );

          // Also create treatment instructions for this procedure (if table exists)
          try {
            const treatmentTableExists = db
              .prepare(
                `
              SELECT name FROM sqlite_master WHERE type='table' AND name='treatment_instructions'
            `
              )
              .get();

            if (treatmentTableExists) {
              // Get the last inserted row ID with proper type
              const procedureId = db
                .prepare("SELECT last_insert_rowid() as id")
                .get() as RowIdResult;

              db.prepare(
                `
                INSERT INTO treatment_instructions (patientId, procedureId, instructions, followUp, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?)
              `
              ).run(
                appointment.patientId,
                procedureId.id,
                `Follow these steps after your ${procedure.name}:\n1. Rest for 24 hours\n2. Keep the area clean\n3. Call if any concerns arise`,
                Math.random() < 0.5
                  ? "Follow up in 2 weeks"
                  : "No follow-up needed",
                now,
                now
              );
            }
          } catch (instructionsError) {
            logger.error(
              "Error creating treatment instructions:",
              instructionsError
            );
          }
        } catch (error) {
          logger.error(
            `Error inserting procedure for appointment ${appointment.id}:`,
            error
          );
        }
      }
    }

    logger.info("Procedures seeded successfully");
  } catch (error) {
    logger.error("Error in procedures seed:", error);
    throw error;
  }
};
