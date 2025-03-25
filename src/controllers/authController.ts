import { Request, Response } from "express";
import bcryptjs from "bcryptjs"; // Using bcryptjs as it's in your dependencies
import jwt from "jsonwebtoken";
import UserModel from "../models/User"; // Import the default export
import { env } from "../config/env"; // Import env config

/**
 * User login
 * @route POST /api/auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate request
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
      return;
    }

    // Find user by email
    const user = await UserModel.findOne({ email });
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }

    // Verify password
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }

    // Generate JWT token with env config
    const token = jwt.sign(
      {
        userId: user.id, // Change id to userId for consistency
        email: user.email,
        role: user.role,
      },
      env.JWT_SECRET,
      { expiresIn: (env.JWT_EXPIRATION = "24h") }
    );

    // Return user data and token
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          permissions: user.permissions || [],
        },
        token,
      },
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred during login",
    });
  }
};

/**
 * Get current user from token
 * @route GET /api/auth/me
 */
export const getCurrentUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // User should be attached to request by auth middleware
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
      message: "User retrieved successfully",
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred retrieving user",
    });
  }
};

/**
 * User registration
 * @route POST /api/auth/register
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    // Validate request
    if (!firstName || !lastName || !email || !password) {
      res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
      return;
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
      return;
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    // Create new user
    const user = await UserModel.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: role || "user", // Default role if not specified
    });

    // Check if user creation was successful
    if (!user) {
      res.status(500).json({
        success: false,
        message: "Failed to create user",
      });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      env.JWT_SECRET,
      { expiresIn: (env.JWT_EXPIRATION = "24h") }
    );

    // Return user data and token
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
        token,
      },
      message: "Registration successful",
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred during registration",
    });
  }
};

/**
 * User logout (optional server-side)
 * @route POST /api/auth/logout
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  // Note: JWT tokens are typically invalidated client-side
  // This endpoint could be used for server-side tracking if needed
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

/**
 * Request password reset
 * @route POST /api/auth/password-reset-request
 */
export const requestPasswordReset = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: "Email is required",
      });
      return;
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      // Return success even if user not found (for security)
      res.status(200).json({
        success: true,
        message:
          "If your email exists in our system, a reset link has been sent",
      });
      return;
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { id: user._id, email: user.email },
      env.JWT_SECRET + user.password, // Add password hash to invalidate token when password changes
      { expiresIn: "1h" }
    );

    // In a real app, you would send an email with the reset link
    // For now, we'll just return the token in the response

    res.status(200).json({
      success: true,
      message: "If your email exists in our system, a reset link has been sent",
      // Remove in production:
      data: { resetToken },
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred processing your request",
    });
  }
};

/**
 * Reset password with token
 * @route POST /api/auth/password-reset
 */
export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({
        success: false,
        message: "Token and new password are required",
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
    const user = await UserModel.findById(decoded.id);

    if (!user || !user.id) {
      res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
      return;
    }

    // Hash new password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(newPassword, salt);

    // Update user's password using the UserModel.update method
    const updatedUser = await UserModel.update(user.id, {
      password: hashedPassword,
    });

    if (!updatedUser) {
      res.status(500).json({
        success: false,
        message: "Failed to update password",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred resetting your password",
    });
  }
};
