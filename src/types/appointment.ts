import db from "../config/database";

// Appointment status options
export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no-show";

// Appointment type options
export type AppointmentType =
  | "initial-consultation"
  | "follow-up"
  | "procedure"
  | "checkup"
  | "urgent"
  | "telehealth"
  | "other";

// Base Appointment interface
export interface Appointment {
  id?: number;
  patientId: number;
  doctorId: number;
  title: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  type: AppointmentType;
  notes?: string;
  location?: string;
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Extended interface with patient and doctor names for UI display
export interface AppointmentWithNames extends Appointment {
  patientName?: string;
  doctorName?: string;
  patientPhone?: string;
  doctorSpecialty?: string;
}

// Create appointments table if it doesn't exist
export const initTable = async (): Promise<void> => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patientId INTEGER NOT NULL,
      doctorId INTEGER NOT NULL,
      title TEXT NOT NULL,
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      status TEXT NOT NULL,
      type TEXT NOT NULL,
      notes TEXT,
      location TEXT,
      reason TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (patientId) REFERENCES patients (id) ON DELETE CASCADE,
      FOREIGN KEY (doctorId) REFERENCES users (id) ON DELETE CASCADE
    )
  `);
  console.log("Appointments table initialized");
};

export default {
  initTable,
};
