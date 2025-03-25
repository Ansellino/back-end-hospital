import jwt, { Secret, SignOptions, VerifyOptions } from "jsonwebtoken";
import { env } from "../config/env";

export interface TokenPayload {
  userId: number;
  role: string;
  email?: string;
}

/**
 * Generate a JWT token
 * @param payload Data to encode in the token
 * @returns JWT token string
 */
export const generateToken = (payload: TokenPayload): string => {
  const secret: Secret = env.JWT_SECRET;

  const options: SignOptions = { expiresIn: "24h" };

  return jwt.sign(payload, secret, options);
};

/**
 * Verify and decode a JWT token
 * @param token JWT token to verify
 * @returns Decoded payload or null if invalid
 */
export const verifyToken = (token: string): TokenPayload | null => {
  try {
    const secret: Secret = env.JWT_SECRET;
    return jwt.verify(token, secret) as TokenPayload;
  } catch (error) {
    return null;
  }
};

/**
 * Generate a reset password token (with special expiration)
 * @param userId User ID for password reset
 * @returns JWT token string
 */
export const generateResetToken = (userId: number, email: string): string => {
  const secret: Secret = env.JWT_SECRET;
  const options: SignOptions = { expiresIn: "1h" };

  return jwt.sign(
    { userId, email, purpose: "password-reset" },
    secret,
    options
  );
};

/**
 * Verify a reset password token
 * @param token Reset token to verify
 * @returns The user ID from the token or null if invalid
 */
export const verifyResetToken = (
  token: string
): { userId: number; email: string } | null => {
  try {
    const secret: Secret = env.JWT_SECRET;
    const decoded = jwt.verify(token, secret) as any;

    if (decoded.purpose !== "password-reset") {
      return null;
    }

    return {
      userId: decoded.userId,
      email: decoded.email,
    };
  } catch (error) {
    return null;
  }
};

/**
 * Generate a refresh token with longer expiration
 * @param userId User ID for refresh token
 * @returns JWT token string
 */
export const generateRefreshToken = (userId: number): string => {
  const secret: Secret = env.JWT_SECRET;
  const options: SignOptions = { expiresIn: "7d" };

  return jwt.sign({ userId, type: "refresh" }, secret, options);
};

/**
 * Verify a refresh token
 * @param token Refresh token to verify
 * @returns The user ID from the token or null if invalid
 */
export const verifyRefreshToken = (token: string): number | null => {
  try {
    const secret: Secret = env.JWT_SECRET;
    const decoded = jwt.verify(token, secret) as any;

    if (decoded.type !== "refresh") {
      return null;
    }

    return decoded.userId;
  } catch (error) {
    return null;
  }
};
