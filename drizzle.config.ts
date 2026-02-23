import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL || "file:./data/crm.db";
// For SQLite, DATABASE_URL can be a file path or omitted for default

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: connectionString,
  },
});
