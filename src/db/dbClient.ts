import db from "../config/database";

/**
 * Database row type definitions for better type safety throughout the application
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
  contactNumber: string | null;
  email: string | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactNumber: string | null;
  bloodType: string | null;
  allergies: string | null;
  medicalHistory: string | null;
  insuranceProvider: string | null;
  insurancePolicyNumber: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// Staff table row structure
export interface DbStaffRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string | null;
  role: string;
  specialization: string | null;
  department: string | null;
  joinDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Staff qualifications row structure
export interface DbStaffQualificationRow {
  id: number;
  staffId: string;
  degree: string;
  institution: string;
  year: number;
  certification: string | null;
}

// Staff schedule row structure
export interface DbStaffScheduleRow {
  id: number;
  staffId: string;
  day: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
}

// Appointment table row structure
export interface DbAppointmentRow {
  id: number;
  patientId: number;
  doctorId: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  type: string;
  notes: string | null;
  location: string | null;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
}

// Medical records table row structure
export interface DbMedicalRecordRow {
  id: number;
  patientId: number;
  doctorId: string;
  appointmentId: number | null;
  visitDate: string;
  chiefComplaint: string;
  diagnosis: string | null;
  treatment: string | null;
  notes: string | null;
  followUpRecommended: number; // SQLite boolean as integer (0/1)
  followUpDate: string | null;
  vitals: string | null; // JSON string
  createdAt: string;
  updatedAt: string;
}

// Vital signs table row structure
export interface DbVitalSignsRow {
  id: number;
  patientId: number;
  appointmentId: number | null;
  medicalRecordId: number | null;
  temperature: string | null;
  heartRate: string | null;
  bloodPressure: string | null;
  respiratoryRate: string | null;
  oxygenSaturation: string | null;
  weight: number | null;
  height: number | null;
  recordedAt: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// Diagnoses table row structure
export interface DbDiagnosisRow {
  id: number;
  patientId: number;
  appointmentId: number | null;
  medicalRecordId: number | null;
  doctorId: string;
  diagnosisCode: string | null;
  description: string;
  diagnosisDate: string;
  createdAt: string;
  updatedAt: string;
}

// Medications table row structure
export interface DbMedicationRow {
  id: number;
  patientId: number;
  medicalRecordId: number | null;
  doctorId: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate: string | null;
  instructions: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Procedures table row structure
export interface DbProcedureRow {
  id: number;
  patientId: number;
  appointmentId: number | null;
  doctorId: string;
  name: string;
  procedureCode: string | null;
  description: string | null;
  procedureDate: string;
  notes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Treatment instructions table row structure
export interface DbTreatmentInstructionRow {
  id: number;
  patientId: number;
  procedureId: number | null;
  instructions: string;
  followUp: string | null;
  createdAt: string;
  updatedAt: string;
}

// Attachments table row structure
export interface DbAttachmentRow {
  id: number;
  medicalRecordId: number;
  name: string;
  type: string;
  url: string;
  uploadedOn: string;
}

// Invoices table row structure
export interface DbInvoiceRow {
  id: string;
  patientId: number;
  appointmentId: string | null;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  status: string;
  dueDate: string;
  paidDate: string | null;
  paymentMethod: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// Invoice items table row structure
export interface DbInvoiceItemRow {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  serviceCode: string | null;
  taxRate: number | null;
  createdAt: string;
  updatedAt: string;
}

// Payments table row structure
export interface DbPaymentRow {
  id: string;
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  transactionId: string | null;
  notes: string | null;
  processedBy: string;
  processedDate: string;
  createdAt: string;
  updatedAt: string;
}

// Notifications table row structure
export interface DbNotificationRow {
  id: number;
  userId: number;
  type: string;
  title: string;
  content: string;
  isRead: number; // SQLite boolean as integer (0/1)
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Notification preferences table row structure
export interface DbNotificationPreferencesRow {
  id: number;
  userId: number;
  email: number; // SQLite boolean as integer (0/1)
  sms: number; // SQLite boolean as integer (0/1)
  push: number; // SQLite boolean as integer (0/1)
  appointmentReminders: number; // SQLite boolean as integer (0/1)
  patientUpdates: number; // SQLite boolean as integer (0/1)
  billingAlerts: number; // SQLite boolean as integer (0/1)
  systemUpdates: number; // SQLite boolean as integer (0/1)
  newFeatures: number; // SQLite boolean as integer (0/1)
  createdAt: string;
  updatedAt: string;
}

// Common result types
export interface CountResult {
  count: number;
}

export interface RowIdResult {
  id: number;
}

// Export database instance
export default db;
