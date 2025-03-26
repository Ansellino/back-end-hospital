import db from "../../config/database";
import { logger } from "../../utils/logger";

interface AppointmentRecord {
  id: number;
  patientId: number;
  doctorId: string;
  status: string;
  startTime: string;
}

export const seed = async () => {
  try {
    const now = new Date().toISOString();
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days in future
    logger.info("Seeding medical records...");

    // Check if medical_records table exists
    const tableExists = db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='medical_records'`
      )
      .get();

    if (!tableExists) {
      logger.warn(
        "Medical records table doesn't exist, skipping medical records seeding"
      );
      return;
    }

    // Get appointments to link medical records
    const appointments = db
      .prepare(
        `
        SELECT id, patientId, doctorId, status, startTime FROM appointments
        WHERE status = 'completed' OR status = 'scheduled'
      `
      )
      .all() as AppointmentRecord[];

    if (appointments.length === 0) {
      logger.warn("No appointments found, skipping medical records seeding");
      return;
    }

    const diagnoses = [
      "Hypertension",
      "Type 2 Diabetes",
      "Influenza",
      "Upper Respiratory Infection",
      "Migraine",
      "Gastroenteritis",
      "Anxiety Disorder",
      "Osteoarthritis",
      "Hyperlipidemia",
      "Asthma",
    ];

    const treatments = [
      "Prescribed medication regimen",
      "Lifestyle modifications recommended",
      "Physical therapy twice weekly",
      "Dietary changes and exercise",
      "Stress management techniques",
      "Antibiotics prescribed for 10 days",
      "Rest and increased fluid intake",
      "Referred to specialist for follow-up",
      "Monitoring of vital signs recommended",
      "Pain management protocol",
    ];

    // Create medical records for appointments
    for (const appointment of appointments) {
      try {
        // Generate random vitals
        const temperature = (Math.random() * 1.5 + 36.2).toFixed(1); // 36.2-37.7°C
        const heartRate = Math.floor(Math.random() * 40 + 60); // 60-100 bpm
        const respiratoryRate = Math.floor(Math.random() * 8 + 12); // 12-20 breaths/min
        const bloodPressureSystolic = Math.floor(Math.random() * 40 + 110); // 110-150 mmHg
        const bloodPressureDiastolic = Math.floor(Math.random() * 20 + 70); // 70-90 mmHg
        const oxygenSaturation = (Math.random() * 4 + 96).toFixed(1); // 96-100%
        const height = (Math.random() * 0.5 + 1.5).toFixed(2); // 1.50-2.00m
        const weight = (Math.random() * 50 + 50).toFixed(1); // 50-100kg

        // Get random diagnosis and treatment
        const diagnosis =
          diagnoses[Math.floor(Math.random() * diagnoses.length)];
        const treatment =
          treatments[Math.floor(Math.random() * treatments.length)];

        // 1. First insert the medical record
        const medicalRecordInfo = db
          .prepare(
            `
          INSERT INTO medical_records (
            patientId, doctorId, visitDate, visitId, chiefComplaint, 
            notes, followUpRecommended, followUpDate, createdAt, updatedAt
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
          )
          .run(
            appointment.patientId,
            appointment.doctorId,
            appointment.startTime,
            `VISIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            `Patient reported ${diagnosis} symptoms`,
            `${treatment}. Patient advised to follow instructions.`,
            Math.random() > 0.5 ? 1 : 0, // 50% follow-up chance
            Math.random() > 0.5 ? futureDate.toISOString() : null,
            now,
            now
          );

        const medicalRecordId = medicalRecordInfo.lastInsertRowid as number;

        // 2. Insert vital signs linked to the medical record
        db.prepare(
          `
          INSERT INTO vital_signs (
            medicalRecordId, temperature, bloodPressureSystolic,
            bloodPressureDiastolic, heartRate, respiratoryRate,
            oxygenSaturation, height, weight
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
        ).run(
          medicalRecordId,
          temperature,
          bloodPressureSystolic,
          bloodPressureDiastolic,
          heartRate,
          respiratoryRate,
          oxygenSaturation,
          height,
          weight
        );

        // 3. Insert diagnosis linked to the medical record
        db.prepare(
          `
          INSERT INTO diagnoses (
            medicalRecordId, code, description, type, notes
          )
          VALUES (?, ?, ?, ?, ?)
        `
        ).run(
          medicalRecordId,
          `ICD-${Math.floor(Math.random() * 90) + 10}`,
          diagnosis,
          Math.random() > 0.5 ? "primary" : "secondary",
          `Notes regarding ${diagnosis}`
        );

        // 4. Insert treatment instructions
        db.prepare(
          `
          INSERT INTO treatment_instructions (
            medicalRecordId, instructions
          )
          VALUES (?, ?)
        `
        ).run(medicalRecordId, treatment);
      } catch (error) {
        logger.error(
          `Error inserting medical record for appointment ${appointment.id}:`,
          error
        );
      }
    }

    logger.info("Medical records seeded successfully");
  } catch (error) {
    logger.error("Error in medical records seed:", error);
    throw error;
  }
};
