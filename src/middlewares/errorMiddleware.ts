import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { logger } from "../utils/logger";
import { errorResponse } from "../utils/apiResponse";

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error("Error occurred:", { error: err.message, stack: err.stack });

  // Handle specific errors here based on their types

  // Default error response - don't return the response object
  res.status(500).json(errorResponse("Internal Server Error", err.message));

  // Don't call next() since we've handled the error
};
