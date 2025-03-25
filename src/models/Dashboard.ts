import db from "../config/database";
import { logger } from "../utils/logger";
import { DashboardStats, StaffPerformance } from "../types/dashboard";

/**
 * Get dashboard summary statistics
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // Get total patients
    const totalPatientsResult = db
      .prepare(
        `
      SELECT COUNT(*) as count FROM patients WHERE deletedAt IS NULL
    `
      )
      .get() as { count: number };

    // Get today's appointments count
    const today = new Date().toISOString().split("T")[0];
    const todayAppointmentsResult = db
      .prepare(
        `
      SELECT COUNT(*) as count FROM appointments 
      WHERE DATE(startTime) = DATE(?)
    `
      )
      .get(today) as { count: number };

    // Get pending invoices count
    const pendingInvoicesResult = db
      .prepare(
        `
      SELECT COUNT(*) as count FROM invoices 
      WHERE status IN ('draft', 'sent', 'overdue')
    `
      )
      .get() as { count: number };

    // Get monthly summary data
    const monthlySummaryQuery = `
      SELECT 
        strftime('%m', createdAt) as month,
        COUNT(*) as appointments
      FROM appointments
      WHERE createdAt >= date('now', '-6 months')
      GROUP BY strftime('%m', createdAt)
      ORDER BY month ASC
    `;
    const appointmentsByMonth = db.prepare(monthlySummaryQuery).all() as Array<{
      month: string;
      appointments: number;
    }>;

    // Get new patients by month
    const newPatientsQuery = `
      SELECT 
        strftime('%m', createdAt) as month,
        COUNT(*) as newPatients
      FROM patients
      WHERE createdAt >= date('now', '-6 months')
      GROUP BY strftime('%m', createdAt)
      ORDER BY month ASC
    `;
    const newPatientsByMonth = db.prepare(newPatientsQuery).all() as Array<{
      month: string;
      newPatients: number;
    }>;

    // Get revenue by month
    const revenueQuery = `
      SELECT 
        strftime('%m', createdAt) as month,
        SUM(totalAmount) as revenue
      FROM invoices
      WHERE createdAt >= date('now', '-6 months')
      GROUP BY strftime('%m', createdAt)
      ORDER BY month ASC
    `;
    const revenueByMonth = db.prepare(revenueQuery).all() as Array<{
      month: string;
      revenue: number;
    }>;

    // Get recent appointments
    const recentAppointmentsQuery = `
      SELECT 
        a.id, a.title, a.startTime, a.endTime, a.status, a.type,
        p.firstName || ' ' || p.lastName as patientName,
        s.firstName || ' ' || s.lastName as doctorName
      FROM appointments a
      LEFT JOIN patients p ON a.patientId = p.id
      LEFT JOIN staff s ON a.doctorId = s.id
      ORDER BY a.startTime DESC
      LIMIT 5
    `;
    const recentAppointments = db.prepare(recentAppointmentsQuery).all();

    // Format the results for the frontend
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // Create a map of all data by month
    const monthlySummary = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - 5 + i);
      const monthNum = date.getMonth();
      const monthStr = String(monthNum + 1).padStart(2, "0");

      // Find data for this month
      const appointments =
        appointmentsByMonth.find((m) => m.month === monthStr)?.appointments ||
        0;
      const newPatients =
        newPatientsByMonth.find((m) => m.month === monthStr)?.newPatients || 0;
      const revenue =
        revenueByMonth.find((m) => m.month === monthStr)?.revenue || 0;

      return {
        month: months[monthNum],
        appointments,
        newPatients,
        revenue,
      };
    });

    return {
      totalPatients: totalPatientsResult.count,
      todayAppointments: todayAppointmentsResult.count,
      pendingInvoices: pendingInvoicesResult.count,
      monthlySummary,
      recentAppointments,
    };
  } catch (error) {
    logger.error("Error getting dashboard stats:", error);
    throw new Error("Failed to retrieve dashboard statistics");
  }
};

/**
 * Get detailed patient statistics
 */
