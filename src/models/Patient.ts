import db from "../config/database";
import {
  Patient,
  PatientWithMetadata,
  CreatePatientRequest,
  UpdatePatientRequest,
} from "../types/patient";
import { logger } from "../utils/logger";

/**
 * Initialize patients table if it doesn't exist
 */
export const createPatientsTable = async (): Promise<void> => {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        dateOfBirth TEXT NOT NULL,
        gender TEXT NOT NULL,
        contactNumber TEXT,
        email TEXT,
        address TEXT,
        emergencyContactName TEXT,
        emergencyContactNumber TEXT,
        bloodType TEXT,
        allergies TEXT,
        medicalHistory TEXT,
        insuranceProvider TEXT,
        insurancePolicyNumber TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);
    logger.info("Patients table initialized");
  } catch (error) {
    logger.error("Error initializing patients table:", error);
    throw new Error("Failed to initialize patients table");
  }
};

/**
 * Find patient by ID
 */
export const findById = async (id: number): Promise<Patient | null> => {
  try {
    const result = db
      .prepare("SELECT * FROM patients WHERE id = ?")
      .get(id) as any;

    if (!result) return null;

    return formatPatientFromDb(result);
  } catch (error) {
    logger.error(`Error finding patient with ID ${id}:`, error);
    return null;
  }
};

/**
 * Find all patients
 */
export const findAll = async (): Promise<Patient[]> => {
  try {
    const results = db
      .prepare("SELECT * FROM patients ORDER BY lastName, firstName")
      .all() as any[];

    return results.map(formatPatientFromDb);
  } catch (error) {
    logger.error("Error finding all patients:", error);
    return [];
  }
};

/**
 * Find patients by specific criteria
 */
export const findByCriteria = async (
  criteria: Partial<Patient>
): Promise<Patient[]> => {
  try {
    const keys = Object.keys(criteria).filter(
      (key) => criteria[key as keyof Patient] !== undefined
    );

    if (keys.length === 0) return findAll();

    const whereClause = keys.map((key) => `${key} = ?`).join(" AND ");
    const values = keys
      .map((key) => criteria[key as keyof Patient])
      .filter((v) => v !== undefined);

    const results = db
      .prepare(`SELECT * FROM patients WHERE ${whereClause}`)
      .all(...values) as any[];

    return results.map(formatPatientFromDb);
  } catch (error) {
    logger.error("Error finding patients by criteria:", error);
    return [];
  }
};

/**
 * Search patients by name, email, or contact number
 */
export const searchPatients = async (
  searchTerm: string
): Promise<Patient[]> => {
  try {
    const searchPattern = `%${searchTerm}%`;
    const results = db
      .prepare(
        `SELECT * FROM patients 
         WHERE firstName LIKE ? 
         OR lastName LIKE ? 
         OR email LIKE ? 
         OR contactNumber LIKE ?
         ORDER BY lastName, firstName`
      )
      .all(searchPattern, searchPattern, searchPattern, searchPattern) as any[];

    return results.map(formatPatientFromDb);
  } catch (error) {
    logger.error(`Error searching patients with term '${searchTerm}':`, error);
    return [];
  }
};

/**
 * Create a new patient
 */
