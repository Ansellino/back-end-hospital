/**
 * Dashboard related types
 */

// Overall dashboard statistics
export interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  pendingInvoices: number;
  monthlySummary: MonthlySummary[];
  recentAppointments?: any[];
  staffPerformance?: StaffPerformance[];
  inventoryAlerts?: InventoryAlert[];
}

// Monthly summary data
export interface MonthlySummary {
  month: string;
  appointments: number;
  newPatients: number;
  revenue: number;
}

// Staff performance metrics
export interface StaffPerformance {
  staffId: string | number;
  name: string;
  patientsServed: number;
  appointmentsCompleted: number;
}

// Inventory alert
export interface InventoryAlert {
  id: string;
  name: string;
  currentStock: number;
  reorderLevel: number;
  status: "critical" | "low" | "expiring";
}

// Recent activity item
export interface ActivityItem {
  id: string | number;
  type: "appointment" | "patient" | "invoice" | "medical-record";
  description: string;
  timestamp: string;
  patientName?: string;
  staffName?: string;
}
