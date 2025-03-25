import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  JWT_SECRET: process.env.JWT_SECRET || "your_default_secret_key",
  JWT_EXPIRATION: process.env.JWT_EXPIRATION || "24h",
  DB_PATH: process.env.DB_PATH || "./database.sqlite",
};