export const getPatientStats = async () => {
  try {
    // Get patient count by gender
    const genderDistributionQuery = `
      SELECT gender, COUNT(*) as count
      FROM patients
      WHERE deletedAt IS NULL
      GROUP BY gender
    `;
    const genderDistribution = db.prepare(genderDistributionQuery).all();

    // Get patient count by age group
    const ageGroupQuery = `
      SELECT 
        CASE 
          WHEN ((julianday('now') - julianday(dateOfBirth)) / 365.25) < 18 THEN 'Under 18'
          WHEN ((julianday('now') - julianday(dateOfBirth)) / 365.25) BETWEEN 18 AND 30 THEN '18-30'
          WHEN ((julianday('now') - julianday(dateOfBirth)) / 365.25) BETWEEN 31 AND 45 THEN '31-45'
          WHEN ((julianday('now') - julianday(dateOfBirth)) / 365.25) BETWEEN 46 AND 60 THEN '46-60'
          ELSE 'Over 60'
        END as ageGroup,
        COUNT(*) as count
      FROM patients
      WHERE deletedAt IS NULL
      GROUP BY ageGroup
      ORDER BY ageGroup
    `;
    const ageDistribution = db.prepare(ageGroupQuery).all();

    // Get new patients trend
    const newPatientsTrendQuery = `
      SELECT 
        strftime('%Y-%m', createdAt) as month,
        COUNT(*) as count
      FROM patients
      WHERE createdAt >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', createdAt)
      ORDER BY month ASC
    `;
    const newPatientsTrend = db.prepare(newPatientsTrendQuery).all();

    return {
      genderDistribution,
      ageDistribution,
      newPatientsTrend,
    };
  } catch (error) {
    logger.error("Error getting patient stats:", error);
    throw new Error("Failed to retrieve patient statistics");
  }
};

/**
 * Get appointment statistics
 */
export const getAppointmentStats = async (
  startDate?: string,
  endDate?: string
) => {
  try {
    const dateFilter =
      startDate && endDate ? `WHERE startTime BETWEEN ? AND ?` : "";
    const params = startDate && endDate ? [startDate, endDate] : [];

    // Get appointments by status
    const statusQuery = `
      SELECT status, COUNT(*) as count
      FROM appointments
      ${dateFilter}
      GROUP BY status
    `;
    const byStatus = db.prepare(statusQuery).all(...params);

    // Get appointments by type
    const typeQuery = `
      SELECT type, COUNT(*) as count
      FROM appointments
      ${dateFilter}
      GROUP BY type
    `;
    const byType = db.prepare(typeQuery).all(...params);

    // Get appointments by doctor
    const doctorQuery = `
      SELECT 
        a.doctorId,
        s.firstName || ' ' || s.lastName as doctorName,
        COUNT(*) as count
      FROM appointments a
      JOIN staff s ON a.doctorId = s.id
      ${dateFilter}
      GROUP BY a.doctorId
      ORDER BY count DESC
      LIMIT 5
    `;
    const byDoctor = db.prepare(doctorQuery).all(...params);

    // Get appointment trend
    const trendQuery = `
      SELECT 
        strftime('%Y-%m-%d', startTime) as date,
        COUNT(*) as count
      FROM appointments
      ${dateFilter}
      GROUP BY strftime('%Y-%m-%d', startTime)
      ORDER BY date ASC
    `;
    const trend = db.prepare(trendQuery).all(...params);

    return {
      byStatus,
      byType,
      byDoctor,
      trend,
    };
  } catch (error) {
    logger.error("Error getting appointment stats:", error);
    throw new Error("Failed to retrieve appointment statistics");
  }
};

/**
 * Get revenue statistics
 */
