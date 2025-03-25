import db from "../config/database";
import { logger } from "../utils/logger";

// Define types for medical record and related entities
export interface VitalSigns {
  temperature: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  heartRate: number;
  respiratoryRate: number;
  oxygenSaturation: number;
  height: number;
  weight: number;
}

export interface Diagnosis {
  code: string;
  description: string;
  type: "primary" | "secondary" | "tertiary";
  notes?: string;
}

export interface PrescribedMedication {
  medicationId: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  refills: number;
  instructions: string;
}

export interface Procedure {
  code: string;
  name: string;
  notes?: string;
}

export interface Treatment {
  medications: PrescribedMedication[];
  procedures: Procedure[];
  instructions: string;
}

export interface Attachment {
  id?: string;
  name: string;
  type: string;
  url: string;
  uploadedOn?: string;
}

export interface MedicalRecord {
  id?: number;
  patientId: number;
  doctorId: number;
  visitDate: string;
  chiefComplaint: string;
  vitalSigns: VitalSigns;
  diagnosis: Diagnosis[];
  treatment: Treatment;
  notes?: string;
  followUpRecommended: boolean;
  followUpDate?: string;
  attachments: Attachment[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MedicalRecordWithNames extends MedicalRecord {
  patientName?: string;
  doctorName?: string;
}

// Create medical records tables
export const createMedicalRecordsTable = async (): Promise<void> => {
  try {
    // Main medical records table
    db.exec(`
      CREATE TABLE IF NOT EXISTS medical_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patientId INTEGER NOT NULL,
        doctorId INTEGER NOT NULL,
        visitDate TEXT NOT NULL,
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

    // Vital signs table
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

    // Diagnoses table
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

    // Medications table
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

    // Procedures table
    db.exec(`
      CREATE TABLE IF NOT EXISTS procedures (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        medicalRecordId INTEGER NOT NULL,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        notes TEXT,
        FOREIGN KEY (medicalRecordId) REFERENCES medical_records (id) ON DELETE CASCADE
      )
    `);

    // Treatment instructions table
    db.exec(`
      CREATE TABLE IF NOT EXISTS treatment_instructions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        medicalRecordId INTEGER NOT NULL,
        instructions TEXT NOT NULL,
        FOREIGN KEY (medicalRecordId) REFERENCES medical_records (id) ON DELETE CASCADE
      )
    `);

    // Attachments table
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

    logger.info("Medical records tables initialized");
  } catch (error) {
    logger.error("Error initializing medical records tables:", error);
    throw new Error("Failed to initialize medical records tables");
  }
};

// Get all medical records with patient and doctor names
export const getAllMedicalRecords = (): MedicalRecordWithNames[] => {
  try {
    const query = `
      SELECT 
        mr.*,
        p.firstName || ' ' || p.lastName as patientName,
        s.firstName || ' ' || s.lastName as doctorName
      FROM medical_records mr
      LEFT JOIN patients p ON mr.patientId = p.id
      LEFT JOIN staff s ON mr.doctorId = s.id
      ORDER BY mr.visitDate DESC
    `;

    const records = db.prepare(query).all();
    return records.map((record: any) => enrichMedicalRecord(record));
  } catch (error) {
    logger.error("Error getting all medical records:", error);
    return [];
  }
};

// Get medical record by ID with all related data
export const getMedicalRecordById = (
  id: number
): MedicalRecordWithNames | null => {
  try {
    if (!id) return null;

    const query = `
      SELECT 
        mr.*,
        p.firstName || ' ' || p.lastName as patientName,
        s.firstName || ' ' || s.lastName as doctorName
      FROM medical_records mr
      LEFT JOIN patients p ON mr.patientId = p.id
      LEFT JOIN staff s ON mr.doctorId = s.id
      WHERE mr.id = ?
    `;

    const record = db.prepare(query).get(id);
    if (!record) {
      return null;
    }

    return enrichMedicalRecord(record);
  } catch (error) {
    logger.error(`Error getting medical record by ID ${id}:`, error);
    return null;
  }
};

// Get medical records by patient ID
export const getMedicalRecordsByPatientId = (
  patientId: number
): MedicalRecordWithNames[] => {
  try {
    if (!patientId) return [];

    const query = `
      SELECT 
        mr.*,
        s.firstName || ' ' || s.lastName as doctorName
      FROM medical_records mr
      LEFT JOIN staff s ON mr.doctorId = s.id
      WHERE mr.patientId = ?
      ORDER BY mr.visitDate DESC
    `;

    const records = db.prepare(query).all(patientId);
    return records.map((record: any) => enrichMedicalRecord(record));
  } catch (error) {
    logger.error(
      `Error getting medical records by patient ID ${patientId}:`,
      error
    );
    return [];
  }
};

// Get medical records by doctor ID
export const getMedicalRecordsByDoctorId = (
  doctorId: number
): MedicalRecordWithNames[] => {
  try {
    if (!doctorId) return [];

    const query = `
      SELECT 
        mr.*,
        p.firstName || ' ' || p.lastName as patientName
      FROM medical_records mr
      LEFT JOIN patients p ON mr.patientId = p.id
      WHERE mr.doctorId = ?
      ORDER BY mr.visitDate DESC
    `;

    const records = db.prepare(query).all(doctorId);
    return records.map((record: any) => enrichMedicalRecord(record));
  } catch (error) {
    logger.error(
      `Error getting medical records by doctor ID ${doctorId}:`,
      error
    );
    return [];
  }
};

// Create a new medical record with all related data
export const createMedicalRecord = (
  recordData: Omit<MedicalRecord, "id" | "createdAt" | "updatedAt">
): MedicalRecord | null => {
  try {
    const now = new Date().toISOString();

    // Start a transaction
    const transaction = db.transaction(() => {
      // Insert main medical record
      const info = db
        .prepare(
          `
        INSERT INTO medical_records (
          patientId, doctorId, visitDate, chiefComplaint,
          notes, followUpRecommended, followUpDate,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
        )
        .run(
          recordData.patientId,
          recordData.doctorId,
          recordData.visitDate,
          recordData.chiefComplaint,
          recordData.notes || null,
          recordData.followUpRecommended ? 1 : 0,
          recordData.followUpDate || null,
          now,
          now
        );

      const medicalRecordId = info.lastInsertRowid as number;

      // Insert vital signs
      const vitalSigns = recordData.vitalSigns;
      db.prepare(
        `
        INSERT INTO vital_signs (
          medicalRecordId, temperature, bloodPressureSystolic,
          bloodPressureDiastolic, heartRate, respiratoryRate,
          oxygenSaturation, height, weight
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      ).run(
        medicalRecordId,
        vitalSigns.temperature,
        vitalSigns.bloodPressureSystolic,
        vitalSigns.bloodPressureDiastolic,
        vitalSigns.heartRate,
        vitalSigns.respiratoryRate,
        vitalSigns.oxygenSaturation,
        vitalSigns.height,
        vitalSigns.weight
      );

      // Insert diagnoses
      const insertDiagnosis = db.prepare(`
        INSERT INTO diagnoses (
          medicalRecordId, code, description, type, notes
        ) VALUES (?, ?, ?, ?, ?)
      `);

      for (const diagnosis of recordData.diagnosis) {
        insertDiagnosis.run(
          medicalRecordId,
          diagnosis.code,
          diagnosis.description,
          diagnosis.type,
          diagnosis.notes || null
        );
      }

      // Insert medications
      const insertMedication = db.prepare(`
        INSERT INTO medications (
          medicalRecordId, medicationId, name, dosage,
          frequency, duration, quantity, refills, instructions
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const medication of recordData.treatment.medications) {
        insertMedication.run(
          medicalRecordId,
          medication.medicationId,
          medication.name,
          medication.dosage,
          medication.frequency,
          medication.duration,
          medication.quantity,
          medication.refills,
          medication.instructions
        );
      }

      // Insert procedures
      const insertProcedure = db.prepare(`
        INSERT INTO procedures (
          medicalRecordId, code, name, notes
        ) VALUES (?, ?, ?, ?)
      `);

      for (const procedure of recordData.treatment.procedures) {
        insertProcedure.run(
          medicalRecordId,
          procedure.code,
          procedure.name,
          procedure.notes || null
        );
      }

      // Insert treatment instructions
      db.prepare(
        `
        INSERT INTO treatment_instructions (
          medicalRecordId, instructions
        ) VALUES (?, ?)
      `
      ).run(medicalRecordId, recordData.treatment.instructions);

      // Insert attachments
      const insertAttachment = db.prepare(`
        INSERT INTO attachments (
          medicalRecordId, name, type, url, uploadedOn
        ) VALUES (?, ?, ?, ?, ?)
      `);

      for (const attachment of recordData.attachments) {
        insertAttachment.run(
          medicalRecordId,
          attachment.name,
          attachment.type,
          attachment.url,
          attachment.uploadedOn || now
        );
      }

      return medicalRecordId;
    });

    // Execute transaction
    const medicalRecordId = transaction() as number;

    if (!medicalRecordId) {
      return null;
    }

    return getMedicalRecordById(medicalRecordId);
  } catch (error) {
    logger.error("Error creating medical record:", error);
    return null;
  }
};

// Update an existing medical record with all related data
export const updateMedicalRecord = (
  id: number,
  recordData: Partial<Omit<MedicalRecord, "id" | "createdAt" | "updatedAt">>
): MedicalRecord | null => {
  try {
    const record = getMedicalRecordById(id);
    if (!record) {
      return null;
    }

    const now = new Date().toISOString();

    // Start a transaction
    const transaction = db.transaction(() => {
      // Update main record
      if (
        recordData.patientId ||
        recordData.doctorId ||
        recordData.visitDate ||
        recordData.chiefComplaint ||
        recordData.notes !== undefined ||
        recordData.followUpRecommended !== undefined ||
        recordData.followUpDate !== undefined
      ) {
        const fields = [];
        const values = [];

        if (recordData.patientId) {
          fields.push("patientId = ?");
          values.push(recordData.patientId);
        }

        if (recordData.doctorId) {
          fields.push("doctorId = ?");
          values.push(recordData.doctorId);
        }

        if (recordData.visitDate) {
          fields.push("visitDate = ?");
          values.push(recordData.visitDate);
        }

        if (recordData.chiefComplaint) {
          fields.push("chiefComplaint = ?");
          values.push(recordData.chiefComplaint);
        }

        if (recordData.notes !== undefined) {
          fields.push("notes = ?");
          values.push(recordData.notes);
        }

        if (recordData.followUpRecommended !== undefined) {
          fields.push("followUpRecommended = ?");
          values.push(recordData.followUpRecommended ? 1 : 0);
        }

        if (recordData.followUpDate !== undefined) {
          fields.push("followUpDate = ?");
          values.push(recordData.followUpDate || null);
        }

        fields.push("updatedAt = ?");
        values.push(now);

        if (fields.length > 0) {
          const query = `UPDATE medical_records SET ${fields.join(
            ", "
          )} WHERE id = ?`;
          db.prepare(query).run(...values, id);
        }
      }

      // Update vital signs if provided
      if (recordData.vitalSigns) {
        const vitalSigns = recordData.vitalSigns;

        // Delete existing vital signs
        db.prepare("DELETE FROM vital_signs WHERE medicalRecordId = ?").run(id);

        // Insert new vital signs
        db.prepare(
          `
          INSERT INTO vital_signs (
            medicalRecordId, temperature, bloodPressureSystolic,
            bloodPressureDiastolic, heartRate, respiratoryRate,
            oxygenSaturation, height, weight
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
        ).run(
          id,
          vitalSigns.temperature,
          vitalSigns.bloodPressureSystolic,
          vitalSigns.bloodPressureDiastolic,
          vitalSigns.heartRate,
          vitalSigns.respiratoryRate,
          vitalSigns.oxygenSaturation,
          vitalSigns.height,
          vitalSigns.weight
        );
      }

      // Update diagnoses if provided
      if (recordData.diagnosis) {
        // Delete existing diagnoses
        db.prepare("DELETE FROM diagnoses WHERE medicalRecordId = ?").run(id);

        // Insert new diagnoses
        const insertDiagnosis = db.prepare(`
          INSERT INTO diagnoses (
            medicalRecordId, code, description, type, notes
          ) VALUES (?, ?, ?, ?, ?)
        `);

        for (const diagnosis of recordData.diagnosis) {
          insertDiagnosis.run(
            id,
            diagnosis.code,
            diagnosis.description,
            diagnosis.type,
            diagnosis.notes || null
          );
        }
      }

      // Update treatment if provided
      if (recordData.treatment) {
        // Update medications
        if (recordData.treatment.medications) {
          // Delete existing medications
          db.prepare("DELETE FROM medications WHERE medicalRecordId = ?").run(
            id
          );

          // Insert new medications
          const insertMedication = db.prepare(`
            INSERT INTO medications (
              medicalRecordId, medicationId, name, dosage,
              frequency, duration, quantity, refills, instructions
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          for (const medication of recordData.treatment.medications) {
            insertMedication.run(
              id,
              medication.medicationId,
              medication.name,
              medication.dosage,
              medication.frequency,
              medication.duration,
              medication.quantity,
              medication.refills,
              medication.instructions
            );
          }
        }

        // Update procedures
        if (recordData.treatment.procedures) {
          // Delete existing procedures
          db.prepare("DELETE FROM procedures WHERE medicalRecordId = ?").run(
            id
          );

          // Insert new procedures
          const insertProcedure = db.prepare(`
            INSERT INTO procedures (
              medicalRecordId, code, name, notes
            ) VALUES (?, ?, ?, ?)
          `);

          for (const procedure of recordData.treatment.procedures) {
            insertProcedure.run(
              id,
              procedure.code,
              procedure.name,
              procedure.notes || null
            );
          }
        }

        // Update treatment instructions
        if (recordData.treatment.instructions !== undefined) {
          // Delete existing instructions
          db.prepare(
            "DELETE FROM treatment_instructions WHERE medicalRecordId = ?"
          ).run(id);

          // Insert new instructions
          db.prepare(
            `
            INSERT INTO treatment_instructions (
              medicalRecordId, instructions
            ) VALUES (?, ?)
          `
          ).run(id, recordData.treatment.instructions);
        }
      }

      // Update attachments if provided
      if (recordData.attachments) {
        // Delete existing attachments
        db.prepare("DELETE FROM attachments WHERE medicalRecordId = ?").run(id);

        // Insert new attachments
        const insertAttachment = db.prepare(`
          INSERT INTO attachments (
            medicalRecordId, name, type, url, uploadedOn
          ) VALUES (?, ?, ?, ?, ?)
        `);

        for (const attachment of recordData.attachments) {
          insertAttachment.run(
            id,
            attachment.name,
            attachment.type,
            attachment.url,
            attachment.uploadedOn || now
          );
        }
      }

      return id;
    });

    // Execute transaction
    transaction();

    return getMedicalRecordById(id);
  } catch (error) {
    logger.error(`Error updating medical record ${id}:`, error);
    return null;
  }
};

// Delete a medical record and all related data
export const deleteMedicalRecord = (id: number): boolean => {
  try {
    // No need to delete from other tables due to ON DELETE CASCADE
    const result = db
      .prepare("DELETE FROM medical_records WHERE id = ?")
      .run(id);
    return result.changes > 0;
  } catch (error) {
    logger.error(`Error deleting medical record ${id}:`, error);
    return false;
  }
};

// Add an attachment to a medical record
export const addAttachment = (
  medicalRecordId: number,
  attachment: Omit<Attachment, "id" | "uploadedOn">
): Attachment | null => {
  try {
    const now = new Date().toISOString();

    const info = db
      .prepare(
        `
      INSERT INTO attachments (
        medicalRecordId, name, type, url, uploadedOn
      ) VALUES (?, ?, ?, ?, ?)
    `
      )
      .run(
        medicalRecordId,
        attachment.name,
        attachment.type,
        attachment.url,
        now
      );

    if (info.changes === 0) {
      return null;
    }

    const newAttachment = db
      .prepare(
        `
      SELECT * FROM attachments 
      WHERE id = ?
    `
      )
      .get(info.lastInsertRowid) as Attachment;

    return newAttachment;
  } catch (error) {
    logger.error(
      `Error adding attachment to medical record ${medicalRecordId}:`,
      error
    );
    return null;
  }
};

// Search medical records
export const searchMedicalRecords = (
  searchTerm: string
): MedicalRecordWithNames[] => {
  try {
    const query = `
      SELECT 
        mr.*,
        p.firstName || ' ' || p.lastName as patientName,
        s.firstName || ' ' || s.lastName as doctorName
      FROM medical_records mr
      LEFT JOIN patients p ON mr.patientId = p.id
      LEFT JOIN staff s ON mr.doctorId = s.id
      LEFT JOIN diagnoses d ON d.medicalRecordId = mr.id
      WHERE 
        p.firstName LIKE ? OR
        p.lastName LIKE ? OR
        s.firstName LIKE ? OR
        s.lastName LIKE ? OR
        mr.chiefComplaint LIKE ? OR
        mr.notes LIKE ? OR
        d.description LIKE ? OR
        d.code LIKE ?
      GROUP BY mr.id
      ORDER BY mr.visitDate DESC
    `;

    const term = `%${searchTerm}%`;
    const records = db
      .prepare(query)
      .all(term, term, term, term, term, term, term, term) as any[];

    return records.map((record) => enrichMedicalRecord(record));
  } catch (error) {
    logger.error(`Error searching medical records for "${searchTerm}":`, error);
    return [];
  }
};

// Helper function to fetch all related data for a medical record
const enrichMedicalRecord = (record: any): MedicalRecordWithNames => {
  try {
    const id = record.id;

    // Get vital signs
    const vitalSigns = db
      .prepare(
        `
      SELECT * FROM vital_signs WHERE medicalRecordId = ?
    `
      )
      .get(id) as VitalSigns;

    // Get diagnoses
    const diagnoses = db
      .prepare(
        `
      SELECT code, description, type, notes 
      FROM diagnoses
      WHERE medicalRecordId = ?
    `
      )
      .all(id) as Diagnosis[];

    // Get medications
    const medications = db
      .prepare(
        `
      SELECT medicationId, name, dosage, frequency, duration, quantity, refills, instructions 
      FROM medications
      WHERE medicalRecordId = ?
    `
      )
      .all(id) as PrescribedMedication[];

    // Get procedures
    const procedures = db
      .prepare(
        `
      SELECT code, name, notes 
      FROM procedures
      WHERE medicalRecordId = ?
    `
      )
      .all(id) as Procedure[];

    // Get treatment instructions
    const treatmentInstructions = db
      .prepare(
        `
      SELECT instructions 
      FROM treatment_instructions
      WHERE medicalRecordId = ?
    `
      )
      .get(id) as { instructions: string } | undefined;

    // Get attachments
    const attachments = db
      .prepare(
        `
      SELECT id, name, type, url, uploadedOn 
      FROM attachments
      WHERE medicalRecordId = ?
    `
      )
      .all(id) as Attachment[];

    return {
      ...record,
      followUpRecommended: Boolean(record.followUpRecommended),
      vitalSigns: vitalSigns || {
        temperature: 0,
        bloodPressureSystolic: 0,
        bloodPressureDiastolic: 0,
        heartRate: 0,
        respiratoryRate: 0,
        oxygenSaturation: 0,
        height: 0,
        weight: 0,
      },
      diagnosis: diagnoses,
      treatment: {
        medications: medications,
        procedures: procedures,
        instructions: treatmentInstructions?.instructions || "",
      },
      attachments: attachments,
    };
  } catch (error) {
    logger.error(`Error enriching medical record ${record.id}:`, error);
    return {
      ...record,
      followUpRecommended: Boolean(record.followUpRecommended),
      vitalSigns: {
        temperature: 0,
        bloodPressureSystolic: 0,
        bloodPressureDiastolic: 0,
        heartRate: 0,
        respiratoryRate: 0,
        oxygenSaturation: 0,
        height: 0,
        weight: 0,
      },
      diagnosis: [],
      treatment: {
        medications: [],
        procedures: [],
        instructions: "",
      },
      attachments: [],
    };
  }
};

export default {
  createMedicalRecordsTable,
  getAllMedicalRecords,
  getMedicalRecordById,
  getMedicalRecordsByPatientId,
  getMedicalRecordsByDoctorId,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
  addAttachment,
  searchMedicalRecords,
};
