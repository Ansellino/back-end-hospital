// src/routes/index.ts
import { Router } from "express";
import authRoutes from "./authRoutes";
import patientRoutes from "./patientRoutes";
import appointmentRoutes from "./appointmentRoutes";
import staffRoutes from "./staffRoutes";
import medicalRecordRoutes from "./medicalRecordRoutes";
import billingRouter from "./billingRoutes";
import notificationRoutes from "./notificationRoutes";
import dashboardRoutes from "./dashboardRoutes";
// Import other routes here

const router = Router();

// Root API route - add this
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Healthcare Management System API",
    version: "1.0.0",
    documentation: "/api/docs",
  });
});

// Public routes
router.use("/auth", authRoutes);

// Protected routes
router.use("/patients", patientRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/staff", staffRoutes);
router.use("/medical-records", medicalRecordRoutes);
router.use("/billing", billingRouter);
router.use("/notifications", notificationRoutes);
router.use("/dashboard", dashboardRoutes);
// Register other routes here

export default router;
