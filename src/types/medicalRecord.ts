/**
 * Electronic Medical Record (EMR) related types for the healthcare management system
 */

// Vital signs interface
export interface VitalSigns {
  id?: number;
  medicalRecordId?: number;
  temperature: number; // in Celsius
  bloodPressureSystolic: number; // in mmHg
  bloodPressureDiastolic: number; // in mmHg
  heartRate: number; // in BPM
  respiratoryRate: number; // breaths per minute
  oxygenSaturation: number; // percentage
  height: number; // in cm
  weight: number; // in kg
  bmi?: number; // calculated field
  painLevel?: number; // scale 0-10
  glucoseLevel?: number; // mg/dL
  recordedAt?: string; // ISO date string
  createdAt?: string;
  updatedAt?: string;
}

// Diagnosis interface
export interface Diagnosis {
  id?: number;
  medicalRecordId?: number;
  name: string;
  icdCode?: string;
  description?: string;
  type: "primary" | "secondary" | "tertiary";
  status: "active" | "resolved" | "recurring";
  notes?: string;
  onsetDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Prescribed medication interface
export interface PrescribedMedication {
  id?: number;
  medicalRecordId?: number;
  treatmentId?: number;
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  startDate: string;
  endDate?: string;
  instructions?: string;
  isActive: boolean;
  reason?: string;
  prescribedBy?: number; // Doctor ID
  createdAt?: string;
  updatedAt?: string;
}

// Medical procedure interface
export interface Procedure {
  id?: number;
  medicalRecordId?: number;
  treatmentId?: number;
  name: string;
  cptCode?: string;
  description?: string;
  performedDate?: string;
  performedBy?: number; // Staff ID
  notes?: string;
  status: "scheduled" | "completed" | "cancelled";
  result?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Treatment plan interface
export interface Treatment {
  id?: number;
  medicalRecordId?: number;
  medications: PrescribedMedication[];
  procedures: Procedure[];
  instructions: string;
  followUpDate?: string;
  createdBy?: number; // Staff ID
  createdAt?: string;
  updatedAt?: string;
}

// Medical record attachment interface
export interface Attachment {
  id?: number;
  medicalRecordId: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  description?: string;
  uploadedBy?: number; // Staff ID
  uploadedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

// Allergy interface
export interface Allergy {
  id?: number;
  patientId: number;
  allergen: string;
  reaction: string;
  severity: "mild" | "moderate" | "severe" | "life-threatening";
  status: "active" | "inactive";
  onsetDate?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Lab result interface
export interface LabResult {
  id?: number;
  medicalRecordId: number;
  testName: string;
  testCode?: string;
  result: string;
  unit?: string;
  referenceRange?: string;
  status: "pending" | "completed" | "cancelled";
  abnormal: boolean;
  performedAt: string;
  performedBy?: string;
  orderedBy?: number; // Doctor ID
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Complete medical record interface
export interface MedicalRecord {
  id?: number;
  patientId: number;
  doctorId: number;
  visitType:
    | "initial"
    | "follow-up"
    | "emergency"
    | "routine"
    | "specialist"
    | "telehealth";
  visitDate: string;
  chiefComplaint: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  vitalSigns: VitalSigns;
  diagnoses: Diagnosis[];
  treatment: Treatment;
  labResults?: LabResult[];
  attachments?: Attachment[];
  status: "draft" | "completed" | "signed" | "amended";
  createdAt?: string;
  updatedAt?: string;
}

// Medical history interface
export interface MedicalHistory {
  id?: number;
  patientId: number;
  condition: string;
  diagnosedAt?: string;
  status: "active" | "resolved" | "recurring";
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Medical summary with patient information for UI display
export interface MedicalRecordWithPatient extends MedicalRecord {
  patientName?: string;
  patientAge?: number;
  patientGender?: string;
  doctorName?: string;
}
