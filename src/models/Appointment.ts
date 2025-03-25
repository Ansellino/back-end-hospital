import db from "../config/database";
import { logger } from "../utils/logger";
import {
  Appointment,
  AppointmentWithNames,
  AppointmentStatus,
  AppointmentType,
} from "../types/appointment";

/**
 * Initialize appointments table
 */
export const createAppointmentsTable = async (): Promise<void> => {
  try {
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
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (patientId) REFERENCES patients (id) ON DELETE CASCADE,
        FOREIGN KEY (doctorId) REFERENCES staff (id) ON DELETE CASCADE
      )
    `);
    logger.info("Appointments table initialized");
  } catch (error) {
    logger.error("Error initializing appointments table:", error);
    throw new Error("Failed to initialize appointments table");
  }
};

/**
 * Get all appointments
 */
export const getAllAppointments = async (): Promise<AppointmentWithNames[]> => {
  try {
    const query = `
      SELECT 
        a.*,
        p.firstName || ' ' || p.lastName as patientName,
        p.contactNumber as patientPhone,
        s.firstName || ' ' || s.lastName as doctorName,
        s.specialization as doctorSpecialty
      FROM appointments a
      LEFT JOIN patients p ON a.patientId = p.id
      LEFT JOIN staff s ON a.doctorId = s.id
      ORDER BY a.startTime DESC
    `;

    const appointments = db.prepare(query).all() as AppointmentWithNames[];
    return appointments;
  } catch (error) {
    logger.error("Error getting all appointments:", error);
    return [];
  }
};

/**
 * Get appointments within a date range
 */
export const getAppointmentsByDateRange = async (
  startDate: string,
  endDate: string
): Promise<AppointmentWithNames[]> => {
  try {
    const query = `
      SELECT 
        a.*,
        p.firstName || ' ' || p.lastName as patientName,
        p.contactNumber as patientPhone,
        s.firstName || ' ' || s.lastName as doctorName,
        s.specialization as doctorSpecialty
      FROM appointments a
      LEFT JOIN patients p ON a.patientId = p.id
      LEFT JOIN staff s ON a.doctorId = s.id
      WHERE date(a.startTime) >= date(?) AND date(a.startTime) <= date(?)
      ORDER BY a.startTime
    `;

    const appointments = db
      .prepare(query)
      .all(startDate, endDate) as AppointmentWithNames[];
    return appointments;
  } catch (error) {
    logger.error(
      `Error getting appointments between ${startDate} and ${endDate}:`,
      error
    );
    return [];
  }
};

/**
 * Get an appointment by ID
 */
export const getAppointmentById = async (
  id: number
): Promise<AppointmentWithNames | null> => {
  try {
    const query = `
      SELECT 
        a.*,
        p.firstName || ' ' || p.lastName as patientName,
        p.contactNumber as patientPhone,
        s.firstName || ' ' || s.lastName as doctorName,
        s.specialization as doctorSpecialty
      FROM appointments a
      LEFT JOIN patients p ON a.patientId = p.id
      LEFT JOIN staff s ON a.doctorId = s.id
      WHERE a.id = ?
    `;

    const appointment = db.prepare(query).get(id) as AppointmentWithNames;
    return appointment || null;
  } catch (error) {
    logger.error(`Error getting appointment with id ${id}:`, error);
    return null;
  }
};

/**
 * Get appointments by patient ID
 */
export const getAppointmentsByPatientId = async (
  patientId: number
): Promise<AppointmentWithNames[]> => {
  try {
    const query = `
      SELECT 
        a.*,
        p.firstName || ' ' || p.lastName as patientName,
        p.contactNumber as patientPhone,
        s.firstName || ' ' || s.lastName as doctorName,
        s.specialization as doctorSpecialty
      FROM appointments a
      LEFT JOIN patients p ON a.patientId = p.id
      LEFT JOIN staff s ON a.doctorId = s.id
      WHERE a.patientId = ?
      ORDER BY a.startTime DESC
    `;

    const appointments = db
      .prepare(query)
      .all(patientId) as AppointmentWithNames[];
    return appointments;
  } catch (error) {
    logger.error(`Error getting appointments for patient ${patientId}:`, error);
    return [];
  }
};

/**
 * Get appointments by doctor ID
 */
export const getAppointmentsByDoctorId = async (
  doctorId: number
): Promise<AppointmentWithNames[]> => {
  try {
    const query = `
      SELECT 
        a.*,
        p.firstName || ' ' || p.lastName as patientName,
        p.contactNumber as patientPhone,
        s.firstName || ' ' || s.lastName as doctorName,
        s.specialization as doctorSpecialty
      FROM appointments a
      LEFT JOIN patients p ON a.patientId = p.id
      LEFT JOIN staff s ON a.doctorId = s.id
      WHERE a.doctorId = ?
      ORDER BY a.startTime DESC
    `;

    const appointments = db
      .prepare(query)
      .all(doctorId) as AppointmentWithNames[];
    return appointments;
  } catch (error) {
    logger.error(`Error getting appointments for doctor ${doctorId}:`, error);
    return [];
  }
};

/**
 * Create a new appointment
 */
export const createAppointment = async (
  appointmentData: Omit<Appointment, "id" | "createdAt" | "updatedAt">
): Promise<Appointment | null> => {
  try {
    const now = new Date().toISOString();

    const result = db
      .prepare(
        `
        INSERT INTO appointments (
          patientId, doctorId, title, startTime, endTime, 
          status, type, notes, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
      .run(
        appointmentData.patientId,
        appointmentData.doctorId,
        appointmentData.title,
        appointmentData.startTime,
        appointmentData.endTime,
        appointmentData.status,
        appointmentData.type,
        appointmentData.notes || null,
        now,
        now
      );

    if (result.lastInsertRowid) {
      return getAppointmentById(result.lastInsertRowid as number);
    }
    return null;
  } catch (error) {
    logger.error("Error creating appointment:", error);
    return null;
  }
};

