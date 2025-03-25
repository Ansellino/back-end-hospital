import { Request, Response } from "express";
import appointmentService from "../services/appointmentService";
import { successResponse, errorResponse } from "../utils/apiResponse";
import { logger } from "../utils/logger";

export const getAllAppointments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    let appointments;

    if (startDate && endDate) {
      appointments = await appointmentService.getAppointmentsByDateRange(
        startDate as string,
        endDate as string
      );
    } else {
      appointments = await appointmentService.getAllAppointments();
    }

    res
      .status(200)
      .json(
        successResponse("Appointments retrieved successfully", appointments)
      );
  } catch (error) {
    logger.error("Error retrieving appointments:", error);
    res.status(500).json(errorResponse("Failed to retrieve appointments"));
  }
};

export const getAppointmentById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const appointmentId = parseInt(req.params.id);

    if (isNaN(appointmentId)) {
      res.status(400).json(errorResponse("Invalid appointment ID"));
      return;
    }

    const appointment = await appointmentService.getAppointmentById(
      appointmentId
    );

    if (!appointment) {
      res.status(404).json(errorResponse("Appointment not found"));
      return;
    }

    res
      .status(200)
      .json(successResponse("Appointment retrieved successfully", appointment));
  } catch (error) {
    logger.error(`Error retrieving appointment ${req.params.id}:`, error);
    res.status(500).json(errorResponse("Failed to retrieve appointment"));
  }
};

export const getAppointmentsByPatientId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const patientId = parseInt(req.params.patientId);

    if (isNaN(patientId)) {
      res.status(400).json(errorResponse("Invalid patient ID"));
      return;
    }

    const appointments = await appointmentService.getAppointmentsByPatientId(
      patientId
    );

    res
      .status(200)
      .json(
        successResponse(
          "Patient appointments retrieved successfully",
          appointments
        )
      );
  } catch (error) {
    logger.error(
      `Error retrieving appointments for patient ${req.params.patientId}:`,
      error
    );

    if (error instanceof Error && error.message === "Patient not found") {
      res.status(404).json(errorResponse(error.message));
      return;
    }

    res
      .status(500)
      .json(errorResponse("Failed to retrieve patient appointments"));
  }
};

export const getAppointmentsByDoctorId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const doctorId = parseInt(req.params.doctorId);

    if (isNaN(doctorId)) {
      res.status(400).json(errorResponse("Invalid doctor ID"));
      return;
    }

    const appointments = await appointmentService.getAppointmentsByDoctorId(
      doctorId
    );

    res
      .status(200)
      .json(
        successResponse(
          "Doctor appointments retrieved successfully",
          appointments
        )
      );
  } catch (error) {
    logger.error(
      `Error retrieving appointments for doctor ${req.params.doctorId}:`,
      error
    );

    if (error instanceof Error && error.message === "Doctor not found") {
      res.status(404).json(errorResponse(error.message));
      return;
    }

    res
      .status(500)
      .json(errorResponse("Failed to retrieve doctor appointments"));
  }
};

export const createAppointment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const appointmentData = req.body;

    const newAppointment = await appointmentService.createAppointment(
      appointmentData
    );

    res
      .status(201)
      .json(
        successResponse("Appointment created successfully", newAppointment)
      );
  } catch (error) {
    logger.error("Error creating appointment:", error);

    if (error instanceof Error) {
      // Handle various validation errors
      if (
        error.message === "Missing required appointment fields" ||
        error.message === "Invalid appointment times" ||
        error.message === "End time must be after start time" ||
        error.message === "Cannot schedule appointments in the past" ||
        error.message === "This time slot conflicts with another appointment"
      ) {
        res.status(400).json(errorResponse(error.message));
        return;
      }

      if (
        error.message === "Patient not found" ||
        error.message === "Doctor not found"
      ) {
        res.status(404).json(errorResponse(error.message));
        return;
      }
    }

    res.status(500).json(errorResponse("Failed to create appointment"));
  }
};

export const updateAppointment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const appointmentId = parseInt(req.params.id);

    if (isNaN(appointmentId)) {
      res.status(400).json(errorResponse("Invalid appointment ID"));
      return;
    }

    const appointmentData = req.body;

    const updatedAppointment = await appointmentService.updateAppointment(
      appointmentId,
      appointmentData
    );

    res
      .status(200)
      .json(
        successResponse("Appointment updated successfully", updatedAppointment)
      );
  } catch (error) {
    logger.error(`Error updating appointment ${req.params.id}:`, error);

    if (error instanceof Error) {
      // Handle various errors
      if (
        error.message === "Invalid appointment times" ||
        error.message === "End time must be after start time" ||
        error.message === "This time slot conflicts with another appointment"
      ) {
        res.status(400).json(errorResponse(error.message));
        return;
      }

      if (
        error.message === "Appointment not found" ||
        error.message === "Patient not found" ||
        error.message === "Doctor not found"
      ) {
        res.status(404).json(errorResponse(error.message));
        return;
      }
    }

    res.status(500).json(errorResponse("Failed to update appointment"));
  }
};

export const deleteAppointment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const appointmentId = parseInt(req.params.id);

    if (isNaN(appointmentId)) {
      res.status(400).json(errorResponse("Invalid appointment ID"));
      return;
    }

    const success = await appointmentService.deleteAppointment(appointmentId);

    if (success) {
      res.status(200).json(successResponse("Appointment deleted successfully"));
    } else {
      res.status(404).json(errorResponse("Appointment not found"));
    }
  } catch (error) {
    logger.error(`Error deleting appointment ${req.params.id}:`, error);

    if (error instanceof Error && error.message === "Appointment not found") {
      res.status(404).json(errorResponse(error.message));
      return;
    }

    res.status(500).json(errorResponse("Failed to delete appointment"));
  }
};

/**
 * Search appointments
 * @route GET /api/appointments/search
 */
export const searchAppointments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      res.status(400).json(errorResponse("Search query is required"));
      return;
    }

    const appointments = await appointmentService.searchAppointments(q);

    res
      .status(200)
      .json(successResponse("Appointments search results", appointments));
  } catch (error) {
    logger.error("Error searching appointments:", error);
    res.status(500).json(errorResponse("Failed to search appointments"));
  }
};

/**
 * Get upcoming appointments
 * @route GET /api/appointments/upcoming
 */
export const getUpcomingAppointments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const appointments = await appointmentService.getUpcomingAppointments(
      limit
    );

    res
      .status(200)
      .json(
        successResponse(
          "Upcoming appointments retrieved successfully",
          appointments
        )
      );
  } catch (error) {
    logger.error("Error retrieving upcoming appointments:", error);
    res
      .status(500)
      .json(errorResponse("Failed to retrieve upcoming appointments"));
  }
};

export const getAppointmentStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const stats = await appointmentService.getAppointmentStats();

    res
      .status(200)
      .json(
        successResponse("Appointment statistics retrieved successfully", stats)
      );
  } catch (error) {
    logger.error("Error retrieving appointment statistics:", error);
    res
      .status(500)
      .json(errorResponse("Failed to retrieve appointment statistics"));
  }
};

export default {
  getAllAppointments,
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
