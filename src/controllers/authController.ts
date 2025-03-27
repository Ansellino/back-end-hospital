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
    // Add additional request logging
    console.log("Login request received:", {
      body: req.body,
      headers: req.headers["content-type"],
    });

    const { email, password } = req.body;
    console.log("Login attempt with:", email);

    // Validate request
    if (!email || !password) {
      console.log("Missing email or password");
      res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
      return;
    }

    // Find user by email
    const user = await UserModel.findOne({ email });
    console.log("User found:", user ? "Yes" : "No");

    if (!user) {
      console.log("Invalid credentials - user not found");
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }

    // Verify password
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    console.log("Password valid:", isPasswordValid);

    if (!isPasswordValid) {
      console.log("Invalid credentials - password incorrect");
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }

    // Check JWT_SECRET is available
    if (!env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined");
      res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
      return;
    }

    // Use consistent ID field
    const userId = user.id || user._id;
    console.log("Using userId:", userId);

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: userId, // Using userId consistently
        email: user.email,
        role: user.role,
      },
      env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    console.log(
      "Token generated:",
      token ? "Yes (length: " + token.length + ")" : "No"
    );

    // Create the response object with exact structure requested
    const responseData = {
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: userId,
          username: user.username || email.split("@")[0],
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          permissions: user.permissions || [],
          staffId: user.staffId || `STAFF-${userId}`,
          createdAt: user.createdAt || new Date().toISOString(),
          updatedAt: user.updatedAt || new Date().toISOString(),
        },
        token,
      },
    };

    // Log response and send it directly
    console.log("Sending response...");
    res.status(200).json(responseData);
  } catch (error: unknown) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "An error occurred during login",
      error:
        process.env.NODE_ENV === "development"
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined,
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
  } catch (error: unknown) {
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

    // FIXED: Check for JWT_SECRET and fix expiration syntax
    if (!env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined");
      res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
      return;
    }

    // FIXED: Generate JWT token with consistent ID field
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      env.JWT_SECRET as jwt.Secret,
      { expiresIn: "24h" } // Fixed expiration
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
  } catch (error: unknown) {
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

    // FIXED: Check for JWT_SECRET
    if (!env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined");
      res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
      return;
    }

    // FIXED: Use consistent ID field (user._id to user.id if available)
    const userId = user.id || user._id;

    // Generate reset token with consistent field naming
    const resetToken = jwt.sign(
      {
        id: userId, // Keep using 'id' for password reset tokens
        email: user.email,
      },
      env.JWT_SECRET + user.password,
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
  } catch (error: unknown) {
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

    // FIXED: Check for JWT_SECRET
    if (!env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined");
      res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
      return;
    }

    // Verify token with proper type definition
    interface ResetTokenPayload {
      id: string | number; // Use the same field name as in your token creation
      email: string;
      [key: string]: any; // Allow for additional properties
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as ResetTokenPayload;

    // Convert ID to number if it's a string
    const userId =
      typeof decoded.id === "string" ? parseInt(decoded.id, 10) : decoded.id;
    const user = await UserModel.findById(userId);

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
  } catch (error: unknown) {
    console.error("Password reset error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred resetting your password",
    });
  }
};

export const testSecret = (req: Request, res: Response) => {
  try {
    const testToken = jwt.sign({ test: true }, env.JWT_SECRET as string);
    res.json({ success: true, token: testToken });
  } catch (error) {
    console.error("Secret test failed:", error);
    res.status(500).json({
      success: false,
      error: "JWT_SECRET configuration error",
    });
  }
};
