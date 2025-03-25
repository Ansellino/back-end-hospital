import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { TokenPayload } from "../utils/tokenUtils";
import { errorResponse } from "../utils/apiResponse";
import { env } from "../config/env";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        role: string;
        [key: string]: any; // Allow for additional properties
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json(errorResponse("Unauthorized - No token provided"));
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    // Cast the decoded token to any to handle different structures
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;

    // Normalize the token data structure based on what might be available
    req.user = {
      userId: decoded.userId || decoded.id || decoded.sub,
      role: decoded.role,
      // Include any other useful properties from the token
      email: decoded.email,
      permissions: decoded.permissions || [],
    };

    next();
  } catch (err) {
    res.status(401).json(errorResponse("Unauthorized - Invalid token"));
    return;
  }
};

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res
        .status(401)
        .json(errorResponse("Unauthorized - Authentication required"));
      return;
    }

    if (!roles.includes(req.user.role)) {
      res
        .status(403)
        .json(errorResponse("Forbidden - Insufficient permissions"));
      return;
    }

    next();
  };
};
