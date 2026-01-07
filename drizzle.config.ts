import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: [
    './src/modules/**/*.schema.ts',
    './src/core/infrastructure/database/*.schema.ts',
  ],
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'stratos',
    password: process.env.DB_PASSWORD || 'dxmNKUx3$#er',
    database: process.env.DB_NAME || 'saas_prod',
    ssl: false,
  },
});
