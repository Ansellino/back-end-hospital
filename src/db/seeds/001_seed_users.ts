import db from "../../config/database";
import bcryptjs from "bcryptjs";

export const seed = async () => {
  const now = new Date().toISOString();
  const hashedPassword = await bcryptjs.hash("password123", 10);

  // Insert users
  // Admin user
  db.prepare(
    `
    INSERT INTO users (username, email, password, firstName, lastName, role, permissions, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    "admin",
    "admin@hospital.com",
    hashedPassword,
    "Admin",
    "User",
    "admin",
    JSON.stringify(["*:*"]),
    now,
    now
  );

  // Doctor user
  db.prepare(
    `
    INSERT INTO users (username, email, password, firstName, lastName, role, permissions, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    "doctor",
    "doctor@hospital.com",
    hashedPassword,
    "John",
    "Smith",
    "doctor",
    JSON.stringify([
      "view:patients",
      "create:medical-records",
      "edit:appointments",
    ]),
    now,
    now
  );

  // Nurse user
  db.prepare(
    `
    INSERT INTO users (username, email, password, firstName, lastName, role, permissions, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    "nurse",
    "nurse@hospital.com",
    hashedPassword,
    "Jane",
    "Doe",
    "nurse",
    JSON.stringify(["view:patients", "view:medical-records"]),
    now,
    now
  );

  // Receptionist user
  db.prepare(
    `
    INSERT INTO users (username, email, password, firstName, lastName, role, permissions, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    "receptionist",
    "receptionist@hospital.com",
    hashedPassword,
    "Mary",
    "Johnson",
    "receptionist",
    JSON.stringify([
      "view:patients",
      "create:appointments",
      "edit:appointments",
    ]),
    now,
    now
  );

  // Insert staff
  db.prepare(
    `
    INSERT INTO staff (id, firstName, lastName, email, contactNumber, role, specialization, department, joinDate, status, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    "STAFF-001",
    "John",
    "Smith",
    "john.smith@hospital.com",
    "555-123-4567",
    "doctor",
    "Cardiology",
    "Medical",
    "2020-01-15",
    "active",
    now,
    now
  );

  db.prepare(
    `
    INSERT INTO staff (id, firstName, lastName, email, contactNumber, role, specialization, department, joinDate, status, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    "STAFF-002",
    "Sarah",
    "Johnson",
    "sarah.johnson@hospital.com",
    "555-987-6543",
    "doctor",
    "Pediatrics",
    "Medical",
    "2019-03-20",
    "active",
    now,
    now
  );

  // Insert staff qualifications
  db.prepare(
    `
    INSERT INTO staff_qualifications (staffId, degree, institution, year, certification)
    VALUES (?, ?, ?, ?, ?)
  `
  ).run(
    "STAFF-001",
    "MD",
    "Harvard Medical School",
    2015,
    "Board Certified in Cardiology"
  );

  // Insert patients
  db.prepare(
    `
    INSERT INTO patients (firstName, lastName, dateOfBirth, gender, contactNumber, email, address, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    "Michael",
    "Brown",
    "1985-07-12",
    "male",
    "555-111-2222",
    "michael.brown@email.com",
    "123 Main St, Anytown, USA",
    now,
    now
  );

  db.prepare(
    `
    INSERT INTO patients (firstName, lastName, dateOfBirth, gender, contactNumber, email, address, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    "Emily",
    "Davis",
    "1990-04-25",
    "female",
    "555-333-4444",
    "emily.davis@email.com",
    "456 Oak Ave, Somewhere, USA",
    now,
    now
  );

  // Insert appointments
  const appointmentDate = new Date();
  appointmentDate.setDate(appointmentDate.getDate() + 3); // 3 days from now
  const startTime = appointmentDate.toISOString();
  appointmentDate.setHours(appointmentDate.getHours() + 1);
  const endTime = appointmentDate.toISOString();

  db.prepare(
    `
    INSERT INTO appointments (patientId, doctorId, title, startTime, endTime, status, type, notes, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    1,
    "STAFF-001",
    "Follow-up Appointment",
    startTime,
    endTime,
    "scheduled",
    "follow-up",
    "Regular checkup after medication change",
    now,
    now
  );

  console.log("Database seeded successfully");
};
