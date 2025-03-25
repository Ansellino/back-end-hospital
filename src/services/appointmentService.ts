import appointmentModel from "../models/Appointment";
import patientModel from "../models/Patient";
import staffModel from "../models/Staff";
import {
  Appointment,
  AppointmentWithNames,
  AppointmentStatus,
  AppointmentType,
} from "../types/appointment";
import { logger } from "../utils/logger";

/**
 * Get all appointments
 */
export const getAllAppointments = async (): Promise<AppointmentWithNames[]> => {
  try {
    return await appointmentModel.getAllAppointments();
  } catch (error) {
    logger.error("Error in appointmentService.getAllAppointments:", error);
    throw new Error("Failed to retrieve appointments");
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
    return await appointmentModel.getAppointmentsByDateRange(
      startDate,
      endDate
    );
  } catch (error) {
    logger.error(
      `Error in appointmentService.getAppointmentsByDateRange for range ${startDate} to ${endDate}:`,
      error
    );
    throw new Error("Failed to retrieve appointments for date range");
  }
};

/**
 * Get an appointment by ID
 */
export const getAppointmentById = async (
  id: number
): Promise<AppointmentWithNames | null> => {
  try {
    return await appointmentModel.getAppointmentById(id);
  } catch (error) {
    logger.error(
      `Error in appointmentService.getAppointmentById for ID ${id}:`,
      error
    );
    throw new Error("Failed to retrieve appointment");
  }
};

/**
 * Get appointments by patient ID
 */
export const getAppointmentsByPatientId = async (
  patientId: number
): Promise<AppointmentWithNames[]> => {
  try {
    // Verify that the patient exists
    const patient = await patientModel.findById(patientId);
    if (!patient) {
      throw new Error("Patient not found");
    }

    return await appointmentModel.getAppointmentsByPatientId(patientId);
  } catch (error) {
    logger.error(
      `Error in appointmentService.getAppointmentsByPatientId for patient ${patientId}:`,
      error
    );
    throw error;
  }
};

/**
 * Get appointments by doctor ID
 */
export const getAppointmentsByDoctorId = async (
  doctorId: number
): Promise<AppointmentWithNames[]> => {
  try {
    // Verify that the doctor exists - using getStaffById instead of findById
    const doctor = await staffModel.getStaffById(String(doctorId));
    if (!doctor || doctor.role !== "doctor") {
      throw new Error("Doctor not found");
    }

    return await appointmentModel.getAppointmentsByDoctorId(doctorId);
  } catch (error) {
    logger.error(
      `Error in appointmentService.getAppointmentsByDoctorId for doctor ${doctorId}:`,
      error
    );
    throw error;
  }
};

/**
 * Create a new appointment
 */