/**
 * Update an existing appointment
 */
export const updateAppointment = async (
  id: number,
  appointmentData: Partial<Omit<Appointment, "id" | "createdAt" | "updatedAt">>
): Promise<Appointment | null> => {
  try {
    const appointment = await getAppointmentById(id);
    if (!appointment) {
      return null;
    }

    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: any[] = [];

    if (appointmentData.patientId !== undefined) {
      updates.push("patientId = ?");
      values.push(appointmentData.patientId);
    }

    if (appointmentData.doctorId !== undefined) {
      updates.push("doctorId = ?");
      values.push(appointmentData.doctorId);
    }

    if (appointmentData.title !== undefined) {
      updates.push("title = ?");
      values.push(appointmentData.title);
    }

    if (appointmentData.startTime !== undefined) {
      updates.push("startTime = ?");
      values.push(appointmentData.startTime);
    }

    if (appointmentData.endTime !== undefined) {
      updates.push("endTime = ?");
      values.push(appointmentData.endTime);
    }

    if (appointmentData.status !== undefined) {
      updates.push("status = ?");
      values.push(appointmentData.status);
    }

    if (appointmentData.type !== undefined) {
      updates.push("type = ?");
      values.push(appointmentData.type);
    }

    if (appointmentData.notes !== undefined) {
      updates.push("notes = ?");
      values.push(appointmentData.notes);
    }

    // Always update the updatedAt timestamp
    updates.push("updatedAt = ?");
    values.push(now);

    // Add the ID for the WHERE clause
    values.push(id);

    const query = `
      UPDATE appointments 
      SET ${updates.join(", ")} 
      WHERE id = ?
    `;

    db.prepare(query).run(...values);

    return getAppointmentById(id);
  } catch (error) {
    logger.error(`Error updating appointment ${id}:`, error);
    return null;
  }
};

/**
 * Delete an appointment
 */
export const deleteAppointment = async (id: number): Promise<boolean> => {
  try {
    const result = db.prepare("DELETE FROM appointments WHERE id = ?").run(id);
    return result.changes > 0;
  } catch (error) {
    logger.error(`Error deleting appointment ${id}:`, error);
    return false;
  }
};

/**
 * Search appointments
 */
