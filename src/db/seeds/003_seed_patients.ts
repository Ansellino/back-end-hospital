import db from "../../config/database";
import { logger } from "../../utils/logger";

export const seed = async () => {
  try {
    const now = new Date().toISOString();

    logger.info("Seeding patients...");

    // Insert basic patients
    db.prepare(
      `
      INSERT INTO patients (firstName, lastName, dateOfBirth, gender, contactNumber, email, address, emergencyContact, insuranceProvider, insuranceNumber, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      "Michael",
      "Brown",
      "1985-07-12",
      "male",
      "555-111-2222",
      "michael.brown@email.com",
      "123 Main St, Anytown, USA",
      "Linda Brown, 555-111-3333",
      "Blue Cross",
      "BC12345678",
      now,
      now
    );

    db.prepare(
      `
      INSERT INTO patients (firstName, lastName, dateOfBirth, gender, contactNumber, email, address, emergencyContact, insuranceProvider, insuranceNumber, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      "Emily",
      "Davis",
      "1990-04-25",
      "female",
      "555-333-4444",
      "emily.davis@email.com",
      "456 Oak Ave, Somewhere, USA",
      "Robert Davis, 555-333-5555",
      "Aetna",
      "AE87654321",
      now,
      now
    );

    // Add more patients
    const patients = [
      {
        firstName: "James",
        lastName: "Wilson",
        dateOfBirth: "1975-11-30",
        gender: "male",
        contactNumber: "555-444-5555",
        email: "james.wilson@email.com",
        address: "789 Pine St, Elsewhere, USA",
        insurance: "United Healthcare",
      },
      {
        firstName: "Sophia",
        lastName: "Martinez",
        dateOfBirth: "1992-08-15",
        gender: "female",
        contactNumber: "555-666-7777",
        email: "sophia.martinez@email.com",
        address: "101 Cedar Ln, Nowhere, USA",
        insurance: "Cigna",
      },
      {
        firstName: "Robert",
        lastName: "Taylor",
        dateOfBirth: "1968-02-20",
        gender: "male",
        contactNumber: "555-888-9999",
        email: "robert.taylor@email.com",
        address: "202 Maple Dr, Anywhere, USA",
        insurance: "Kaiser",
      },
    ];

    for (const patient of patients) {
      db.prepare(
        `
        INSERT INTO patients (firstName, lastName, dateOfBirth, gender, contactNumber, email, address, emergencyContact, insuranceProvider, insuranceNumber, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      ).run(
        patient.firstName,
        patient.lastName,
        patient.dateOfBirth,
        patient.gender,
        patient.contactNumber,
        patient.email,
        patient.address,
        `Family Member, ${patient.contactNumber.replace(/\d$/, "1")}`,
        patient.insurance,
        `${patient.insurance.substring(0, 2).toUpperCase()}${
          Math.floor(Math.random() * 90000000) + 10000000
        }`,
        now,
        now
      );
    }

    logger.info("Patients seeded successfully");
  } catch (error) {
    logger.error("Error seeding patients:", error);
    throw error;
  }
};
