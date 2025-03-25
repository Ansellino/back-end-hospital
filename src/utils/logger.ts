enum LogLevel {
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  DEBUG = "DEBUG",
}

export const logger = {
  info: (message: string, meta?: any) => {
    console.log(
      `[${LogLevel.INFO}] ${message}`,
      meta ? JSON.stringify(meta) : ""
    );
  },
  warn: (message: string, meta?: any) => {
    console.warn(
      `[${LogLevel.WARN}] ${message}`,
      meta ? JSON.stringify(meta) : ""
    );
  },
  error: (message: string, meta?: any) => {
    console.error(
      `[${LogLevel.ERROR}] ${message}`,
      meta ? JSON.stringify(meta) : ""
    );
  },
  debug: (message: string, meta?: any) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(
        `[${LogLevel.DEBUG}] ${message}`,
        meta ? JSON.stringify(meta) : ""
      );
    }
  },
};
