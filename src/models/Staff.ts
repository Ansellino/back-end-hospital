import db from "../config/database";
import { logger } from "../utils/logger";
import {
  Staff,
  StaffRole,
  StaffStatus,
  WorkSchedule,
  Qualification,
} from "../types/staff";

/**
 * Create staff table in the database
 */
export const createStaffTable = async (): Promise<void> => {
  try {
    // Create main staff table
    db.exec(`
      CREATE TABLE IF NOT EXISTS staff (
        id TEXT PRIMARY KEY,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        contactNumber TEXT NOT NULL,
        role TEXT NOT NULL,
        specialization TEXT,
        department TEXT NOT NULL,
        joinDate TEXT NOT NULL,
        status TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Create work schedule table
    db.exec(`
      CREATE TABLE IF NOT EXISTS staff_schedule (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        staffId TEXT NOT NULL,
        day TEXT NOT NULL,
        startTime TEXT NOT NULL,
        endTime TEXT NOT NULL,
        FOREIGN KEY (staffId) REFERENCES staff (id) ON DELETE CASCADE
      )
    `);

    // Create qualifications table
    db.exec(`
      CREATE TABLE IF NOT EXISTS staff_qualifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        staffId TEXT NOT NULL,
        degree TEXT NOT NULL,
        institution TEXT NOT NULL,
        year TEXT NOT NULL,
        certification TEXT,
        FOREIGN KEY (staffId) REFERENCES staff (id) ON DELETE CASCADE
      )
    `);

    logger.info("Staff tables initialized");
  } catch (error) {
    logger.error("Error initializing staff tables:", error);
    throw new Error("Failed to initialize staff tables");
  }
};

/**
 * Get all staff members with optional filtering
 */
export const getAllStaff = (
  role?: StaffRole,
  department?: string,
  status?: StaffStatus,
  search?: string
): Staff[] => {
  try {
    let query = `
      SELECT * FROM staff 
      WHERE 1=1
    `;

    const params = [];

    if (role) {
      query += ` AND role = ?`;
      params.push(role);
    }

    if (department) {
      query += ` AND department = ?`;
      params.push(department);
    }

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (
        firstName LIKE ? OR 
        lastName LIKE ? OR 
        email LIKE ? OR 
        contactNumber LIKE ? OR 
        specialization LIKE ?
      )`;
      const searchParam = `%${search}%`;
      params.push(
        searchParam,
        searchParam,
        searchParam,
        searchParam,
        searchParam
      );
    }

    query += ` ORDER BY firstName ASC`;

    const staffList = db.prepare(query).all(...params);

    // Fetch related data for each staff member
    return staffList.map(enrichStaffWithRelatedData);
  } catch (error) {
    logger.error("Error getting all staff:", error);
    return [];
  }
};

/**
 * Get staff member by ID with all related data
 */
export const getStaffById = (id: string): Staff | null => {
  try {
    const query = `SELECT * FROM staff WHERE id = ?`;
    const staff = db.prepare(query).get(id);

    if (!staff) {
      return null;
    }

    return enrichStaffWithRelatedData(staff);
  } catch (error) {
    logger.error(`Error getting staff by ID ${id}:`, error);
    return null;
  }
};

/**
 * Get staff members by role
 */
export const getStaffByRole = (role: StaffRole): Staff[] => {
  try {
    const query = `SELECT * FROM staff WHERE role = ? ORDER BY firstName ASC`;
    const staffList = db.prepare(query).all(role);

    return staffList.map(enrichStaffWithRelatedData);
  } catch (error) {
    logger.error(`Error getting staff by role ${role}:`, error);
    return [];
  }
};

/**
 * Get staff members by department
 */
export const getStaffByDepartment = (department: string): Staff[] => {
  try {
    const query = `SELECT * FROM staff WHERE department = ? ORDER BY firstName ASC`;
    const staffList = db.prepare(query).all(department);

    return staffList.map(enrichStaffWithRelatedData);
  } catch (error) {
    logger.error(`Error getting staff by department ${department}:`, error);
    return [];
  }
};

/**
 * Create a new staff member with related data
 */
