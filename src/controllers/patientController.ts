import { Request, Response } from "express";
import patientService from "../services/patientService";
import { successResponse, errorResponse } from "../utils/apiResponse";
import { logger } from "../utils/logger";
import medicalRecordService from "../services/medicalRecordService";
import appointmentService from "../services/appointmentService";

/**
 * Get all patients
 * @route GET /api/patients
 */
export const getAllPatients = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const patients = await patientService.getAllPatients();

    res
      .status(200)
      .json(successResponse("Patients retrieved successfully", patients));
  } catch (error) {
    logger.error("Error retrieving patients:", error);
    res.status(500).json(errorResponse("Failed to retrieve patients"));
  }
};

/**
 * Get patient by ID
 * @route GET /api/patients/:id
 */
export const getPatientById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json(errorResponse("Invalid patient ID"));
      return;
    }

    const patient = await patientService.getPatientById(id);

    if (!patient) {
      res.status(404).json(errorResponse("Patient not found"));
      return;
    }

    res
      .status(200)
      .json(successResponse("Patient retrieved successfully", patient));
  } catch (error) {
    logger.error(`Error retrieving patient ${req.params.id}:`, error);
    res.status(500).json(errorResponse("Failed to retrieve patient"));
  }
};

/**
 * Search patients based on query string
 * @route GET /api/patients/search
 */
export const searchPatients = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const searchQuery = req.query.q as string;

    if (!searchQuery) {
      res.status(400).json(errorResponse("Search query is required"));
      return;
    }

    const patients = await patientService.searchPatients(searchQuery);

    res
      .status(200)
      .json(successResponse("Patients retrieved successfully", patients));
  } catch (error) {
    logger.error("Error searching patients:", error);
    res.status(500).json(errorResponse("Failed to search patients"));
  }
};

/**
 * Create a new patient
 * @route POST /api/patients
 */
export const createPatient = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const patientData = req.body;

    const newPatient = await patientService.createPatient(patientData);

    res
      .status(201)
      .json(successResponse("Patient created successfully", newPatient));
  } catch (error) {
    logger.error("Error creating patient:", error);

    if (error instanceof Error) {
      // Return specific validation errors
      res.status(400).json(errorResponse(error.message));
    } else {
      res.status(500).json(errorResponse("Failed to create patient"));
    }
  }
};

/**
 * Update an existing patient
 * @route PUT /api/patients/:id
 */
export const updatePatient = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json(errorResponse("Invalid patient ID"));
      return;
    }

    const patientData = req.body;

    // Check if any fields to update were provided
    if (Object.keys(patientData).length === 0) {
      res
        .status(400)
        .json(errorResponse("At least one field to update must be provided"));
      return;
    }

    const updatedPatient = await patientService.updatePatient(id, patientData);

    if (!updatedPatient) {
      res.status(404).json(errorResponse("Patient not found"));
      return;
    }

    res
      .status(200)
      .json(successResponse("Patient updated successfully", updatedPatient));
  } catch (error) {
    logger.error(`Error updating patient ${req.params.id}:`, error);

    if (error instanceof Error) {
      // Return specific validation errors
      res.status(400).json(errorResponse(error.message));
    } else {
      res.status(500).json(errorResponse("Failed to update patient"));
    }
  }
};

/**
 * Delete a patient
 * @route DELETE /api/patients/:id
 */
export const deletePatient = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json(errorResponse("Invalid patient ID"));
      return;
    }

    const isDeleted = await patientService.deletePatient(id);

    if (!isDeleted) {
      res.status(404).json(errorResponse("Patient not found"));
      return;
    }

    res.status(200).json(successResponse("Patient deleted successfully"));
  } catch (error) {
    logger.error(`Error deleting patient ${req.params.id}:`, error);
    res.status(500).json(errorResponse("Failed to delete patient"));
  }
};

/**
 * Get a patient's medical records
 * @route GET /api/patients/:id/medical-records
 */
