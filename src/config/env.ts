import dotenv from "dotenv";
import { exit } from "process";

// Load environment first
dotenv.config({ path: __dirname + "/../../.env" }); // Explicit path

// Validasi wajib untuk environment variables
const validateEnv = () => {
  if (!process.env.JWT_SECRET) {
    console.error("❌ Fatal Error: JWT_SECRET tidak di-set di environment");
    exit(1);
  }
};

validateEnv(); // Jalankan validasi segera

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "5000"),
  JWT_SECRET: process.env.JWT_SECRET as string, // Type assertion
  JWT_EXPIRATION: process.env.JWT_EXPIRATION || "24h",
  DB_PATH: process.env.DB_PATH || "./database.sqlite",
};

export function assertValidEnv() {
  if (!env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
}
