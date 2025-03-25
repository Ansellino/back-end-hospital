/**
 * Patient related types for the healthcare management system
 */

// Base patient interface
export interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  contactNumber: string;
  email: string;
  address: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  bloodType: string;
  allergies: string;
  medicalHistory: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  createdAt: string;
  updatedAt: string;
}

// Extended patient interface with computed properties for UI
export interface PatientWithMetadata extends Patient {
  fullName?: string;
  age?: number;
  medicalRecordCount?: number;
  appointmentCount?: number;
  lastVisit?: string | null;
}

// Create patient request
export interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  contactNumber?: string;
  email?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  bloodType?: string;
  allergies?: string;
  medicalHistory?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
}

// Update patient request - making all fields optional
export interface UpdatePatientRequest {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  contactNumber?: string;
  email?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  bloodType?: string;
  allergies?: string;
  medicalHistory?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
}

// Patient response from API
export interface PatientResponse {
  success: boolean;
  data: Patient | PatientWithMetadata;
  message: string;
}

// Patient list response from API
export interface PatientListResponse {
  success: boolean;
  data: Patient[] | PatientWithMetadata[];
  message: string;
  meta?: {
    total: number;
    page?: number;
    limit?: number;
  };
}

// Gender options
export const GENDER_OPTIONS = ["male", "female", "other", "prefer not to say"];

// Patient filter options
export interface PatientFilterOptions {
  search?: string;
  gender?: string;
  ageMin?: number;
  ageMax?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// Helper functions
export const getPatientFullName = (patient: Patient): string => {
  return `${patient.firstName} ${patient.lastName}`;
};

export const getPatientAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);

  let age = today.getFullYear() - birthDate.getFullYear();
  const month = today.getMonth() - birthDate.getMonth();

  if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};