export const getPatientMedicalRecords = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const patientId = parseInt(req.params.id);

    if (isNaN(patientId)) {
      res.status(400).json(errorResponse("Invalid patient ID"));
      return;
    }

    // Check if patient exists
    const patient = await patientService.getPatientById(patientId);
    if (!patient) {
      res.status(404).json(errorResponse("Patient not found"));
      return;
    }

    // Get the patient's medical records
    const medicalRecords =
      await medicalRecordService.getMedicalRecordsByPatientId(patientId);

    res
      .status(200)
      .json(
        successResponse(
          "Medical records retrieved successfully",
          medicalRecords
        )
      );
  } catch (error) {
    logger.error(
      `Error retrieving medical records for patient ${req.params.id}:`,
      error
    );
    res
      .status(500)
      .json(errorResponse("Error retrieving patient medical records"));
  }
};

/**
 * Get a patient's appointments
 * @route GET /api/patients/:id/appointments
 */
export const getPatientAppointments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const patientId = parseInt(req.params.id);

    if (isNaN(patientId)) {
      res.status(400).json(errorResponse("Invalid patient ID"));
      return;
    }

    // Check if patient exists
    const patient = await patientService.getPatientById(patientId);
    if (!patient) {
      res.status(404).json(errorResponse("Patient not found"));
      return;
    }

    // Get the patient's appointments - Fix: use correct method name
    const appointments = await appointmentService.getAppointmentsByPatientId(
      patientId
    );

    res
      .status(200)
      .json(
        successResponse("Appointments retrieved successfully", appointments)
      );
  } catch (error) {
    logger.error(
      `Error retrieving appointments for patient ${req.params.id}:`,
      error
    );
    res
      .status(500)
      .json(errorResponse("Error retrieving patient appointments"));
  }
};

/**
 * Get statistics for patients (used in dashboard)
 * @route GET /api/patients/stats
 */
export const getPatientStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get basic stats
    const totalPatients = await patientService.getPatientCount();

    // Get patient distribution by gender
    const patients = await patientService.getAllPatients();

    const genderDistribution = {
      male: patients.filter((p) => p.gender.toLowerCase() === "male").length,
      female: patients.filter((p) => p.gender.toLowerCase() === "female")
        .length,
      other: patients.filter(
        (p) =>
          p.gender.toLowerCase() !== "male" &&
          p.gender.toLowerCase() !== "female"
      ).length,
    };

    // Get distribution by age groups
    const now = new Date();
    const ageGroups = {
      under18: 0,
      age18to30: 0,
      age31to45: 0,
      age46to60: 0,
      over60: 0,
    };

    patients.forEach((patient) => {
      const birthDate = new Date(patient.dateOfBirth);
      const age = now.getFullYear() - birthDate.getFullYear();
      const m = now.getMonth() - birthDate.getMonth();

      // Adjust age if birthday hasn't occurred yet this year
      const adjustedAge =
        m < 0 || (m === 0 && now.getDate() < birthDate.getDate())
          ? age - 1
          : age;

      if (adjustedAge < 18) ageGroups.under18++;
      else if (adjustedAge <= 30) ageGroups.age18to30++;
      else if (adjustedAge <= 45) ageGroups.age31to45++;
      else if (adjustedAge <= 60) ageGroups.age46to60++;
      else ageGroups.over60++;
    });

    // Return the stats
    res.status(200).json(
      successResponse("Patient statistics retrieved successfully", {
        totalPatients,
        genderDistribution,
        ageGroups,
      })
    );
  } catch (error) {
    logger.error("Error retrieving patient statistics:", error);
    res
      .status(500)
      .json(errorResponse("Failed to retrieve patient statistics"));
  }
};

export default {
  getAllPatients,
  getPatientById,
  searchPatients,
  createPatient,
  updatePatient,
  deletePatient,
  getPatientMedicalRecords,
  getPatientAppointments,
  getPatientStats,
};
