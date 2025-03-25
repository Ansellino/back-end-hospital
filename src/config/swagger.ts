import swaggerUi from "swagger-ui-express";
import { Express } from "express";
import fs from "fs";
import path from "path";
import { logger } from "../utils/logger";

// Path to the swagger.json file
const swaggerFile = path.resolve(__dirname, "../docs/swagger.json");

/**
 * Setup Swagger UI routes in the Express application
 */
export const setupSwagger = (app: Express): void => {
  try {
    // Check if swagger.json exists
    if (!fs.existsSync(swaggerFile)) {
      logger.error("Swagger JSON file not found at:", swaggerFile);
      return;
    }

    // Read the swagger.json file
    const swaggerDoc = JSON.parse(fs.readFileSync(swaggerFile, "utf8"));

    // Setup Swagger UI options
    const options = {
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "Hospital Management System API",
      explorer: true,
    };

    // Serve swagger UI
    app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc, options));
    logger.info("Swagger documentation available at /api/docs");
  } catch (error) {
    logger.error("Failed to setup Swagger documentation:", error);
  }
};
