/* 
Staff-related interfaces for the healthcare management system:

Used in components:
- StaffDirectory - List all staff members
- StaffDetail - View staff information 
- StaffForm - Create/edit staff information
- ScheduleManager - Manage staff schedules
- Dashboard - Display staff performance metrics
*/

// Main staff interface
export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  role: StaffRole;
  specialization?: string;
  department: string;
  joinDate: string;
  workSchedule: WorkSchedule[];
  qualifications: Qualification[];
  status: StaffStatus;
  createdAt: string;
  updatedAt: string;
}

// Staff roles
export type StaffRole =
  | "doctor"
  | "nurse"
  | "admin"
  | "receptionist"
  | "pharmacist";

// Staff status options
export type StaffStatus = "active" | "inactive" | "on-leave";

// Work schedule entry
export interface WorkSchedule {
  day: WeekDay;
  startTime: string;
  endTime: string;
}

// Days of the week
export type WeekDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

// Professional qualification
export interface Qualification {
  degree: string;
  institution: string;
  year: string;
  certification?: string;
}

// API response interfaces
export interface StaffResponse {
  success: boolean;
  data: Staff;
  message: string;
}

export interface StaffListResponse {
  success: boolean;
  data: Staff[];
  message: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

// Performance metrics for dashboard
export interface StaffPerformance {
  staffId: string;
  name: string;
  patientsServed: number;
  appointmentsCompleted: number;
  satisfaction?: number;
}

// Staff filter options
export interface StaffFilter {
  role?: StaffRole;
  department?: string;
  status?: StaffStatus;
  search?: string;
}

// Department options (used in forms)
export const DEPARTMENTS = [
  "Cardiology",
  "Dermatology",
  "Emergency",
  "General Medicine",
  "Neurology",
  "Obstetrics",
  "Oncology",
  "Ophthalmology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Radiology",
  "Surgery",
  "Administration",
];

// Helper function to get full name
export const getStaffFullName = (staff: Staff): string => {
  return `${staff.role === "doctor" ? "Dr. " : ""}${staff.firstName} ${
    staff.lastName
  }`;
};
