import db from "../../config/database";
import { logger } from "../../utils/logger";

export const seed = async () => {
  try {
    const now = new Date().toISOString();

    logger.info("Seeding appointments...");

    // Insert basic appointment example
    const appointmentDate = new Date();
    appointmentDate.setDate(appointmentDate.getDate() + 3); // 3 days from now
    const startTime = appointmentDate.toISOString();
    appointmentDate.setHours(appointmentDate.getHours() + 1);
    const endTime = appointmentDate.toISOString();

    db.prepare(
      `
      INSERT INTO appointments (patientId, doctorId, title, startTime, endTime, status, type, notes, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      1,
      "STAFF-001",
      "Follow-up Appointment",
      startTime,
      endTime,
      "scheduled",
      "follow-up",
      "Regular checkup after medication change",
      now,
      now
    );

    // Create more appointments with different staff and patients
    const appointmentTypes = [
      "initial",
      "follow-up",
      "consultation",
      "procedure",
      "emergency",
    ];
    const appointmentTitles = [
      "Annual Physical",
      "Consultation",
      "Follow-up Visit",
      "Lab Results Review",
      "Prescription Refill",
      "Procedure",
    ];
    const appointmentStatuses = [
      "scheduled",
      "completed",
      "cancelled",
      "no-show",
    ];

    // Get all patients and doctors
    const patients = db.prepare("SELECT id FROM patients").all() as {
      id: number;
    }[];
    const doctors = db
      .prepare("SELECT id FROM staff WHERE role = 'doctor'")
      .all() as { id: string }[];

    if (patients.length === 0 || doctors.length === 0) {
      logger.warn(
        "No patients or doctors found, skipping additional appointments"
      );
      return;
    }

    // Create 10 random appointments
    for (let i = 0; i < 10; i++) {
      const patient = patients[Math.floor(Math.random() * patients.length)];
      const doctor = doctors[Math.floor(Math.random() * doctors.length)];
      const type =
        appointmentTypes[Math.floor(Math.random() * appointmentTypes.length)];
      const title =
        appointmentTitles[Math.floor(Math.random() * appointmentTitles.length)];
      const status =
        appointmentStatuses[
          Math.floor(Math.random() * appointmentStatuses.length)
        ];

      // Random appointment date (-7 to +30 days from now)
      const apptDate = new Date();
      apptDate.setDate(apptDate.getDate() + Math.floor(Math.random() * 38) - 7);

      // Set time between 8AM and 5PM
      apptDate.setHours(8 + Math.floor(Math.random() * 9), 0, 0, 0);

      const apptStart = new Date(apptDate);
      const apptEnd = new Date(apptDate);
      apptEnd.setMinutes(
        apptEnd.getMinutes() + (Math.floor(Math.random() * 3) + 1) * 30
      ); // 30, 60, or 90 min

      db.prepare(
        `
        INSERT INTO appointments (patientId, doctorId, title, startTime, endTime, status, type, notes, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      ).run(
        patient.id,
        doctor.id,
        title,
        apptStart.toISOString(),
        apptEnd.toISOString(),
        status,
        type,
        `Notes for ${title.toLowerCase()} appointment`,
        now,
        now
      );
    }

    logger.info("Appointments seeded successfully");
  } catch (error) {
    logger.error("Error seeding appointments:", error);
    throw error;
  }
};
