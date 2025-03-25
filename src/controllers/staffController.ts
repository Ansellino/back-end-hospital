import { Request, Response } from "express";
import staffService from "../services/staffService";
import { successResponse, errorResponse } from "../utils/apiResponse";
import { logger } from "../utils/logger";
import { StaffRole, StaffStatus } from "../types/staff";

/**
 * Get all staff members with optional filtering
 */
export const getAllStaff = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const role = req.query.role as StaffRole | undefined;
    const department = req.query.department as string | undefined;
    const status = req.query.status as StaffStatus | undefined;
    const search = req.query.search as string | undefined;

    const staff = await staffService.getAllStaff(
      role,
      department,
      status,
      search
    );
    res
      .status(200)
      .json(successResponse("Staff retrieved successfully", staff));
  } catch (error) {
    logger.error("Error retrieving staff:", error);
    res.status(500).json(errorResponse("Failed to retrieve staff"));
  }
};

/**
 * Get staff member by ID
 */
export const getStaffById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id;
    const staff = await staffService.getStaffById(id);

    if (!staff) {
      res.status(404).json(errorResponse("Staff member not found"));
      return;
    }

    res
      .status(200)
      .json(successResponse("Staff member retrieved successfully", staff));
  } catch (error) {
    logger.error(`Error retrieving staff member ${req.params.id}:`, error);
    res.status(500).json(errorResponse("Failed to retrieve staff member"));
  }
};

/**
 * Get all doctors (for appointment form)
 */
export const getDoctors = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const doctors = await staffService.getDoctors();
    res
      .status(200)
      .json(successResponse("Doctors retrieved successfully", doctors));
  } catch (error) {
    logger.error("Error retrieving doctors:", error);
    res.status(500).json(errorResponse("Failed to retrieve doctors"));
  }
};

/**
 * Get unique departments list
 */
export const getDepartments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const departments = await staffService.getDepartments();
    res
      .status(200)
      .json(successResponse("Departments retrieved successfully", departments));
  } catch (error) {
    logger.error("Error retrieving departments:", error);
    res.status(500).json(errorResponse("Failed to retrieve departments"));
  }
};

/**
 * Get staff statistics
 */
export const getStaffStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const stats = await staffService.getStaffStats();
    res
      .status(200)
      .json(successResponse("Staff statistics retrieved successfully", stats));
  } catch (error) {
    logger.error("Error retrieving staff statistics:", error);
    res.status(500).json(errorResponse("Failed to retrieve staff statistics"));
  }
};

/**
 * Search staff
 */
export const searchStaff = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const query = req.query.q as string;

    if (!query) {
      res.status(400).json(errorResponse("Search query is required"));
      return;
    }

    const staff = await staffService.searchStaff(query);
    res.status(200).json(successResponse("Staff search results", staff));
  } catch (error) {
    logger.error(`Error searching staff with query "${req.query.q}":`, error);
    res.status(500).json(errorResponse("Failed to search staff"));
  }
};

/**
 * Create staff member
 */
export const createStaff = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const newStaff = await staffService.createStaff(req.body);
    res
      .status(201)
      .json(successResponse("Staff member created successfully", newStaff));
  } catch (error) {
    logger.error("Error creating staff member:", error);

    if (error instanceof Error && error.message === "Email already exists") {
      res.status(400).json(errorResponse(error.message));
      return;
    }

    res.status(500).json(errorResponse("Failed to create staff member"));
  }
};

/**
 * Update staff member
 */
export const updateStaff = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id;
    const updatedStaff = await staffService.updateStaff(id, req.body);
    res
      .status(200)
      .json(successResponse("Staff member updated successfully", updatedStaff));
  } catch (error) {
    logger.error(`Error updating staff member ${req.params.id}:`, error);

    if (error instanceof Error) {
      if (error.message === "Staff member not found") {
        res.status(404).json(errorResponse(error.message));
        return;
      }

      if (error.message === "Email already exists") {
        res.status(400).json(errorResponse(error.message));
        return;
      }
    }

    res.status(500).json(errorResponse("Failed to update staff member"));
  }
};

/**
 * Delete staff member
 */
export const deleteStaff = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id;
    const deleted = await staffService.deleteStaff(id);

    if (!deleted) {
      res.status(404).json(errorResponse("Staff member not found"));
      return;
    }

    res.status(200).json(successResponse("Staff member deleted successfully"));
  } catch (error) {
    logger.error(`Error deleting staff member ${req.params.id}:`, error);

    if (error instanceof Error && error.message === "Staff member not found") {
      res.status(404).json(errorResponse(error.message));
      return;
    }

    res.status(500).json(errorResponse("Failed to delete staff member"));
  }
};
