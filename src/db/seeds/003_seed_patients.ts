import db from "../../config/database";
import { logger } from "../../utils/logger";

export const seed = async () => {
  try {
    const now = new Date().toISOString();

    logger.info("Seeding patients...");

    // Verify table exists and check schema
    const tableExists = db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='patients'`
      )
      .get();

    if (!tableExists) {
      logger.error("Patients table doesn't exist, skipping patients seeding");
      return;
    }

    // Get column names from the table schema
    const tableInfo = db.prepare(`PRAGMA table_info(patients)`).all();
    logger.info(`Patients table schema: ${JSON.stringify(tableInfo)}`);

    // Insert basic patients
    db.prepare(
      `
      INSERT INTO patients (
        firstName, lastName, dateOfBirth, gender, 
        contactNumber, email, address, 
        emergencyContactName, emergencyContactNumber, 
        bloodType, allergies, medicalHistory, 
        insuranceProvider, insurancePolicyNumber, 
        createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      "Michael",
      "Brown",
      "1985-07-12",
      "male",
      "555-111-2222",
      "michael.brown@email.com",
      "123 Main St, Anytown, USA",
      "Linda Brown",
      "555-111-3333",
      "O+",
      "Penicillin",
      "Hypertension, diagnosed 2018",
      "Blue Cross",
      "BC12345678",
      now,
      now
    );

    db.prepare(
      `
      INSERT INTO patients (
        firstName, lastName, dateOfBirth, gender, 
        contactNumber, email, address, 
        emergencyContactName, emergencyContactNumber, 
        bloodType, allergies, medicalHistory, 
        insuranceProvider, insurancePolicyNumber, 
        createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      "Emily",
      "Davis",
      "1990-04-25",
      "female",
      "555-333-4444",
      "emily.davis@email.com",
      "456 Oak Ave, Somewhere, USA",
      "Robert Davis",
      "555-333-5555",
      "A-",
      "Shellfish, Peanuts",
      "Asthma since childhood, Allergic rhinitis",
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
        emergencyContactName: "Sarah Wilson",
        emergencyContactNumber: "555-444-6666",
        bloodType: "AB+",
        allergies: "None",
        medicalHistory: "Type 2 Diabetes, diagnosed 2015",
        insuranceProvider: "United Healthcare",
        insurancePolicyNumber: "UH98765432",
      },
      {
        firstName: "Sophia",
        lastName: "Martinez",
        dateOfBirth: "1992-08-15",
        gender: "female",
        contactNumber: "555-666-7777",
        email: "sophia.martinez@email.com",
        address: "101 Cedar Ln, Nowhere, USA",
        emergencyContactName: "Carlos Martinez",
        emergencyContactNumber: "555-666-8888",
        bloodType: "B+",
        allergies: "Sulfa drugs",
        medicalHistory: "Migraines",
        insuranceProvider: "Cigna",
        insurancePolicyNumber: "CI54321678",
      },
      {
        firstName: "Robert",
        lastName: "Taylor",
        dateOfBirth: "1968-02-20",
        gender: "male",
        contactNumber: "555-888-9999",
        email: "robert.taylor@email.com",
        address: "202 Maple Dr, Anywhere, USA",
        emergencyContactName: "Jennifer Taylor",
        emergencyContactNumber: "555-888-0000",
        bloodType: "O-",
        allergies: "Latex",
        medicalHistory: "Coronary artery disease, Hyperlipidemia",
        insuranceProvider: "Kaiser",
        insurancePolicyNumber: "KP13579246",
      },
      {
        firstName: "Emma",
        lastName: "Johnson",
        dateOfBirth: "1988-09-03",
        gender: "female",
        contactNumber: "555-222-3333",
        email: "emma.johnson@email.com",
        address: "303 Birch St, Somewhere Else, USA",
        emergencyContactName: "David Johnson",
        emergencyContactNumber: "555-222-4444",
        bloodType: "A+",
        allergies: "Aspirin",
        medicalHistory: "Anxiety disorder",
        insuranceProvider: "Humana",
        insurancePolicyNumber: "HU24680135",
      },
      {
        firstName: "William",
        lastName: "Garcia",
        dateOfBirth: "1955-05-17",
        gender: "male",
        contactNumber: "555-777-8888",
        email: "william.garcia@email.com",
        address: "404 Spruce Ave, Elsewhere, USA",
        emergencyContactName: "Maria Garcia",
        emergencyContactNumber: "555-777-9999",
        bloodType: "B-",
        allergies: "Codeine",
        medicalHistory: "Osteoarthritis, GERD",
        insuranceProvider: "Medicare",
        insurancePolicyNumber: "MC97531246",
      },
    ];

    // Insert additional patients with consistent schema
    for (const patient of patients) {
      try {
        db.prepare(
          `
          INSERT INTO patients (
            firstName, lastName, dateOfBirth, gender, 
            contactNumber, email, address, 
            emergencyContactName, emergencyContactNumber, 
            bloodType, allergies, medicalHistory, 
            insuranceProvider, insurancePolicyNumber, 
            createdAt, updatedAt
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
        ).run(
          patient.firstName,
          patient.lastName,
          patient.dateOfBirth,
          patient.gender,
          patient.contactNumber,
          patient.email,
          patient.address,
          patient.emergencyContactName,
          patient.emergencyContactNumber,
          patient.bloodType,
          patient.allergies,
          patient.medicalHistory,
          patient.insuranceProvider,
          patient.insurancePolicyNumber,
          now,
          now
        );
      } catch (error) {
        logger.error(
          `Error inserting patient ${patient.firstName} ${patient.lastName}:`,
          error
        );
      }
    }

    logger.info("Patients seeded successfully");
  } catch (error) {
    logger.error("Error seeding patients:", error);
    throw error;
  }
};
