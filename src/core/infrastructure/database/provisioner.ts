import { Client } from 'pg';
import { env } from '../../config/env.config';

export async function ensureDatabaseExists(): Promise<void> {
  const rootClient = new Client({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_ROOT_USER,
    password: env.DB_ROOT_PASSWORD,
    database: 'postgres', // Connect to default DB
  });

  try {
    await rootClient.connect();

    // Check if database exists
    const result = await rootClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [env.DB_NAME],
    );

    if (result.rowCount === 0) {
      console.log(`📦 Creating database: ${env.DB_NAME}`);
      await rootClient.query(`CREATE DATABASE "${env.DB_NAME}"`);
      console.log(`✅ Database created successfully`);
    } else {
      console.log(`✅ Database ${env.DB_NAME} already exists`);
    }

    // Create application user if it doesn't exist
    try {
      await rootClient.query(
        `CREATE USER "${env.DB_USER}" WITH PASSWORD '${env.DB_PASSWORD}'`,
      );
      console.log(`✅ Database user ${env.DB_USER} created`);
    } catch (error: any) {
      if (error.code === '42710') {
        // user already exists
        console.log(`✅ Database user ${env.DB_USER} already exists`);
      } else {
        throw error;
      }
    }

    // Grant privileges
    await rootClient.query(
      `GRANT ALL PRIVILEGES ON DATABASE "${env.DB_NAME}" TO "${env.DB_USER}"`,
    );
    await rootClient.query(`GRANT ALL ON SCHEMA public TO "${env.DB_USER}"`);
    await rootClient.query(
      `GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "${env.DB_USER}"`,
    );
    await rootClient.query(
      `GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "${env.DB_USER}"`,
    );
    console.log(`✅ Privileges granted to ${env.DB_USER}`);
  } catch (error) {
    console.error('❌ Database provisioning failed:', error);
    throw error;
  } finally {
    await rootClient.end();
  }
}
