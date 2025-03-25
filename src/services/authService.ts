import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import UserModel from "../models/User";
import {
  TokenPayload,
  LoginRequest,
  LoginResponse,
  User,
  SafeUser,
} from "../types/auth";
import { logger } from "../utils/logger";
import { env } from "../config/env";

/**
 * Handle user login
 * @param email User's email
 * @param password User's password
 */
export const login = async ({
  email,
  password,
}: LoginRequest): Promise<LoginResponse> => {
  try {
    // Find user by email
    const user = await UserModel.findOne({ email });
    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Verify password
    const isPasswordValid = await UserModel.verifyPassword(user, password);
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    // Check if user has an ID (it should always have one)
    if (!user.id) {
      throw new Error("User ID is missing");
    }

    // Generate JWT token with userId instead of id to match controller
    const tokenPayload: TokenPayload = {
      userId: user.id, // Changed from id to userId
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(tokenPayload, env.JWT_SECRET, {
      expiresIn: (env.JWT_EXPIRATION = "24h"),
    });

    // Return user data (without password) and token
    const safeUser = UserModel.getSafeUser(user);

    return {
      user: safeUser,
      token,
    };
  } catch (error) {
    logger.error("Error in authService.login:", error);
    throw error;
  }
};

/**
 * Register a new user
 * @param userData User registration data
 */
export const register = async (
  userData: Omit<User, "id" | "createdAt" | "updatedAt" | "permissions">
): Promise<SafeUser> => {
  // Changed return type from User to SafeUser
  try {
    // Check if user already exists
    const existingUser = await UserModel.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(userData.password, salt);

    // Create new user
    const user = await UserModel.create({
      ...userData,
      password: hashedPassword,
    });

    if (!user) {
      throw new Error("Failed to create user");
    }

    // Return user without password
    return UserModel.getSafeUser(user);
  } catch (error) {
    logger.error("Error in authService.register:", error);
    throw error;
  }
};

/**
 * Get current user by ID
 * @param userId User ID
 */
export const getUserById = async (userId: string): Promise<SafeUser | null> => {
  try {
    // Convert string ID to number since findById expects a number
    const userIdNum = parseInt(userId, 10);

    // Check for valid conversion
    if (isNaN(userIdNum)) {
      logger.error(`Invalid user ID format: ${userId}`);
      return null;
    }

    const user = await UserModel.findById(userIdNum);
    if (!user) return null;

    return UserModel.getSafeUser(user);
  } catch (error) {
    logger.error(`Error in authService.getUserById for ID ${userId}:`, error);
    throw error;
  }
};

/**
 * Request password reset
 * @param email User's email
 */
export const requestPasswordReset = async (email: string): Promise<boolean> => {
  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      // Return true even if user not found for security reasons
      return true;
    }

    if (!user.id) {
      throw new Error("User ID is missing");
    }

    // Generate reset token - updated to match controller
    const resetToken = jwt.sign(
      { userId: user.id, email: user.email }, // Changed from id to userId
      env.JWT_SECRET + user.password,
      { expiresIn: "1h" }
    );

    // In a real implementation, you would:
    // 1. Store the token in the database or use a one-way hash of it
    // 2. Send an email with the reset link containing the token

    logger.info(`Password reset requested for ${email}. Token: ${resetToken}`);

    return true;
  } catch (error) {
    logger.error(
      `Error in authService.requestPasswordReset for email ${email}:`,
      error
    );
    throw error;
  }
};

/**
 * Reset password with token
 * @param token Reset token
 * @param newPassword New password
 */
export const resetPassword = async (
  token: string,
  newPassword: string
): Promise<boolean> => {
  try {
    // Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload & {
      userId: string; // Changed from id to userId
    };

    // Convert string ID to number
    const userId = parseInt(decoded.userId, 10); // Changed from id to userId

    if (isNaN(userId)) {
      throw new Error("Invalid user ID in token");
    }

    const user = await UserModel.findById(userId);

    if (!user) {
      throw new Error("Invalid or expired token");
    }

    // Verify full token with user's current password
    try {
      jwt.verify(token, env.JWT_SECRET + user.password);
    } catch (error) {
      throw new Error("Invalid or expired token");
    }

    // Make sure the user has an ID before updating
    if (!user.id) {
      throw new Error("User ID is missing");
    }

    // Hash new password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(newPassword, salt);

    // Update password
    const updatedUser = await UserModel.update(user.id, {
      password: hashedPassword,
    });

    if (!updatedUser) {
      throw new Error("Failed to update password");
    }

    return true;
  } catch (error) {
    logger.error("Error in authService.resetPassword:", error);
    throw error;
  }
};

/**
 * Verify JWT token
 * @param token JWT token to verify
 */
export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  } catch (error) {
    logger.error("Error in authService.verifyToken:", error);
    throw new Error("Invalid token");
  }
};

export default {
  login,
  register,
  getUserById,
  requestPasswordReset,
  resetPassword,
  verifyToken,
};
