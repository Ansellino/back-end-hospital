/**
 * Authentication related types for the healthcare management system
 */
import { User as BaseUser, SafeUser } from "./user";

// Token payload structure - what's encoded in the JWT
export interface TokenPayload {
  userId: number; // Changed from id to userId to match controller
  email: string;
  role: string;
  [key: string]: any;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: TokenPayload;
  }
}

// Re-export the User type from user.ts
export type { User, SafeUser } from "./user";

// Login request from frontend
export interface LoginRequest {
  email: string;
  password: string;
}

// Login response to frontend
export interface LoginResponse {
  user: SafeUser;
  token: string;
}

// Frontend-aligned role definitions
export enum UserRole {
  ADMIN = "admin",
  DOCTOR = "doctor",
  NURSE = "nurse",
  RECEPTIONIST = "receptionist",
  BILLING = "billing",
  PATIENT = "patient",
}

// Permission definitions matching the frontend expectations
export enum Permission {
  // Patient permissions
  VIEW_PATIENTS = "view:patients",
  CREATE_PATIENTS = "create:patients",
  EDIT_PATIENTS = "edit:patients",
  DELETE_PATIENTS = "delete:patients",

  // Appointment permissions
  VIEW_APPOINTMENTS = "view:appointments",
  CREATE_APPOINTMENTS = "create:appointments",
  EDIT_APPOINTMENTS = "edit:appointments",
  DELETE_APPOINTMENTS = "delete:appointments",

  // Medical record permissions
  VIEW_RECORDS = "view:records",
  CREATE_RECORDS = "create:records",
  EDIT_RECORDS = "edit:records",

  // Admin permissions
  MANAGE_USERS = "manage:users",
  SYSTEM_SETTINGS = "system:settings",
}

// Default permission sets for different roles
export const DEFAULT_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: Object.values(Permission),
  [UserRole.DOCTOR]: [
    Permission.VIEW_PATIENTS,
    Permission.EDIT_PATIENTS,
    Permission.VIEW_APPOINTMENTS,
    Permission.CREATE_APPOINTMENTS,
    Permission.EDIT_APPOINTMENTS,
    Permission.DELETE_APPOINTMENTS,
    Permission.VIEW_RECORDS,
    Permission.CREATE_RECORDS,
    Permission.EDIT_RECORDS,
  ],
  [UserRole.NURSE]: [
    Permission.VIEW_PATIENTS,
    Permission.EDIT_PATIENTS,
    Permission.VIEW_APPOINTMENTS,
    Permission.EDIT_APPOINTMENTS,
    Permission.VIEW_RECORDS,
    Permission.CREATE_RECORDS,
  ],
  [UserRole.RECEPTIONIST]: [
    Permission.VIEW_PATIENTS,
    Permission.CREATE_PATIENTS,
    Permission.EDIT_PATIENTS,
    Permission.VIEW_APPOINTMENTS,
    Permission.CREATE_APPOINTMENTS,
    Permission.EDIT_APPOINTMENTS,
  ],
  [UserRole.BILLING]: [Permission.VIEW_PATIENTS, Permission.VIEW_APPOINTMENTS],
  [UserRole.PATIENT]: [Permission.VIEW_APPOINTMENTS],
};