export const createStaff = (
  staffData: Omit<Staff, "id" | "createdAt" | "updatedAt">
): Staff | null => {
  try {
    const now = new Date().toISOString();
    const id = `staff-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Start a transaction
    const transaction = db.transaction(() => {
      // Insert main staff record
      db.prepare(
        `
        INSERT INTO staff (
          id, firstName, lastName, email, contactNumber,
          role, specialization, department, joinDate,
          status, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      ).run(
        id,
        staffData.firstName,
        staffData.lastName,
        staffData.email,
        staffData.contactNumber,
        staffData.role,
        staffData.specialization || null,
        staffData.department,
        staffData.joinDate,
        staffData.status,
        now,
        now
      );

      // Insert work schedule
      if (staffData.workSchedule && staffData.workSchedule.length > 0) {
        const insertSchedule = db.prepare(`
          INSERT INTO staff_schedule (
            staffId, day, startTime, endTime
          ) VALUES (?, ?, ?, ?)
        `);

        for (const schedule of staffData.workSchedule) {
          insertSchedule.run(
            id,
            schedule.day,
            schedule.startTime,
            schedule.endTime
          );
        }
      }

      // Insert qualifications
      if (staffData.qualifications && staffData.qualifications.length > 0) {
        const insertQualification = db.prepare(`
          INSERT INTO staff_qualifications (
            staffId, degree, institution, year, certification
          ) VALUES (?, ?, ?, ?, ?)
        `);

        for (const qualification of staffData.qualifications) {
          insertQualification.run(
            id,
            qualification.degree,
            qualification.institution,
            qualification.year,
            qualification.certification || null
          );
        }
      }

      return id;
    });

    // Execute transaction
    const newId = transaction();

    return getStaffById(newId as string);
  } catch (error) {
    logger.error("Error creating staff:", error);
    return null;
  }
};

/**
 * Update an existing staff member with related data
 */
export const updateStaff = (
  id: string,
  staffData: Partial<Omit<Staff, "id" | "createdAt" | "updatedAt">>
): Staff | null => {
  try {
    const staff = getStaffById(id);

    if (!staff) {
      return null;
    }

    const now = new Date().toISOString();

    // Start a transaction
    const transaction = db.transaction(() => {
      // Update main staff record if any main fields are provided
      if (
        Object.keys(staffData).some((key) =>
          [
            "firstName",
            "lastName",
            "email",
            "contactNumber",
            "role",
            "specialization",
            "department",
            "joinDate",
            "status",
          ].includes(key)
        )
      ) {
        const fields = [];
        const values = [];

        if (staffData.firstName !== undefined) {
          fields.push("firstName = ?");
          values.push(staffData.firstName);
        }

        if (staffData.lastName !== undefined) {
          fields.push("lastName = ?");
          values.push(staffData.lastName);
        }

        if (staffData.email !== undefined) {
          fields.push("email = ?");
          values.push(staffData.email);
        }

        if (staffData.contactNumber !== undefined) {
          fields.push("contactNumber = ?");
          values.push(staffData.contactNumber);
        }

        if (staffData.role !== undefined) {
          fields.push("role = ?");
          values.push(staffData.role);
        }

        if (staffData.specialization !== undefined) {
          fields.push("specialization = ?");
          values.push(staffData.specialization || null);
        }

        if (staffData.department !== undefined) {
          fields.push("department = ?");
          values.push(staffData.department);
        }

        if (staffData.joinDate !== undefined) {
          fields.push("joinDate = ?");
          values.push(staffData.joinDate);
        }

        if (staffData.status !== undefined) {
          fields.push("status = ?");
          values.push(staffData.status);
        }

        fields.push("updatedAt = ?");
        values.push(now);

        if (fields.length > 0) {
          const query = `
            UPDATE staff 
            SET ${fields.join(", ")} 
            WHERE id = ?
          `;

          db.prepare(query).run(...values, id);
        }
      }

      // Update work schedule if provided
      if (staffData.workSchedule) {
        // Delete existing schedules
        db.prepare(`DELETE FROM staff_schedule WHERE staffId = ?`).run(id);

        // Insert new schedules
        if (staffData.workSchedule.length > 0) {
          const insertSchedule = db.prepare(`
            INSERT INTO staff_schedule (
              staffId, day, startTime, endTime
            ) VALUES (?, ?, ?, ?)
          `);

          for (const schedule of staffData.workSchedule) {
            insertSchedule.run(
              id,
              schedule.day,
              schedule.startTime,
              schedule.endTime
            );
          }
        }
      }

      // Update qualifications if provided
      if (staffData.qualifications) {
        // Delete existing qualifications
        db.prepare(`DELETE FROM staff_qualifications WHERE staffId = ?`).run(
          id
        );

        // Insert new qualifications
        if (staffData.qualifications.length > 0) {
          const insertQualification = db.prepare(`
            INSERT INTO staff_qualifications (
              staffId, degree, institution, year, certification
            ) VALUES (?, ?, ?, ?, ?)
          `);

          for (const qualification of staffData.qualifications) {
            insertQualification.run(
              id,
              qualification.degree,
              qualification.institution,
              qualification.year,
              qualification.certification || null
            );
          }
        }
      }

      return id;
    });

    // Execute transaction
    transaction();

    return getStaffById(id);
  } catch (error) {
    logger.error(`Error updating staff ${id}:`, error);
    return null;
  }
};

