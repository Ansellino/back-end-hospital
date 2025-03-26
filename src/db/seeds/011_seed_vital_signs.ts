import db from "../../config/database";
import { logger } from "../../utils/logger";

interface MedicalRecord {
  id: number;
  patientId: number;
  doctorId: string;
}

export const seed = async () => {
  try {
    logger.info("Seeding vital signs...");

    // Check if vital_signs table exists
    const tableExists = db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='vital_signs'`
      )
      .get();

    if (!tableExists) {
      logger.warn(
        "Vital signs table doesn't exist, skipping vital signs seeding"
      );
      return;
    }

    // Get medical records
    const medicalRecords = db
      .prepare(`SELECT id, patientId, doctorId FROM medical_records`)
      .all() as MedicalRecord[];

    if (medicalRecords.length === 0) {
      logger.warn("No medical records found, skipping vital signs seeding");
      return;
    }

    // Generate vital signs for every medical record
    for (const record of medicalRecords) {
      try {
        // Generate realistic vital signs with some variation
        const temperature = (Math.random() * 1.5 + 36.2).toFixed(1); // 36.2-37.7°C
        const systolic = Math.floor(Math.random() * 40 + 110); // 110-150 mmHg
        const diastolic = Math.floor(Math.random() * 20 + 70); // 70-90 mmHg
        const heartRate = Math.floor(Math.random() * 40 + 60); // 60-100 bpm
        const respiratoryRate = Math.floor(Math.random() * 8 + 12); // 12-20 breaths/min
        const oxygenSaturation = (Math.random() * 4 + 96).toFixed(1); // 96-100%

        // Height and weight (with more variation)
        const height = (Math.random() * 0.5 + 1.5).toFixed(2); // 1.50-2.00m
        const weight = (Math.random() * 50 + 50).toFixed(1); // 50-100kg

        db.prepare(
          `
          INSERT INTO vital_signs (
            medicalRecordId, temperature, bloodPressureSystolic,
            bloodPressureDiastolic, heartRate, respiratoryRate,
            oxygenSaturation, height, weight
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
        ).run(
          record.id,
          temperature,
          systolic,
          diastolic,
          heartRate,
          respiratoryRate,
          oxygenSaturation,
          height,
          weight
        );
      } catch (error) {
        logger.error(
          `Error inserting vital signs for record ${record.id}:`,
          error
        );
      }
    }

    logger.info("Vital signs seeded successfully");
  } catch (error) {
    logger.error("Error in vital signs seed:", error);
    throw error;
  }
};
