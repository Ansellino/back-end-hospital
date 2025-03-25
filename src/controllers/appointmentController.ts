import { Request, Response } from "express";
import appointmentService from "../services/appointmentService";
import { successResponse, errorResponse } from "../utils/apiResponse";
import { logger } from "../utils/logger";

/**
 * @swagger
 * components:
 *   schemas:
 *     Appointment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         patientId:
 *           type: string
 *           format: uuid
 *           example: "550e8400-e29b-41d4-a716-446655440001"
 *         doctorId:
 *           type: string
 *           format: uuid
 *           example: "550e8400-e29b-41d4-a716-446655440002"
 *         title:
 *           type: string
 *           example: "Regular Checkup"
 *         startTime:
 *           type: string
 *           format: date-time
 *           example: "2023-10-20T09:00:00Z"
 *         endTime:
 *           type: string
 *           format: date-time
 *           example: "2023-10-20T09:30:00Z"
 *         status:
 *           type: string
 *           enum: [scheduled, completed, cancelled, no-show]
 *           example: "scheduled"
 *         notes:
 *           type: string
 *           example: "Patient has reported mild fever"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - id
 *         - patientId
 *         - doctorId
 *         - title
 *         - startTime
 *         - endTime
 *         - status
 *
 *     AppointmentCreate:
 *       type: object
 *       required:
 *         - patientId
 *         - doctorId
 *         - title
 *         - startTime
 *         - endTime
 *         - status
 *       properties:
 *         patientId:
 *           type: string
 *           format: uuid
 *         doctorId:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *         startTime:
 *           type: string
 *           format: date-time
 *         endTime:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [scheduled, completed, cancelled, no-show]
 *         notes:
 *           type: string
 *
 *     AppointmentStats:
 *       type: object
 *       properties:
 *         totalAppointments:
 *           type: integer
 *           example: 150
 *         todayAppointments:
 *           type: integer
 *           example: 12
 *         upcomingAppointments:
 *           type: integer
 *           example: 45
 *         statusDistribution:
 *           type: object
 *           properties:
 *             scheduled:
 *               type: integer
 *               example: 80
 *             completed:
 *               type: integer
 *               example: 45
 *             cancelled:
 *               type: integer
 *               example: 20
 *             no-show:
 *               type: integer
 *               example: 5
 */

/**
 * Get all appointments with optional date range filtering
 * @route GET /api/appointments
 * @swagger
 * /api/appointments:
 *   get:
 *     summary: Get all appointments
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter appointments from this date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter appointments until this date (YYYY-MM-DD)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, completed, cancelled, no-show]
 *         description: Filter by appointment status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of appointments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Appointment'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create a new appointment
 *     description: Create a new appointment between a patient and doctor
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AppointmentCreate'
 *     responses:
 *       201:
 *         description: Appointment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Appointment created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Appointment'
 *       400:
 *         description: Invalid input data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update an appointment
 *     description: Update an existing appointment's details
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Appointment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [scheduled, completed, cancelled, no-show]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Appointment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Appointment updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Appointment'
 *       400:
 *         description: Invalid input data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Appointment not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete an appointment
 *     description: Delete an existing appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Appointment ID
 *     responses:
 *       200:
 *         description: Appointment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Appointment deleted successfully"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Appointment not found
 *       500:
 *         description: Server error
 */
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

/**
 * Get a single appointment by ID
 * @route GET /api/appointments/:id
 * @swagger
 * /api/appointments/{id}:
 *   get:
 *     summary: Get appointment by ID
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Appointment ID
 *     responses:
 *       200:
 *         description: Appointment details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Appointment'
 *       404:
 *         description: Appointment not found
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
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

/**
 * Get appointments for a specific patient
 * @route GET /api/appointments/patient/:patientId
 * @swagger
 * /api/appointments/patient/{patientId}:
 *   get:
 *     summary: Get appointments by patient ID
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: Patient's appointments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Appointment'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Patient not found
 */
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

/**
 * @swagger
 * /api/appointments/doctor/{doctorId}:
 *   get:
 *     summary: Get appointments by doctor ID
 *     description: Retrieve all appointments for a specific doctor
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Doctor ID
 *     responses:
 *       200:
 *         description: Doctor's appointments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Doctor appointments retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Appointment'
 *       400:
 *         description: Invalid doctor ID
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Doctor not found
 *       500:
 *         description: Server error
 */
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

/**
 * Create a new appointment
 * @route POST /api/appointments
 * @swagger
 * /api/appointments:
 *   post:
 *     summary: Create a new appointment
 *     description: Create a new appointment between a patient and doctor
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AppointmentCreate'
 *     responses:
 *       201:
 *         description: Appointment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Appointment created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Appointment'
 *       400:
 *         description: Invalid input data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         description: Server error
 */
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

/**
 * Update an existing appointment
 * @route PUT /api/appointments/:id
 * @swagger
 * /api/appointments/{id}:
 *   put:
 *     summary: Update an appointment
 *     description: Update an existing appointment's details
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Appointment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [scheduled, completed, cancelled, no-show]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Appointment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Appointment updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Appointment'
 *       400:
 *         description: Invalid input data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Appointment not found
 *       500:
 *         description: Server error
 */
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

/**
 * Delete an appointment
 * @route DELETE /api/appointments/:id
 * @swagger
 * /api/appointments/{id}:
 *   delete:
 *     summary: Delete an appointment
 *     description: Delete an existing appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Appointment ID
 *     responses:
 *       200:
 *         description: Appointment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Appointment deleted successfully"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Appointment not found
 *       500:
 *         description: Server error
 */
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

/**
 * Get appointment statistics
 * @route GET /api/appointments/stats
 * @swagger
 * /api/appointments/stats:
 *   get:
 *     summary: Get appointment statistics
 *     description: Retrieve statistics about appointments including counts by status
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Appointment statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AppointmentStats'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         description: Server error
 */
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
