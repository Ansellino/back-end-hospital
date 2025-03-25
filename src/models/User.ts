import db, { DbUserRow, CountResult } from "../db/dbClient";
import bcryptjs from "bcryptjs";
import {
  User as UserType,
  SafeUser,
  CreateUserRequest,
  UpdateUserRequest,
} from "../types/user";

/**
 * Initialize users table if it doesn't exist
 */
export const createUsersTable = async (): Promise<void> => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      role TEXT NOT NULL,
      permissions TEXT,
      staffId TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);
  console.log("Users table initialized");
};

/**
 * Find user by ID
 */
export const findById = async (id: number): Promise<UserType | null> => {
  try {
    const result = db
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(id) as DbUserRow;
    if (!result) return null;
    return formatUserFromDb(result);
  } catch (error) {
    console.error(`Error finding user with ID ${id}:`, error);
    return null;
  }
};

/**
 * Find user by specific criteria (e.g., email, username)
 */
export const findOne = async (
  criteria: Partial<UserType>
): Promise<UserType | null> => {
  try {
    const keys = Object.keys(criteria);
    if (keys.length === 0) return null;

    const whereClause = keys.map((key) => `${key} = ?`).join(" AND ");
    const values = Object.values(criteria);

    const result = db
      .prepare(`SELECT * FROM users WHERE ${whereClause} LIMIT 1`)
      .get(...values);

    if (!result) return null;

    return formatUserFromDb(result);
  } catch (error) {
    console.error("Error finding user:", error);
    return null;
  }
};

/**
 * Find all users, optionally with filtering
 */
export const findAll = async (
  filter: Partial<UserType> = {}
): Promise<UserType[]> => {
  try {
    let query = "SELECT * FROM users";
    // Add explicit type for SQL parameters
    const params: (string | number | boolean | null)[] = [];

    const keys = Object.keys(filter).filter(
      (key) => filter[key as keyof UserType] !== undefined
    );

    if (keys.length > 0) {
      query += " WHERE " + keys.map((key) => `${key} = ?`).join(" AND ");
      keys.forEach((key) => {
        // Add type assertion to tell TypeScript this value is never undefined
        const value = filter[key as keyof UserType];
        if (value !== undefined) {
          params.push(value as string | number | boolean | null);
        }
      });
    }

    query += " ORDER BY id ASC";

    const results = db.prepare(query).all(...params);
    return results.map(formatUserFromDb);
  } catch (error) {
    console.error("Error finding users:", error);
    return [];
  }
};

/**
 * Create a new user
 */
export const create = async (
  userData: CreateUserRequest
): Promise<UserType | null> => {
  try {
    const now = new Date().toISOString();
    const permissionsJson = userData.permissions
      ? JSON.stringify(userData.permissions)
      : null;

    if (!userData.username) {
      // Generate a username if not provided
      userData.username =
        userData.email.split("@")[0] + Math.floor(Math.random() * 1000);
    }

    // Hash password if not already hashed
    const hashedPassword = userData.password.startsWith("$2")
      ? userData.password
      : await bcryptjs.hash(userData.password, 10);

    const info = db
      .prepare(
        `INSERT INTO users (
        username, email, password, firstName, lastName,
        role, permissions, staffId, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        userData.username,
        userData.email,
        hashedPassword,
        userData.firstName,
        userData.lastName,
        userData.role,
        permissionsJson,
        userData.staffId || null,
        now,
        now
      );

    return findById(info.lastInsertRowid as number);
  } catch (error) {
    console.error("Error creating user:", error);
    return null;
  }
};

/**
 * Update an existing user
 */
export const update = async (
  id: number,
  userData: UpdateUserRequest
): Promise<UserType | null> => {
  try {
    const user = await findById(id);
    if (!user) return null;

    const now = new Date().toISOString();

    // Build the SET clause dynamically based on provided fields
    const updates: Record<string, any> = {};

    if (userData.username !== undefined) updates.username = userData.username;
    if (userData.email !== undefined) updates.email = userData.email;
    if (userData.firstName !== undefined)
      updates.firstName = userData.firstName;
    if (userData.lastName !== undefined) updates.lastName = userData.lastName;
    if (userData.role !== undefined) updates.role = userData.role;
    if (userData.staffId !== undefined) updates.staffId = userData.staffId;

    // Handle password separately for hashing
    if (userData.password) {
      updates.password = userData.password.startsWith("$2")
        ? userData.password
        : await bcryptjs.hash(userData.password, 10);
    }

    // Handle permissions serialization
    if (userData.permissions) {
      updates.permissions = JSON.stringify(userData.permissions);
    }

    updates.updatedAt = now;

    if (Object.keys(updates).length === 1) {
      // Only updatedAt was set, no real updates
      return user;
    }

    const setClause = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");

    const values = Object.values(updates);
    values.push(id);

    db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`).run(...values);

    return findById(id);
  } catch (error) {
    console.error(`Error updating user ${id}:`, error);
    return null;
  }
};

/**
 * Delete a user
 */
export const remove = async (id: number): Promise<boolean> => {
  try {
    const result = db.prepare("DELETE FROM users WHERE id = ?").run(id);
    return result.changes > 0;
  } catch (error) {
    console.error(`Error deleting user ${id}:`, error);
    return false;
  }
};

/**
 * Count total users
 */
export const count = (): number => {
  try {
    const result = db
      .prepare("SELECT COUNT(*) as count FROM users")
      .get() as CountResult;
    return result.count;
  } catch (error) {
    console.error("Error counting users:", error);
    return 0;
  }
};

/**
 * Verify a user's password
 */
export const verifyPassword = async (
  user: UserType,
  password: string
): Promise<boolean> => {
  try {
    return await bcryptjs.compare(password, user.password);
  } catch (error) {
    console.error("Error verifying password:", error);
    return false;
  }
};

/**
 * Format user object from database
 */
const formatUserFromDb = (dbUser: any): UserType => {
  // Parse permissions if they exist
  let permissions = [];
  if (dbUser.permissions) {
    try {
      permissions = JSON.parse(dbUser.permissions);
    } catch (error) {
      console.error("Error parsing permissions:", error);
    }
  }

  return {
    id: dbUser.id,
    _id: dbUser.id, // For MongoDB-style compatibility
    username: dbUser.username,
    email: dbUser.email,
    password: dbUser.password,
    firstName: dbUser.firstName,
    lastName: dbUser.lastName,
    role: dbUser.role,
    permissions,
    staffId: dbUser.staffId,
    createdAt: dbUser.createdAt,
    updatedAt: dbUser.updatedAt,
  };
};

/**
 * Get user without sensitive information
 */
export const getSafeUser = (user: UserType): SafeUser => {
  const { password, ...safeUser } = user;
  return safeUser;
};

export const UserModel = {
  createUsersTable,
  findById,
  findOne,
  findAll,
  create,
  update,
  remove,
  count,
  verifyPassword,
  getSafeUser,
};

export default UserModel;