export const searchAppointments = async (
  searchTerm: string
): Promise<AppointmentWithNames[]> => {
  try {
    const query = `
      SELECT 
        a.*,
        p.firstName || ' ' || p.lastName as patientName,
        p.contactNumber as patientPhone,
        s.firstName || ' ' || s.lastName as doctorName,
        s.specialization as doctorSpecialty
      FROM appointments a
      LEFT JOIN patients p ON a.patientId = p.id
      LEFT JOIN staff s ON a.doctorId = s.id
      WHERE 
        a.title LIKE ? OR
        a.notes LIKE ? OR
        p.firstName LIKE ? OR
        p.lastName LIKE ? OR
        s.firstName LIKE ? OR
        s.lastName LIKE ?
      ORDER BY a.startTime DESC
    `;

    const searchPattern = `%${searchTerm}%`;
    const appointments = db
      .prepare(query)
      .all(
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern
      ) as AppointmentWithNames[];

    return appointments;
  } catch (error) {
    logger.error(
      `Error searching appointments with term '${searchTerm}':`,
      error
    );
    return [];
  }
};

/**
 * Check for appointment conflicts
 */
export const checkAppointmentConflicts = async (
  doctorId: number,
  startTime: string,
  endTime: string,
  excludeAppointmentId?: number
): Promise<boolean> => {
  try {
    let query = `
      SELECT COUNT(*) as count
      FROM appointments
      WHERE 
        doctorId = ? AND 
        ((startTime <= ? AND endTime > ?) OR 
         (startTime < ? AND endTime >= ?) OR
         (startTime >= ? AND endTime <= ?))
    `;

    const params = [
      doctorId,
      endTime,
      startTime,
      endTime,
      startTime,
      startTime,
      endTime,
    ];

    if (excludeAppointmentId) {
      query += " AND id != ?";
      params.push(excludeAppointmentId);
    }

    const result = db.prepare(query).get(...params) as { count: number };
    return result.count > 0;
  } catch (error) {
    logger.error(
      `Error checking appointment conflicts for doctor ${doctorId}:`,
      error
    );
    return false;
  }
};

/**
 * Get upcoming appointments
 */
export const getUpcomingAppointments = async (
  limit: number = 10
): Promise<AppointmentWithNames[]> => {
  try {
    const now = new Date().toISOString();
    const query = `
      SELECT 
        a.*,
        p.firstName || ' ' || p.lastName as patientName,
        p.contactNumber as patientPhone,
        s.firstName || ' ' || s.lastName as doctorName,
        s.specialization as doctorSpecialty
      FROM appointments a
      LEFT JOIN patients p ON a.patientId = p.id
      LEFT JOIN staff s ON a.doctorId = s.id
      WHERE a.startTime >= ? AND a.status = 'scheduled'
      ORDER BY a.startTime ASC
      LIMIT ?
    `;

    const appointments = db
      .prepare(query)
      .all(now, limit) as AppointmentWithNames[];
    return appointments;
  } catch (error) {
    logger.error(`Error getting upcoming appointments:`, error);
    return [];
  }
};

/**
 * Get appointments statistics (counts by status, by doctor, etc.)
 */
export const getAppointmentStats = async (): Promise<any> => {
  try {
    const totalQuery = "SELECT COUNT(*) as total FROM appointments";
    const total = (db.prepare(totalQuery).get() as { total: number }).total;

    const statusQuery = `
      SELECT status, COUNT(*) as count 
      FROM appointments 
      GROUP BY status
    `;
    const byStatus = db.prepare(statusQuery).all();

    const typeQuery = `
      SELECT type, COUNT(*) as count 
      FROM appointments 
      GROUP BY type
    `;
    const byType = db.prepare(typeQuery).all();

    const doctorQuery = `
      SELECT 
        a.doctorId, 
        s.firstName || ' ' || s.lastName as doctorName,
        COUNT(*) as count 
      FROM appointments a
      JOIN staff s ON a.doctorId = s.id
      GROUP BY a.doctorId
      ORDER BY count DESC
      LIMIT 5
    `;
    const byDoctor = db.prepare(doctorQuery).all();

    return {
      total,
      byStatus,
      byType,
      byDoctor,
    };
  } catch (error) {
    logger.error(`Error getting appointment statistics:`, error);
    return {
      total: 0,
      byStatus: [],
      byType: [],
      byDoctor: [],
    };
  }
};

export default {
  createAppointmentsTable,
  getAllAppointments,
  getAppointmentsByDateRange,
  getAppointmentById,
  getAppointmentsByPatientId,
  getAppointmentsByDoctorId,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  searchAppointments,
  checkAppointmentConflicts,
  getUpcomingAppointments,
  getAppointmentStats,
};