export const createAppointment = async (
  appointmentData: Omit<Appointment, "id" | "createdAt" | "updatedAt">
): Promise<Appointment | null> => {
  try {
    // Validate required fields
    if (
      !appointmentData.patientId ||
      !appointmentData.doctorId ||
      !appointmentData.title ||
      !appointmentData.startTime ||
      !appointmentData.endTime ||
      !appointmentData.status ||
      !appointmentData.type
    ) {
      throw new Error("Missing required appointment fields");
    }

    // Validate patient exists
    const patient = await patientModel.findById(appointmentData.patientId);
    if (!patient) {
      throw new Error("Patient not found");
    }

    // Validate doctor exists
    const doctor = await staffModel.getStaffById(
      String(appointmentData.doctorId)
    );
    if (!doctor || doctor.role !== "doctor") {
      throw new Error("Doctor not found");
    }

    // Validate appointment times
    const startTime = new Date(appointmentData.startTime);
    const endTime = new Date(appointmentData.endTime);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new Error("Invalid appointment times");
    }

    if (startTime >= endTime) {
      throw new Error("End time must be after start time");
    }

    if (startTime < new Date()) {
      throw new Error("Cannot schedule appointments in the past");
    }

    // Check for conflicts
    const hasConflict = await appointmentModel.checkAppointmentConflicts(
      appointmentData.doctorId,
      appointmentData.startTime,
      appointmentData.endTime
    );

    if (hasConflict) {
      throw new Error("This time slot conflicts with another appointment");
    }

    // Create the appointment
    return await appointmentModel.createAppointment(appointmentData);
  } catch (error) {
    logger.error("Error in appointmentService.createAppointment:", error);
    throw error;
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
    // Verify appointment exists
    const existingAppointment = await appointmentModel.getAppointmentById(id);
    if (!existingAppointment) {
      throw new Error("Appointment not found");
    }

    // If patient ID is being updated, verify the patient exists
    if (appointmentData.patientId) {
      const patient = await patientModel.findById(appointmentData.patientId);
      if (!patient) {
        throw new Error("Patient not found");
      }
    }

    // If doctor ID is being updated, verify the doctor exists
    if (appointmentData.doctorId) {
      const doctor = await staffModel.getStaffById(
        String(appointmentData.doctorId)
      );
      if (!doctor || doctor.role !== "doctor") {
        throw new Error("Doctor not found");
      }
    }

    // If times are being updated, validate them
    if (appointmentData.startTime || appointmentData.endTime) {
      const startTime = new Date(
        appointmentData.startTime || existingAppointment.startTime
      );
      const endTime = new Date(
        appointmentData.endTime || existingAppointment.endTime
      );

      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        throw new Error("Invalid appointment times");
      }

      if (startTime >= endTime) {
        throw new Error("End time must be after start time");
      }

      // Only check for conflicts if time or doctor is being changed
      if (
        appointmentData.startTime ||
        appointmentData.endTime ||
        appointmentData.doctorId
      ) {
        const doctorId =
          appointmentData.doctorId || existingAppointment.doctorId;

        const hasConflict = await appointmentModel.checkAppointmentConflicts(
          doctorId,
          startTime.toISOString(),
          endTime.toISOString(),
          id // Exclude the current appointment from conflict check
        );

        if (hasConflict) {
          throw new Error("This time slot conflicts with another appointment");
        }
      }
    }

    // Update the appointment
    return await appointmentModel.updateAppointment(id, appointmentData);
  } catch (error) {
    logger.error(
      `Error in appointmentService.updateAppointment for ID ${id}:`,
      error
    );
    throw error;
  }
};

/**
 * Delete an appointment
 */
export const deleteAppointment = async (id: number): Promise<boolean> => {
  try {
    // Verify appointment exists
    const existingAppointment = await appointmentModel.getAppointmentById(id);
    if (!existingAppointment) {
      throw new Error("Appointment not found");
    }

    return await appointmentModel.deleteAppointment(id);
  } catch (error) {
    logger.error(
      `Error in appointmentService.deleteAppointment for ID ${id}:`,
      error
    );
    throw error;
  }
};

/**
 * Search appointments
 */
export const searchAppointments = async (
  searchTerm: string
): Promise<AppointmentWithNames[]> => {
  try {
    return await appointmentModel.searchAppointments(searchTerm);
  } catch (error) {
    logger.error(
      `Error in appointmentService.searchAppointments with term '${searchTerm}':`,
      error
    );
    throw new Error("Failed to search appointments");
  }
};

/**
 * Get upcoming appointments
 */
export const getUpcomingAppointments = async (
  limit: number = 10
): Promise<AppointmentWithNames[]> => {
  try {
    return await appointmentModel.getUpcomingAppointments(limit);
  } catch (error) {
    logger.error("Error in appointmentService.getUpcomingAppointments:", error);
    throw new Error("Failed to retrieve upcoming appointments");
  }
};

/**
 * Get appointment statistics
 */
export const getAppointmentStats = async (): Promise<any> => {
  try {
    return await appointmentModel.getAppointmentStats();
  } catch (error) {
    logger.error("Error in appointmentService.getAppointmentStats:", error);
    throw new Error("Failed to retrieve appointment statistics");
  }
};

export default {
  getAllAppointments,
  getAppointmentsByDateRange,
  getAppointmentById,
  getAppointmentsByPatientId,
  getAppointmentsByDoctorId,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  searchAppointments,
  getUpcomingAppointments,
  getAppointmentStats,
};
