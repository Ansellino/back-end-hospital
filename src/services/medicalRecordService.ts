import medicalRecordModel from "../models/MedicalRecord";
import patientService from "./patientService";
import staffService from "./staffService";
import {
  MedicalRecord,
  MedicalRecordWithNames,
  Attachment,
} from "../models/MedicalRecord";
import { logger } from "../utils/logger";

/**
 * Get all medical records
 */
export const getAllMedicalRecords = async (): Promise<
  MedicalRecordWithNames[]
> => {
  try {
    return medicalRecordModel.getAllMedicalRecords();
  } catch (error) {
    logger.error("Error in medicalRecordService.getAllMedicalRecords:", error);
    throw new Error("Failed to retrieve medical records");
  }
};

/**
 * Get a single medical record by ID
 */
export const getMedicalRecordById = async (
  id: number
): Promise<MedicalRecordWithNames | null> => {
  try {
    return medicalRecordModel.getMedicalRecordById(id);
  } catch (error) {
    logger.error(
      `Error in medicalRecordService.getMedicalRecordById for ID ${id}:`,
      error
    );
    throw new Error("Failed to retrieve medical record");
  }
};

/**
 * Get all medical records for a patient
 */
export const getMedicalRecordsByPatientId = async (
  patientId: number
): Promise<MedicalRecordWithNames[]> => {
  try {
    // Verify patient exists
    const patient = await patientService.getPatientById(patientId);
    if (!patient) {
      throw new Error("Patient not found");
    }

    return medicalRecordModel.getMedicalRecordsByPatientId(patientId);
  } catch (error) {
    logger.error(
      `Error in medicalRecordService.getMedicalRecordsByPatientId for patient ${patientId}:`,
      error
    );
    throw error;
  }
};

/**
 * Get all medical records created by a doctor
 */
export const getMedicalRecordsByDoctorId = async (
  doctorId: number
): Promise<MedicalRecordWithNames[]> => {
  try {
    // Verify doctor exists - convert doctorId to string for staffService
    const doctor = await staffService.getStaffById(String(doctorId));
    if (!doctor || doctor.role !== "doctor") {
      throw new Error("Doctor not found");
    }

    return medicalRecordModel.getMedicalRecordsByDoctorId(doctorId);
  } catch (error) {
    logger.error(
      `Error in medicalRecordService.getMedicalRecordsByDoctorId for doctor ${doctorId}:`,
      error
    );
    throw error;
  }
};

/**
 * Create a new medical record
 */
export const createMedicalRecord = async (
  recordData: Omit<MedicalRecord, "id" | "createdAt" | "updatedAt">
): Promise<MedicalRecord | null> => {
  try {
    // Verify patient exists
    const patient = await patientService.getPatientById(recordData.patientId);
    if (!patient) {
      throw new Error("Patient not found");
    }

    // Verify doctor exists - FIXED: convert doctorId to string
    const doctor = await staffService.getStaffById(String(recordData.doctorId));
    if (!doctor || doctor.role !== "doctor") {
      throw new Error("Doctor not found");
    }

    return medicalRecordModel.createMedicalRecord(recordData);
  } catch (error) {
    logger.error("Error in medicalRecordService.createMedicalRecord:", error);
    throw error;
  }
};

/**
 * Update an existing medical record
 */
export const updateMedicalRecord = async (
  id: number,
  recordData: Partial<Omit<MedicalRecord, "id" | "createdAt" | "updatedAt">>
): Promise<MedicalRecord | null> => {
  try {
    // Verify record exists
    const record = await getMedicalRecordById(id);
    if (!record) {
      throw new Error("Medical record not found");
    }

    // Verify patient exists if being updated
    if (recordData.patientId) {
      const patient = await patientService.getPatientById(recordData.patientId);
      if (!patient) {
        throw new Error("Patient not found");
      }
    }

    // Verify doctor exists if being updated
    if (recordData.doctorId) {
      const doctor = await staffService.getStaffById(
        String(recordData.doctorId)
      );
      if (!doctor || doctor.role !== "doctor") {
        throw new Error("Doctor not found");
      }
    }

    return medicalRecordModel.updateMedicalRecord(id, recordData);
  } catch (error) {
    logger.error(
      `Error in medicalRecordService.updateMedicalRecord for ID ${id}:`,
      error
    );
    throw error;
  }
};

/**
 * Delete a medical record
 */
export const deleteMedicalRecord = async (id: number): Promise<boolean> => {
  try {
    // Verify record exists
    const record = await getMedicalRecordById(id);
    if (!record) {
      throw new Error("Medical record not found");
    }

    return medicalRecordModel.deleteMedicalRecord(id);
  } catch (error) {
    logger.error(
      `Error in medicalRecordService.deleteMedicalRecord for ID ${id}:`,
      error
    );
    throw error;
  }
};

/**
 * Add an attachment to a medical record
 */
export const addAttachment = async (
  medicalRecordId: number,
  attachment: Omit<Attachment, "id" | "uploadedOn">
): Promise<Attachment | null> => {
  try {
    // Verify record exists
    const record = await getMedicalRecordById(medicalRecordId);
    if (!record) {
      throw new Error("Medical record not found");
    }

    return medicalRecordModel.addAttachment(medicalRecordId, attachment);
  } catch (error) {
    logger.error(
      `Error in medicalRecordService.addAttachment for record ${medicalRecordId}:`,
      error
    );
    throw error;
  }
};

/**
 * Search medical records
 */
export const searchMedicalRecords = async (
  query: string
): Promise<MedicalRecordWithNames[]> => {
  try {
    return medicalRecordModel.searchMedicalRecords(query);
  } catch (error) {
    logger.error(
      `Error in medicalRecordService.searchMedicalRecords with query "${query}":`,
      error
    );
    throw new Error("Failed to search medical records");
  }
};

export default {
  getAllMedicalRecords,
  getMedicalRecordById,
  getMedicalRecordsByPatientId,
  getMedicalRecordsByDoctorId,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
  addAttachment,
  searchMedicalRecords,
};
