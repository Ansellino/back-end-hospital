import app from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";

const PORT = env.PORT;

app.listen(PORT, () => {
  logger.info(`Server running in ${env.NODE_ENV} mode on port ${PORT}`);
});
