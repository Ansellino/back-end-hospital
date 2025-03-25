import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "./middlewares/errorMiddleware";
import routes from "./routes";
import { setupSwagger } from "./config/swagger";
import { logger } from "./utils/logger";

const app = express();

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable CSP for Swagger UI to work properly
  })
);
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Setup Swagger UI BEFORE other routes
setupSwagger(app);

// API routes
app.use("/api", routes);

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    return errorHandler(err, req, res, next);
  }
);

// 404 handler - AFTER all other routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
  });
});

// Uncaught exception handler
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception", {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

export default app;
