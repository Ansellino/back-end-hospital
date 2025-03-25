import { Request, Response } from "express";
import medicalRecordService from "../services/medicalRecordService";
import { successResponse, errorResponse } from "../utils/apiResponse";
import { logger } from "../utils/logger";

/**
 * Get all medical records
 * @route GET /api/medical-records
 */
export const getAllMedicalRecords = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { patientId, doctorId } = req.query;

    let records;

    if (patientId) {
      records = await medicalRecordService.getMedicalRecordsByPatientId(
        Number(patientId)
      );
    } else if (doctorId) {
      records = await medicalRecordService.getMedicalRecordsByDoctorId(
        Number(doctorId)
      );
    } else {
      records = await medicalRecordService.getAllMedicalRecords();
    }

    res
      .status(200)
      .json(successResponse("Medical records retrieved successfully", records));
  } catch (error) {
    logger.error("Error retrieving medical records:", error);

    if (error instanceof Error) {
      if (
        error.message === "Patient not found" ||
        error.message === "Doctor not found"
      ) {
        res.status(404).json(errorResponse(error.message));
        return;
      }
    }

    res.status(500).json(errorResponse("Failed to retrieve medical records"));
  }
};

/**
 * Get a single medical record by ID
 * @route GET /api/medical-records/:id
 */
export const getMedicalRecord = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      res.status(400).json(errorResponse("Invalid medical record ID"));
      return;
    }

    const record = await medicalRecordService.getMedicalRecordById(id);

    if (!record) {
      res.status(404).json(errorResponse("Medical record not found"));
      return;
    }

    res
      .status(200)
      .json(successResponse("Medical record retrieved successfully", record));
  } catch (error) {
    logger.error(`Error retrieving medical record ${req.params.id}:`, error);
    res.status(500).json(errorResponse("Failed to retrieve medical record"));
  }
};

/**
 * Create a new medical record
 * @route POST /api/medical-records
 */
export const createMedicalRecord = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const recordData = req.body;

    const record = await medicalRecordService.createMedicalRecord(recordData);

    if (!record) {
      res.status(400).json(errorResponse("Failed to create medical record"));
      return;
    }

    res
      .status(201)
      .json(successResponse("Medical record created successfully", record));
  } catch (error) {
    logger.error("Error creating medical record:", error);

    if (error instanceof Error) {
      if (
        error.message === "Patient not found" ||
        error.message === "Doctor not found"
      ) {
        res.status(404).json(errorResponse(error.message));
        return;
      }
    }

    res.status(500).json(errorResponse("Failed to create medical record"));
  }
};

/**
 * Update an existing medical record
 * @route PUT /api/medical-records/:id
 */
export const updateMedicalRecord = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const recordData = req.body;

    if (isNaN(id)) {
      res.status(400).json(errorResponse("Invalid medical record ID"));
      return;
    }

    const updatedRecord = await medicalRecordService.updateMedicalRecord(
      id,
      recordData
    );

    if (!updatedRecord) {
      res.status(404).json(errorResponse("Medical record not found"));
      return;
    }

    res
      .status(200)
      .json(
        successResponse("Medical record updated successfully", updatedRecord)
      );
  } catch (error) {
    logger.error(`Error updating medical record ${req.params.id}:`, error);

    if (error instanceof Error) {
      if (
        error.message === "Medical record not found" ||
        error.message === "Patient not found" ||
        error.message === "Doctor not found"
      ) {
        res.status(404).json(errorResponse(error.message));
        return;
      }
    }

    res.status(500).json(errorResponse("Failed to update medical record"));
  }
};

/**
 * Delete a medical record
 * @route DELETE /api/medical-records/:id
 */
export const deleteMedicalRecord = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      res.status(400).json(errorResponse("Invalid medical record ID"));
      return;
    }

    const success = await medicalRecordService.deleteMedicalRecord(id);

    if (!success) {
      res.status(404).json(errorResponse("Medical record not found"));
      return;
    }

    res
      .status(200)
      .json(successResponse("Medical record deleted successfully"));
  } catch (error) {
    logger.error(`Error deleting medical record ${req.params.id}:`, error);

    if (
      error instanceof Error &&
      error.message === "Medical record not found"
    ) {
      res.status(404).json(errorResponse(error.message));
      return;
    }

    res.status(500).json(errorResponse("Failed to delete medical record"));
  }
};

/**
 * Add an attachment to a medical record
 * @route POST /api/medical-records/:id/attachments
 */
export const addAttachment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const medicalRecordId = Number(req.params.id);
    const attachmentData = req.body;

    if (isNaN(medicalRecordId)) {
      res.status(400).json(errorResponse("Invalid medical record ID"));
      return;
    }

    const attachment = await medicalRecordService.addAttachment(
      medicalRecordId,
      attachmentData
    );

    if (!attachment) {
      res.status(400).json(errorResponse("Failed to add attachment"));
      return;
    }

    res
      .status(201)
      .json(successResponse("Attachment added successfully", attachment));
  } catch (error) {
    logger.error(
      `Error adding attachment to medical record ${req.params.id}:`,
      error
    );

    if (
      error instanceof Error &&
      error.message === "Medical record not found"
    ) {
      res.status(404).json(errorResponse(error.message));
      return;
    }

    res.status(500).json(errorResponse("Failed to add attachment"));
  }
};

/**
 * Search medical records
 * @route GET /api/medical-records/search
 */
export const searchMedicalRecords = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      res.status(400).json(errorResponse("Search query is required"));
      return;
    }

    const records = await medicalRecordService.searchMedicalRecords(q);

    res
      .status(200)
      .json(successResponse("Medical records search results", records));
  } catch (error) {
    logger.error(`Error searching medical records:`, error);
    res.status(500).json(errorResponse("Failed to search medical records"));
  }
};

export default {
  getAllMedicalRecords,
  getMedicalRecord,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
  addAttachment,
  searchMedicalRecords,
};