export const create = async (
  patientData: CreatePatientRequest
): Promise<Patient | null> => {
  try {
    const now = new Date().toISOString();

    // Use type assertion to handle missing fields safely
    const data = patientData as any;

    const info = db
      .prepare(
        `INSERT INTO patients (
          firstName, lastName, dateOfBirth, gender, 
          contactNumber, email, address, emergencyContactName,
          emergencyContactNumber, bloodType, allergies, 
          medicalHistory, insuranceProvider, insurancePolicyNumber,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
      .run(
        data.firstName,
        data.lastName,
        data.dateOfBirth,
        data.gender,
        data.contactNumber || null,
        data.email || null,
        data.address || null,
        data.emergencyContactName || null,
        data.emergencyContactNumber || null,
        data.bloodType || null,
        data.allergies || null,
        data.medicalHistory || null,
        data.insuranceProvider || null,
        data.insurancePolicyNumber || null,
        now,
        now
      );

    return findById(info.lastInsertRowid as number);
  } catch (error) {
    logger.error("Error creating patient:", error);
    return null;
  }
};

/**
 * Update an existing patient
 */
export const update = async (
  id: number,
  patientData: UpdatePatientRequest
): Promise<Patient | null> => {
  try {
    const patient = await findById(id);
    if (!patient) return null;

    const now = new Date().toISOString();

    // Build the SET clause dynamically based on provided fields
    const updates: Record<string, any> = {};

    if (patientData.firstName !== undefined)
      updates.firstName = patientData.firstName;
    if (patientData.lastName !== undefined)
      updates.lastName = patientData.lastName;
    if (patientData.dateOfBirth !== undefined)
      updates.dateOfBirth = patientData.dateOfBirth;
    if (patientData.gender !== undefined) updates.gender = patientData.gender;
    if (patientData.contactNumber !== undefined)
      updates.contactNumber = patientData.contactNumber;
    if (patientData.email !== undefined) updates.email = patientData.email;
    if (patientData.address !== undefined)
      updates.address = patientData.address;
    if (patientData.emergencyContactName !== undefined)
      updates.emergencyContactName = patientData.emergencyContactName;
    if (patientData.emergencyContactNumber !== undefined)
      updates.emergencyContactNumber = patientData.emergencyContactNumber;
    if (patientData.bloodType !== undefined)
      updates.bloodType = patientData.bloodType;
    if (patientData.allergies !== undefined)
      updates.allergies = patientData.allergies;
    if (patientData.medicalHistory !== undefined)
      updates.medicalHistory = patientData.medicalHistory;
    if (patientData.insuranceProvider !== undefined)
      updates.insuranceProvider = patientData.insuranceProvider;
    if (patientData.insurancePolicyNumber !== undefined)
      updates.insurancePolicyNumber = patientData.insurancePolicyNumber;

    updates.updatedAt = now;

    if (Object.keys(updates).length === 1) {
      // Only updatedAt was set, no real updates
      return patient;
    }

    const setClause = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");

    const values = Object.values(updates);
    values.push(id);

    db.prepare(`UPDATE patients SET ${setClause} WHERE id = ?`).run(...values);

    return findById(id);
  } catch (error) {
    logger.error(`Error updating patient ${id}:`, error);
    return null;
  }
};

/**
 * Delete a patient
 */
export const remove = async (id: number): Promise<boolean> => {
  try {
    const result = db.prepare("DELETE FROM patients WHERE id = ?").run(id);
    return result.changes > 0;
  } catch (error) {
    logger.error(`Error deleting patient ${id}:`, error);
    return false;
  }
};

/**
 * Get patient count
 */
export const count = (): number => {
  try {
    const result = db
      .prepare("SELECT COUNT(*) as count FROM patients")
      .get() as { count: number };
    return result.count;
  } catch (error) {
    logger.error("Error counting patients:", error);
    return 0;
  }
};

/**
 * Format patient object from database
 */
const formatPatientFromDb = (dbPatient: any): Patient => {
  return {
    id: dbPatient.id,
    firstName: dbPatient.firstName,
    lastName: dbPatient.lastName,
    dateOfBirth: dbPatient.dateOfBirth,
    gender: dbPatient.gender,
    contactNumber: dbPatient.contactNumber || "",
    email: dbPatient.email || "",
    address: dbPatient.address || "",
    emergencyContactName: dbPatient.emergencyContactName || "",
    emergencyContactNumber: dbPatient.emergencyContactNumber || "",
    bloodType: dbPatient.bloodType || "",
    allergies: dbPatient.allergies || "",
    medicalHistory: dbPatient.medicalHistory || "",
    insuranceProvider: dbPatient.insuranceProvider || "",
    insurancePolicyNumber: dbPatient.insurancePolicyNumber || "",
    createdAt: dbPatient.createdAt,
    updatedAt: dbPatient.updatedAt,
  };
};

/**
 * Get patient with additional metadata (age, appointment count, etc.)
 */
export const getPatientWithMetadata = async (
  id: number
): Promise<PatientWithMetadata | null> => {
  const patient = await findById(id);
  if (!patient) return null;

  // Calculate age
  const birthDate = new Date(patient.dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  // In a real implementation, you would query related tables for this data
  return {
    ...patient,
    fullName: `${patient.firstName} ${patient.lastName}`,
    age,
    medicalRecordCount: 0, // Placeholder - would come from medical_records table
    appointmentCount: 0, // Placeholder - would come from appointments table
    lastVisit: null, // Placeholder - would come from appointments table
  };
};

export default {
  createPatientsTable,
  findById,
  findAll,
  findByCriteria,
  searchPatients,
  create,
  update,
  remove,
  count,
  getPatientWithMetadata,
};
