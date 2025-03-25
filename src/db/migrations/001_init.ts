import db from "../../config/database";
import { createUsersTable } from "../../models/User";

export const up = () => {
  // Create users table (uses the existing function from User model)
  createUsersTable();

  // Create patients table
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
      updatedAt TEXT NOT NULL,
      deletedAt TEXT
    )
  `);

  // Create staff table
  db.exec(`
    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      email TEXT NOT NULL,
      contactNumber TEXT,
      role TEXT NOT NULL,
      specialization TEXT,
      department TEXT NOT NULL,
      joinDate TEXT NOT NULL,
      status TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  // Create staff schedule table
  db.exec(`
    CREATE TABLE IF NOT EXISTS staff_schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staffId TEXT NOT NULL,
      day TEXT NOT NULL,
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      FOREIGN KEY (staffId) REFERENCES staff (id) ON DELETE CASCADE
    )
  `);

  // Create staff qualifications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS staff_qualifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staffId TEXT NOT NULL,
      degree TEXT NOT NULL,
      institution TEXT NOT NULL,
      year INTEGER NOT NULL,
      certification TEXT,
      FOREIGN KEY (staffId) REFERENCES staff (id) ON DELETE CASCADE
    )
  `);

  // Create appointments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patientId INTEGER NOT NULL,
      doctorId TEXT NOT NULL,
      title TEXT NOT NULL,
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      status TEXT NOT NULL,
      type TEXT NOT NULL,
      notes TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (patientId) REFERENCES patients (id) ON DELETE CASCADE,
      FOREIGN KEY (doctorId) REFERENCES staff (id) ON DELETE CASCADE
    )
  `);

  // Create medical records table
  db.exec(`
    CREATE TABLE IF NOT EXISTS medical_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patientId INTEGER NOT NULL,
      doctorId TEXT NOT NULL,
      visitDate TEXT NOT NULL,
      visitId TEXT,
      chiefComplaint TEXT NOT NULL,
      notes TEXT,
      followUpRecommended INTEGER NOT NULL DEFAULT 0,
      followUpDate TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (patientId) REFERENCES patients (id) ON DELETE CASCADE,
      FOREIGN KEY (doctorId) REFERENCES staff (id) ON DELETE CASCADE
    )
  `);

  // Create vital signs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS vital_signs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medicalRecordId INTEGER NOT NULL,
      temperature REAL,
      bloodPressureSystolic INTEGER,
      bloodPressureDiastolic INTEGER,
      heartRate INTEGER,
      respiratoryRate INTEGER,
      oxygenSaturation REAL,
      height REAL,
      weight REAL,
      FOREIGN KEY (medicalRecordId) REFERENCES medical_records (id) ON DELETE CASCADE
    )
  `);

  // Create diagnoses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS diagnoses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medicalRecordId INTEGER NOT NULL,
      code TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY (medicalRecordId) REFERENCES medical_records (id) ON DELETE CASCADE
    )
  `);

  // Create medications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS medications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medicalRecordId INTEGER NOT NULL,
      medicationId TEXT,
      name TEXT NOT NULL,
      dosage TEXT NOT NULL,
      frequency TEXT NOT NULL,
      duration TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      refills INTEGER NOT NULL,
      instructions TEXT,
      FOREIGN KEY (medicalRecordId) REFERENCES medical_records (id) ON DELETE CASCADE
    )
  `);

  // Create procedures table
  db.exec(`
    CREATE TABLE IF NOT EXISTS procedures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medicalRecordId INTEGER NOT NULL,
      code TEXT,
      name TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY (medicalRecordId) REFERENCES medical_records (id) ON DELETE CASCADE
    )
  `);

  // Create treatment instructions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS treatment_instructions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medicalRecordId INTEGER NOT NULL,
      instructions TEXT NOT NULL,
      FOREIGN KEY (medicalRecordId) REFERENCES medical_records (id) ON DELETE CASCADE
    )
  `);

  // Create attachments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medicalRecordId INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      url TEXT NOT NULL,
      uploadedOn TEXT NOT NULL,
      FOREIGN KEY (medicalRecordId) REFERENCES medical_records (id) ON DELETE CASCADE
    )
  `);

  // Create invoices table
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      patientId INTEGER NOT NULL,
      appointmentId TEXT,
      totalAmount REAL NOT NULL,
      amountPaid REAL NOT NULL DEFAULT 0,
      balance REAL NOT NULL,
      status TEXT NOT NULL,
      dueDate TEXT NOT NULL,
      paidDate TEXT,
      paymentMethod TEXT,
      notes TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (patientId) REFERENCES patients (id) ON DELETE CASCADE
    )
  `);

  // Create invoice items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoice_items (
      id TEXT PRIMARY KEY,
      invoiceId TEXT NOT NULL,
      description TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unitPrice REAL NOT NULL,
      amount REAL NOT NULL,
      serviceCode TEXT,
      taxRate REAL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (invoiceId) REFERENCES invoices (id) ON DELETE CASCADE
    )
  `);

  // Create payments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      invoiceId TEXT NOT NULL,
      amount REAL NOT NULL,
      paymentMethod TEXT NOT NULL,
      transactionId TEXT,
      notes TEXT,
      processedBy TEXT NOT NULL,
      processedDate TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (invoiceId) REFERENCES invoices (id) ON DELETE CASCADE
    )
  `);

  // Create notifications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipientId INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      isRead INTEGER DEFAULT 0,
      relatedId TEXT,
      actionUrl TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (recipientId) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Create notification preferences table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notification_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL UNIQUE,
      email INTEGER DEFAULT 1,
      sms INTEGER DEFAULT 0,
      push INTEGER DEFAULT 1,
      appointmentReminders INTEGER DEFAULT 1,
      patientUpdates INTEGER DEFAULT 1,
      billingAlerts INTEGER DEFAULT 1,
      systemUpdates INTEGER DEFAULT 1, 
      newFeatures INTEGER DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
    )
  `);
};

export const down = () => {
  // Drop tables in reverse order to respect foreign key constraints
  db.exec("DROP TABLE IF EXISTS notification_preferences");
  db.exec("DROP TABLE IF EXISTS notifications");
  db.exec("DROP TABLE IF EXISTS payments");
  db.exec("DROP TABLE IF EXISTS invoice_items");
  db.exec("DROP TABLE IF EXISTS invoices");
  db.exec("DROP TABLE IF EXISTS attachments");
  db.exec("DROP TABLE IF EXISTS treatment_instructions");
  db.exec("DROP TABLE IF EXISTS procedures");
  db.exec("DROP TABLE IF EXISTS medications");
  db.exec("DROP TABLE IF EXISTS diagnoses");
  db.exec("DROP TABLE IF EXISTS vital_signs");
  db.exec("DROP TABLE IF EXISTS medical_records");
  db.exec("DROP TABLE IF EXISTS appointments");
  db.exec("DROP TABLE IF EXISTS staff_qualifications");
  db.exec("DROP TABLE IF EXISTS staff_schedule");
  db.exec("DROP TABLE IF EXISTS staff");
  db.exec("DROP TABLE IF EXISTS patients");
  db.exec("DROP TABLE IF EXISTS users");
};