export const getRevenueStats = async (startDate?: string, endDate?: string) => {
  try {
    const dateFilter =
      startDate && endDate ? `WHERE createdAt BETWEEN ? AND ?` : "";
    const params = startDate && endDate ? [startDate, endDate] : [];

    // Get total revenue
    const totalRevenueQuery = `
      SELECT SUM(totalAmount) as total
      FROM invoices
      ${dateFilter}
    `;
    const totalRevenue = db.prepare(totalRevenueQuery).get(...params) as {
      total: number;
    };

    // Get revenue by status
    const statusQuery = `
      SELECT status, SUM(totalAmount) as total
      FROM invoices
      ${dateFilter}
      GROUP BY status
    `;
    const byStatus = db.prepare(statusQuery).all(...params);

    // Get revenue trend
    const trendQuery = `
      SELECT 
        strftime('%Y-%m', createdAt) as month,
        SUM(totalAmount) as total
      FROM invoices
      ${dateFilter || 'WHERE createdAt >= date("now", "-12 months")'}
      GROUP BY strftime('%Y-%m', createdAt)
      ORDER BY month ASC
    `;
    const trend = db.prepare(trendQuery).all(...params);

    return {
      totalRevenue: totalRevenue.total || 0,
      byStatus,
      trend,
    };
  } catch (error) {
    logger.error("Error getting revenue stats:", error);
    throw new Error("Failed to retrieve revenue statistics");
  }
};

/**
 * Get staff performance metrics
 */
export const getStaffPerformance = async (): Promise<StaffPerformance[]> => {
  try {
    const query = `
      SELECT 
        s.id as staffId,
        s.firstName || ' ' || s.lastName as name,
        (SELECT COUNT(DISTINCT patientId) FROM appointments WHERE doctorId = s.id) as patientsServed,
        (SELECT COUNT(*) FROM appointments WHERE doctorId = s.id AND status = 'completed') as appointmentsCompleted
      FROM staff s
      WHERE s.role = 'doctor'
      ORDER BY appointmentsCompleted DESC
      LIMIT 5
    `;

    return db.prepare(query).all() as StaffPerformance[];
  } catch (error) {
    logger.error("Error getting staff performance:", error);
    throw new Error("Failed to retrieve staff performance metrics");
  }
};

/**
 * Get recent activity feed
 */
export const getRecentActivity = async (limit: number = 10) => {
  try {
    // Combine recent activities from different tables
    const appointmentsActivity = db
      .prepare(
        `
      SELECT 
        a.id,
        'appointment' as type,
        a.title as description,
        a.createdAt as timestamp,
        p.firstName || ' ' || p.lastName as patientName,
        s.firstName || ' ' || s.lastName as staffName
      FROM appointments a
      LEFT JOIN patients p ON a.patientId = p.id
      LEFT JOIN staff s ON a.doctorId = s.id
      ORDER BY a.createdAt DESC
      LIMIT ?
    `
      )
      .all(limit) as any[];

    const patientActivity = db
      .prepare(
        `
      SELECT 
        p.id,
        'patient' as type,
        'New patient registered' as description,
        p.createdAt as timestamp,
        p.firstName || ' ' || p.lastName as patientName,
        NULL as staffName
      FROM patients p
      ORDER BY p.createdAt DESC
      LIMIT ?
    `
      )
      .all(limit) as any[];

    const invoiceActivity = db
      .prepare(
        `
      SELECT 
        i.id,
        'invoice' as type,
        'Invoice ' || i.status as description,
        i.createdAt as timestamp,
        p.firstName || ' ' || p.lastName as patientName,
        NULL as staffName
      FROM invoices i
      LEFT JOIN patients p ON i.patientId = p.id
      ORDER BY i.createdAt DESC
      LIMIT ?
    `
      )
      .all(limit) as any[];

    // Combine all activities and sort by timestamp
    const allActivities = [
      ...appointmentsActivity,
      ...patientActivity,
      ...invoiceActivity,
    ]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, limit);

    return allActivities;
  } catch (error) {
    logger.error("Error getting recent activity:", error);
    throw new Error("Failed to retrieve recent activity");
  }
};

export default {
  getDashboardStats,
  getPatientStats,
  getAppointmentStats,
  getRevenueStats,
  getStaffPerformance,
  getRecentActivity,
};
