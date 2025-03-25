import PatientModel from "../models/Patient";
import {
  CreatePatientRequest,
  UpdatePatientRequest,
  Patient,
  PatientWithMetadata,
} from "../types/patient";
import { logger } from "../utils/logger";

/**
 * Get all patients
 */
export const getAllPatients = async (): Promise<Patient[]> => {
  try {
    return await PatientModel.findAll();
  } catch (error) {
    logger.error("Error in patientService.getAllPatients:", error);
    throw new Error("Failed to retrieve patients");
  }
};

/**
 * Get patient by ID
 */
export const getPatientById = async (id: number): Promise<Patient | null> => {
  try {
    return await PatientModel.findById(id);
  } catch (error) {
    logger.error(`Error in patientService.getPatientById for ID ${id}:`, error);
    throw new Error("Failed to retrieve patient");
  }
};

/**
 * Get patient with metadata by ID
 */
export const getPatientWithMetadata = async (
  id: number
): Promise<PatientWithMetadata | null> => {
  try {
    return await PatientModel.getPatientWithMetadata(id);
  } catch (error) {
    logger.error(
      `Error in patientService.getPatientWithMetadata for ID ${id}:`,
      error
    );
    throw new Error("Failed to retrieve patient with metadata");
  }
};

/**
 * Search patients by query string
 */
export const searchPatients = async (query: string): Promise<Patient[]> => {
  try {
    return await PatientModel.searchPatients(query);
  } catch (error) {
    logger.error(
      `Error in patientService.searchPatients with query "${query}":`,
      error
    );
    throw new Error("Failed to search patients");
  }
};

/**
 * Create a new patient
 */
export const createPatient = async (
  patientData: CreatePatientRequest
): Promise<Patient> => {
  try {
    validatePatientData(patientData);

    const patient = await PatientModel.create(patientData);

    if (!patient) {
      throw new Error("Failed to create patient");
    }

    return patient;
  } catch (error) {
    logger.error("Error in patientService.createPatient:", error);
    throw error;
  }
};

/**
 * Update an existing patient
 */
export const updatePatient = async (
  id: number,
  patientData: UpdatePatientRequest
): Promise<Patient | null> => {
  try {
    // Check if patient exists
    const existingPatient = await getPatientById(id);
    if (!existingPatient) {
      return null;
    }

    // Update the patient
    return await PatientModel.update(id, patientData);
  } catch (error) {
    logger.error(`Error in patientService.updatePatient for ID ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a patient
 */
export const deletePatient = async (id: number): Promise<boolean> => {
  try {
    return await PatientModel.remove(id);
  } catch (error) {
    logger.error(`Error in patientService.deletePatient for ID ${id}:`, error);
    throw new Error("Failed to delete patient");
  }
};

/**
 * Get patient count
 */
export const getPatientCount = async (): Promise<number> => {
  try {
    return PatientModel.count();
  } catch (error) {
    logger.error("Error in patientService.getPatientCount:", error);
    throw new Error("Failed to count patients");
  }
};

/**
 * Validate patient data
 * @private
 */
const validatePatientData = (patientData: CreatePatientRequest): void => {
  if (!patientData.firstName) {
    throw new Error("First name is required");
  }

  if (!patientData.lastName) {
    throw new Error("Last name is required");
  }

  if (!patientData.dateOfBirth) {
    throw new Error("Date of birth is required");
  }

  if (!patientData.gender) {
    throw new Error("Gender is required");
  }

  // Additional validations
  if (patientData.email && !isValidEmail(patientData.email)) {
    throw new Error("Invalid email format");
  }
};

/**
 * Validate email format
 * @private
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default {
  getAllPatients,
  getPatientById,
  getPatientWithMetadata,
  searchPatients,
  createPatient,
  updatePatient,
  deletePatient,
  getPatientCount,
};
