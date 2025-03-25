import swaggerJsDoc from "swagger-jsdoc";
import fs from "fs";
import path from "path";
import { logger } from "../utils/logger";

// Define OpenAPI document structure
interface OpenAPIDocument {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
    contact?: any;
    license?: any;
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  paths: Record<string, any>;
  components?: {
    schemas?: Record<string, any>;
    securitySchemes?: Record<string, any>;
    [key: string]: any;
  };
  security?: Array<Record<string, any>>;
  [key: string]: any;
}

// Swagger definition options
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Healthcare Management System API",
      version: "1.0.0",
      description: "API documentation for the Hospital Management System",
      contact: {
        name: "API Support",
        email: "support@healthcare.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:5000/api",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    path.resolve(__dirname, "../controllers/*.ts"),
    path.resolve(__dirname, "../routes/*.ts"),
    path.resolve(__dirname, "../models/*.ts"),
    path.resolve(__dirname, "../schemas/*.ts"),
  ],
};

/**
 * Generate or update Swagger documentation
 */
const generateDocs = async () => {
  try {
    // Ensure docs directory exists
    const docsDir = path.resolve(__dirname, "../docs");
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    // Existing swagger file path
    const swaggerFile = path.resolve(docsDir, "swagger.json");
    let specs: OpenAPIDocument;

    // If file exists, read it and merge with new specs
    if (fs.existsSync(swaggerFile)) {
      console.log("Existing swagger.json found, updating...");

      // Get existing content
      const existingContent = JSON.parse(
        fs.readFileSync(swaggerFile, "utf8")
      ) as OpenAPIDocument;

      // Generate new specs based on JSDoc comments
      const newSpecs = swaggerJsDoc(options) as OpenAPIDocument;

      // Merge existing paths with new paths
      specs = {
        ...newSpecs,
        paths: {
          ...existingContent.paths,
          ...newSpecs.paths,
        },
        components: {
          ...existingContent.components,
          ...newSpecs.components,
          schemas: {
            ...existingContent.components?.schemas,
            ...newSpecs.components?.schemas,
          },
        },
      };
    } else {
      console.log("No existing swagger.json found, creating new file...");
      // Generate new specs
      specs = swaggerJsDoc(options) as OpenAPIDocument;
    }

    // Write to file
    fs.writeFileSync(swaggerFile, JSON.stringify(specs, null, 2));

    console.log(
      "\x1b[32m%s\x1b[0m",
      `✅ Swagger documentation generated at ${swaggerFile}`
    );
    logger.info(`Swagger documentation generated at ${swaggerFile}`);
  } catch (error) {
    console.error(
      "\x1b[31m%s\x1b[0m",
      `❌ Error generating Swagger documentation: ${error}`
    );
    logger.error("Error generating Swagger documentation:", error);
    process.exit(1);
  }
};

// Run the generator
generateDocs();
