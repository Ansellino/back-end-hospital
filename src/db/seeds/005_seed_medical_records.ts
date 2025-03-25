import db from "../../config/database";
import { logger } from "../../utils/logger";

interface AppointmentRecord {
  id: number;
  patientId: number;
  doctorId: string;
  status: string;
}

export const seed = async () => {
  try {
    const now = new Date().toISOString();
    logger.info("Seeding medical records...");

    // Check if medical_records table exists
    const tableExists = db
      .prepare(
        `
      SELECT name FROM sqlite_master WHERE type='table' AND name='medical_records'
    `
      )
      .get();

    if (!tableExists) {
      logger.warn(
        "Medical records table doesn't exist, skipping medical records seeding"
      );
      return;
    }

    // Get completed appointments to link medical records
    const appointments = db
      .prepare(
        `
      SELECT id, patientId, doctorId, status FROM appointments
      WHERE status = 'completed' OR status = 'scheduled'
    `
      )
      .all() as AppointmentRecord[];

    if (appointments.length === 0) {
      logger.warn(
        "No completed appointments found, skipping medical records seeding"
      );
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

    // Create medical records for completed appointments
    for (const appointment of appointments) {
      if (appointment.status === "completed") {
        // Generate random vitals
        const temperature = (Math.random() * 3 + 97).toFixed(1); // 97-100
        const heartRate = Math.floor(Math.random() * 40 + 60); // 60-100
        const respiratoryRate = Math.floor(Math.random() * 8 + 12); // 12-20
        const bloodPressureSystolic = Math.floor(Math.random() * 40 + 110); // 110-150
        const bloodPressureDiastolic = Math.floor(Math.random() * 25 + 60); // 60-85

        const vitals = JSON.stringify({
          temperature: `${temperature}°F`,
          heartRate: `${heartRate} bpm`,
          respiratoryRate: `${respiratoryRate} breaths/min`,
          bloodPressure: `${bloodPressureSystolic}/${bloodPressureDiastolic} mmHg`,
          oxygenSaturation: `${Math.floor(Math.random() * 4 + 96)}%`, // 96-99%
        });

        // Get random diagnosis and treatment
        const diagnosis =
          diagnoses[Math.floor(Math.random() * diagnoses.length)];
        const treatment =
          treatments[Math.floor(Math.random() * treatments.length)];

        try {
          db.prepare(
            `
            INSERT INTO medical_records (patientId, doctorId, appointmentId, diagnosis, treatment, notes, vitals, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `
          ).run(
            appointment.patientId,
            appointment.doctorId,
            appointment.id,
            diagnosis,
            treatment,
            `Patient visit for ${diagnosis}. Treatment plan established.`,
            vitals,
            now,
            now
          );
        } catch (error) {
          logger.error(
            `Error inserting medical record for appointment ${appointment.id}:`,
            error
          );

          // Try alternative schema in case the structure is different
          try {
            db.prepare(
              `
              INSERT INTO medical_records (patientId, doctorId, visitDate, chiefComplaint, diagnosis, notes, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `
            ).run(
              appointment.patientId,
              appointment.doctorId,
              now,
              diagnosis,
              diagnosis,
              `Patient visit for ${diagnosis}. ${treatment}`,
              now,
              now
            );
            logger.info("Used alternative schema for medical record insertion");
          } catch (altError) {
            logger.error("Alternative insert also failed:", altError);
          }
        }

        // Create vital signs records
        try {
          db.prepare(
            `
            INSERT INTO vital_signs (patientId, appointmentId, temperature, heartRate, bloodPressure, respiratoryRate, oxygenSaturation, recordedAt, notes, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `
          ).run(
            appointment.patientId,
            appointment.id,
            `${temperature}°F`,
            `${heartRate} bpm`,
            `${bloodPressureSystolic}/${bloodPressureDiastolic} mmHg`,
            `${respiratoryRate} breaths/min`,
            `${Math.floor(Math.random() * 4 + 96)}%`,
            now,
            "Recorded during regular checkup",
            now,
            now
          );
        } catch (error) {
          logger.error(
            `Error inserting vital signs for appointment ${appointment.id}:`,
            error
          );
        }

        // Create diagnoses records
        try {
          db.prepare(
            `
            INSERT INTO diagnoses (patientId, appointmentId, doctorId, diagnosisCode, description, diagnosisDate, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `
          ).run(
            appointment.patientId,
            appointment.id,
            appointment.doctorId,
            `ICD-${Math.floor(Math.random() * 90) + 10}`,
            diagnosis,
            now,
            now,
            now
          );
        } catch (error) {
          logger.error(
            `Error inserting diagnosis for appointment ${appointment.id}:`,
            error
          );
        }
      }
    }

    logger.info("Medical records seeded successfully");
  } catch (error) {
    logger.error("Error in medical records seed:", error);
    throw error;
  }
};
