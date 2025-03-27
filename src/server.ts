import app from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";

// Define a custom interface for Node.js errors
interface NodeJSError extends Error {
  code?: string;
}

const PORT = env.PORT || 5001; // Try alternative port if default is in use

const server = app
  .listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(
      `API documentation available at http://localhost:${PORT}/api-docs`
    );
  })
  .on("error", (e: NodeJSError) => {
    if (e.code === "EACCES") {
      logger.error(`Port ${PORT} requires elevated privileges`);
    } else if (e.code === "EADDRINUSE") {
      logger.error(`Port ${PORT} is already in use. Try a different port.`);
      // Try alternative port automatically
      const altPort = PORT + 1;
      logger.info(`Attempting to use alternative port: ${altPort}`);
      app.listen(altPort, () => {
        logger.info(`Server now running on port ${altPort}`);
        logger.info(
          `API documentation available at http://localhost:${altPort}/api-docs`
        );
      });
    } else {
      logger.error(`Error starting server: ${e.message}`);
    }
  });

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    logger.info("HTTP server closed");
  });
});
