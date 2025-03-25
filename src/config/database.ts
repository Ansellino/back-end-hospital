import { env } from "./env";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Ensure the directory exists
const dbDir = path.dirname(env.DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(env.DB_PATH, {
  verbose: console.log, // This will log all SQL statements
});

// Enable foreign keys
db.pragma("foreign_keys = ON");

export default db;
