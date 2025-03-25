import db from "../../config/database";
import { logger } from "../../utils/logger";

export const seed = async () => {
  try {
    const now = new Date().toISOString();

    logger.info("Seeding staff...");

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

    db.prepare(
      `
      INSERT INTO staff (id, firstName, lastName, email, contactNumber, role, specialization, department, joinDate, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      "STAFF-003",
      "Michael",
      "Williams",
      "michael.williams@hospital.com",
      "555-555-1234",
      "doctor",
      "Neurology",
      "Medical",
      "2018-07-10",
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
      "STAFF-004",
      "Emily",
      "Jones",
      "emily.jones@hospital.com",
      "555-222-3333",
      "nurse",
      "General",
      "Nursing",
      "2021-02-15",
      "active",
      now,
      now
    );

    // Insert staff qualifications
    logger.info("Seeding staff qualifications...");

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

    db.prepare(
      `
      INSERT INTO staff_qualifications (staffId, degree, institution, year, certification)
      VALUES (?, ?, ?, ?, ?)
    `
    ).run(
      "STAFF-002",
      "MD",
      "Johns Hopkins School of Medicine",
      2014,
      "Board Certified in Pediatrics"
    );

    db.prepare(
      `
      INSERT INTO staff_qualifications (staffId, degree, institution, year, certification)
      VALUES (?, ?, ?, ?, ?)
    `
    ).run(
      "STAFF-003",
      "MD",
      "Stanford University School of Medicine",
      2012,
      "Board Certified in Neurology"
    );

    // Insert staff schedule
    logger.info("Seeding staff schedule...");

    // Example schedule for staff members (can be expanded as needed)
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const shifts = ["Morning", "Afternoon"];

    // Create schedules for each staff member
    for (let staffNum = 1; staffNum <= 4; staffNum++) {
      const staffId = `STAFF-00${staffNum}`;

      // Each staff works 3 random shifts per week
      const workDays = [...days].sort(() => 0.5 - Math.random()).slice(0, 3);

      for (const day of workDays) {
        const shift = shifts[Math.floor(Math.random() * shifts.length)];
        const startTime = shift === "Morning" ? "08:00:00" : "13:00:00";
        const endTime = shift === "Morning" ? "12:00:00" : "17:00:00";

        db.prepare(
          `
          INSERT INTO staff_schedule (staffId, day, startTime, endTime, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?)
        `
        ).run(staffId, day, startTime, endTime, now, now);
      }
    }

    logger.info("Staff data seeded successfully");
  } catch (error) {
    logger.error("Error seeding staff data:", error);
    throw error;
  }
};
