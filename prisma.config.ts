import "dotenv/config";
import { defineConfig } from "prisma/config";

// Generate does not connect to the DB; a placeholder is enough when DATABASE_URL
// is missing during Vercel install/build before env vars are injected.
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:5432/postgres?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});
