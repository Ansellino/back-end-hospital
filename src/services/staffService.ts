import staffModel from "../models/Staff";
import { Staff, StaffRole, StaffStatus } from "../types/staff";
import { logger } from "../utils/logger";

/**
 * Get all staff members with optional filtering
 */
export const getAllStaff = async (
  role?: StaffRole,
  department?: string,
  status?: StaffStatus,
  search?: string
): Promise<Staff[]> => {
  try {
    return staffModel.getAllStaff(role, department, status, search);
  } catch (error) {
    logger.error("Error in staffService.getAllStaff", { error });
    throw new Error("Failed to retrieve staff members");
  }
};

/**
 * Get staff member by ID
 */
export const getStaffById = async (id: string): Promise<Staff | null> => {
  try {
    return staffModel.getStaffById(id);
  } catch (error) {
    logger.error(`Error in staffService.getStaffById for ID ${id}`, { error });
    throw new Error("Failed to retrieve staff member");
  }
};

/**
 * Get all doctors (for appointment forms)
 */
export const getDoctors = async (): Promise<Staff[]> => {
  try {
    return staffModel.getAllDoctors();
  } catch (error) {
    logger.error("Error in staffService.getDoctors", { error });
    throw new Error("Failed to retrieve doctors");
  }
};

/**
 * Get unique departments list
 */
export const getDepartments = async (): Promise<string[]> => {
  try {
    const staff = await staffModel.getAllStaff();
    const departments = [...new Set(staff.map(s => s.department))];
    return departments;
  } catch (error) {
    logger.error("Error in staffService.getDepartments", { error });
    throw new Error("Failed to retrieve departments");
  }
};

/**
 * Search staff by query
 */
export const searchStaff = async (query: string): Promise<Staff[]> => {
  try {
    return staffModel.searchStaff(query);
  } catch (error) {
    logger.error(`Error in staffService.searchStaff for query "${query}"`, { error });
    throw new Error("Failed to search staff members");
  }
};

/**
 * Create a new staff member
 */
export const createStaff = async (
  staffData: Omit<Staff, "id" | "createdAt" | "updatedAt">
): Promise<Staff> => {
  try {
    // Check if email already exists
    if (staffModel.emailExists(staffData.email)) {
      throw new Error("Email already exists");
    }

    const newStaff = staffModel.createStaff(staffData);
    if (!newStaff) {
      throw new Error("Failed to create staff member");
    }
    
    return newStaff;
  } catch (error) {
    logger.error("Error in staffService.createStaff", { error });
    throw error;
  }
};

/**
 * Update an existing staff member
 */
export const updateStaff = async (
  id: string,
  staffData: Partial<Omit<Staff, "id" | "createdAt" | "updatedAt">>
): Promise<Staff> => {
  try {
    // Check if staff exists
    const existingStaff = staffModel.getStaffById(id);
    if (!existingStaff) {
      throw new Error("Staff member not found");
    }

    // Check if email is being updated and already exists
    if (staffData.email && 
        staffData.email !== existingStaff.email && 
        staffModel.emailExists(staffData.email, id)) {
      throw new Error("Email already exists");
    }

    const updatedStaff = staffModel.updateStaff(id, staffData);
    if (!updatedStaff) {
      throw new Error("Failed to update staff member");
    }
    
    return updatedStaff;
  } catch (error) {
    logger.error(`Error in staffService.updateStaff for ID ${id}`, { error });
    throw error;
  }
};

/**
 * Delete a staff member
 */
export const deleteStaff = async (id: string): Promise<boolean> => {
  try {
    // Check if staff exists
    const existingStaff = staffModel.getStaffById(id);
    if (!existingStaff) {
      throw new Error("Staff member not found");
    }

    return staffModel.deleteStaff(id);
  } catch (error) {
    logger.error(`Error in staffService.deleteStaff for ID ${id}`, { error });
    throw error;
  }
};

/**
 * Get staff statistics for dashboard
 */
export const getStaffStats = async () => {
  try {
    const countsByRole = staffModel.getStaffCountsByRole();
    
    // Get total staff count
    const totalStaff = Object.values(countsByRole).reduce((sum, count) => sum + count, 0);
    
    // Get staff by status
    const allStaff = staffModel.getAllStaff();
    const statusCounts = {
      active: allStaff.filter(s => s.status === 'active').length,
      inactive: allStaff.filter(s => s.status === 'inactive').length,
      onLeave: allStaff.filter(s => s.status === 'on-leave').length
    };
    
    // Get newest staff members (joined in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentStaff = allStaff.filter(s => {
      const joinDate = new Date(s.joinDate);
      return joinDate >= thirtyDaysAgo;
    });
    
    return {
      totalStaff,
      countsByRole,
      statusCounts,
      recentStaffCount: recentStaff.length
    };
  } catch (error) {
    logger.error("Error in staffService.getStaffStats", { error });
    throw new Error("Failed to retrieve staff statistics");
  }
};

export default {
  getAllStaff,
  getStaffById,
  getDoctors,
  getDepartments,
  searchStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  getStaffStats
};