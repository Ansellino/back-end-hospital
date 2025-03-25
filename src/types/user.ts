/**
 * User related types for the healthcare management system
 */

// Base user interface
export interface User {
  id?: number;
  _id?: number; // For MongoDB-like compatibility
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions?: string[];
  staffId?: string;
  createdAt: string;
  updatedAt: string;
}

// User without sensitive information (for responses)
export type SafeUser = Omit<User, "password">;

// Create user request
export interface CreateUserRequest {
  username?: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions?: string[];
  staffId?: string;
}

// Update user request
export interface UpdateUserRequest {
  username?: string;
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  permissions?: string[];
  staffId?: string;
}
