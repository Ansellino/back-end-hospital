import { up as initMigration } from "./001_init";

export const runMigrations = () => {
  initMigration();
  // Run other migrations here
};