/**
 * Delete a staff member and all related data
 */
export const deleteStaff = (id: string): boolean => {
  try {
    // Due to ON DELETE CASCADE, related records in child tables will be deleted automatically
    const result = db.prepare(`DELETE FROM staff WHERE id = ?`).run(id);
    return result.changes > 0;
  } catch (error) {
    logger.error(`Error deleting staff ${id}:`, error);
    return false;
  }
};

/**
 * Search staff by name, email, or contact number
 */
export const searchStaff = (query: string): Staff[] => {
  try {
    const searchQuery = `%${query}%`;

    const sql = `
      SELECT * FROM staff
      WHERE 
        firstName LIKE ? OR
        lastName LIKE ? OR
        email LIKE ? OR
        contactNumber LIKE ? OR
        specialization LIKE ? OR
        department LIKE ?
      ORDER BY firstName ASC
    `;

    const staffList = db
      .prepare(sql)
      .all(
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery
      );

    return staffList.map(enrichStaffWithRelatedData);
  } catch (error) {
    logger.error(`Error searching staff with query "${query}":`, error);
    return [];
  }
};

/**
 * Get staff counts by role (for dashboard statistics)
 */
export const getStaffCountsByRole = (): Record<StaffRole, number> => {
  try {
    const query = `
      SELECT role, COUNT(*) as count
      FROM staff
      GROUP BY role
    `;

    const results = db.prepare(query).all();

    // Initialize with all roles set to 0
    const counts: Record<StaffRole, number> = {
      doctor: 0,
      nurse: 0,
      admin: 0,
      receptionist: 0,
      pharmacist: 0,
    };

    // Update counts from database results
    results.forEach((result: any) => {
      counts[result.role as StaffRole] = result.count;
    });

    return counts;
  } catch (error) {
    logger.error("Error getting staff counts by role:", error);
    return {
      doctor: 0,
      nurse: 0,
      admin: 0,
      receptionist: 0,
      pharmacist: 0,
    };
  }
};

/**
 * Get all doctors (staff with role "doctor")
 */
export const getAllDoctors = (): Staff[] => {
  return getStaffByRole("doctor");
};

/**
 * Check if an email already exists in the database (for validation)
 */
export const emailExists = (email: string, excludeId?: string): boolean => {
  try {
    let query = `SELECT COUNT(*) as count FROM staff WHERE email = ?`;
    const params = [email];

    if (excludeId) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }

    // Add type assertion to the query result
    const result = db.prepare(query).get(...params) as { count: number };
    return result.count > 0;
  } catch (error) {
    logger.error(`Error checking if email ${email} exists:`, error);
    return false;
  }
};

/**
 * Helper function to fetch and add related data to a staff record
 */
const enrichStaffWithRelatedData = (staff: any): Staff => {
  try {
    // Get work schedule
    const scheduleQuery = `
      SELECT day, startTime, endTime 
      FROM staff_schedule 
      WHERE staffId = ?
      ORDER BY 
        CASE 
          WHEN day = 'monday' THEN 1
          WHEN day = 'tuesday' THEN 2
          WHEN day = 'wednesday' THEN 3
          WHEN day = 'thursday' THEN 4
          WHEN day = 'friday' THEN 5
          WHEN day = 'saturday' THEN 6
          WHEN day = 'sunday' THEN 7
        END
    `;

    const workSchedule = db.prepare(scheduleQuery).all(staff.id);

    // Get qualifications
    const qualificationsQuery = `
      SELECT degree, institution, year, certification
      FROM staff_qualifications
      WHERE staffId = ?
      ORDER BY year DESC
    `;

    const qualifications = db.prepare(qualificationsQuery).all(staff.id);

    return {
      ...staff,
      workSchedule: workSchedule as WorkSchedule[],
      qualifications: qualifications as Qualification[],
    };
  } catch (error) {
    logger.error(`Error enriching staff data for ${staff?.id}:`, error);
    return {
      ...staff,
      workSchedule: [],
      qualifications: [],
    };
  }
};

export default {
  createStaffTable,
  getAllStaff,
  getStaffById,
  getStaffByRole,
  getStaffByDepartment,
  createStaff,
  updateStaff,
  deleteStaff,
  searchStaff,
  getStaffCountsByRole,
  getAllDoctors,
  emailExists,
};
