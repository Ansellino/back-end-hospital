import db from "../config/database";

/**
 * Database row type definitions for better type safety
 */

// User table row structure
export interface DbUserRow {
  id: number;
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string | null;
  staffId: string | null;
  createdAt: string;
  updatedAt: string;
}

// Patient table row structure
export interface DbPatientRow {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  contactNumber: string;
  email: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

// Common result types
export interface CountResult {
  count: number;
}

export default db;
