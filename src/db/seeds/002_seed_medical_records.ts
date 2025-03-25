import db from "../../config/database";
import { logger } from "../../utils/logger";

// Define an interface for the appointment structure
interface AppointmentRecord {
  id: number;
  patientId: number;
  doctorId: string; // Assuming doctorId is a string like "STAFF-001"
}

export const seed = async () => {
  const now = new Date().toISOString();

  // Get all existing appointments to link medical records
  const appointments = db
    .prepare(
      `
    SELECT id, patientId, doctorId FROM appointments
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

  // Add at least one medical record for the first appointment
  db.prepare(
    `
    INSERT INTO medical_records (patientId, doctorId, appointmentId, diagnosis, treatment, notes, vitals, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    appointments[0].patientId,
    appointments[0].doctorId,
    appointments[0].id,
    "Hypertension",
    "Prescribed Lisinopril 10mg daily",
    "Patient presented with elevated blood pressure. Recommended lifestyle changes and medication.",
    JSON.stringify({
      temperature: "98.6°F",
      heartRate: "88 bpm",
      respiratoryRate: "16 breaths/min",
      bloodPressure: "140/90 mmHg",
      oxygenSaturation: "98%",
    }),
    now,
    now
  );

  // Seed additional random medical records
  for (let i = 0; i < Math.min(appointments.length, 5); i++) {
    const appointment = appointments[i];

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
    const diagnosis = diagnoses[Math.floor(Math.random() * diagnoses.length)];
    const treatment = treatments[Math.floor(Math.random() * treatments.length)];

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
  }

  logger.info("Medical records seeded successfully");
};
