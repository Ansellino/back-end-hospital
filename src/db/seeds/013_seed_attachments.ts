import db from "../../config/database";
import { logger } from "../../utils/logger";

interface MedicalRecord {
  id: number;
  patientId: number;
  doctorId: string;
}

export const seed = async () => {
  try {
    const now = new Date().toISOString();
    logger.info("Seeding medical record attachments...");

    // Check if attachments table exists
    const tableExists = db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='attachments'`
      )
      .get();

    if (!tableExists) {
      logger.warn("Attachments table doesn't exist, skipping seeding");
      return;
    }

    // Get medical records
    const medicalRecords = db
      .prepare(`SELECT id, patientId, doctorId FROM medical_records`)
      .all() as MedicalRecord[];

    if (medicalRecords.length === 0) {
      logger.warn("No medical records found, skipping attachments seeding");
      return;
    }

    const attachmentTypes = [
      { type: "image/jpeg", extension: "jpg" },
      { type: "image/png", extension: "png" },
      { type: "application/pdf", extension: "pdf" },
      { type: "text/plain", extension: "txt" },
      { type: "application/msword", extension: "doc" },
      {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        extension: "docx",
      },
    ];

    const attachmentNames = [
      "X-Ray Result",
      "Lab Report",
      "MRI Scan",
      "Patient Consent Form",
      "Referral Letter",
      "Insurance Documentation",
      "CT Scan",
      "Ultrasound Image",
      "ECG Reading",
      "Blood Test Results",
      "Medical Certificate",
      "Specialist Consultation Notes",
    ];

    // Add attachments to approximately 40% of medical records (1-2 attachments each)
    for (const record of medicalRecords) {
      if (Math.random() < 0.4) {
        // Random number of attachments (1-2) per record
        const attachmentCount = Math.floor(Math.random() * 2) + 1;

        for (let i = 0; i < attachmentCount; i++) {
          try {
            const attachmentType =
              attachmentTypes[
                Math.floor(Math.random() * attachmentTypes.length)
              ];
            const attachmentName =
              attachmentNames[
                Math.floor(Math.random() * attachmentNames.length)
              ];

            // Generate upload date (0-7 days before now)
            const uploadDate = new Date();
            uploadDate.setDate(
              uploadDate.getDate() - Math.floor(Math.random() * 7)
            );

            const fileName = `${attachmentName
              .toLowerCase()
              .replace(/\s+/g, "-")}-${record.id}-${i + 1}.${
              attachmentType.extension
            }`;
            const url = `/uploads/medical-records/${record.patientId}/${fileName}`;

            db.prepare(
              `
              INSERT INTO attachments (
                medicalRecordId, name, type, url, uploadedOn
              ) VALUES (?, ?, ?, ?, ?)
            `
            ).run(
              record.id,
              attachmentName,
              attachmentType.type,
              url,
              uploadDate.toISOString()
            );

            logger.info(
              `Added attachment "${attachmentName}" to medical record ${record.id}`
            );
          } catch (error) {
            logger.error(
              `Error inserting attachment for record ${record.id}:`,
              error
            );
          }
        }
      }
    }

    logger.info("Medical record attachments seeded successfully");
  } catch (error) {
    logger.error("Error in attachments seed:", error);
    throw error;
  }
};
