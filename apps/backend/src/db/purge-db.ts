import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { sql } from 'drizzle-orm';

async function purge() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://user:password@localhost:5432/workforce_db';

  const pool = new Pool({ connectionString });
  const db = drizzle(pool, { schema });

  console.log('--- Database Purge Started ---');

  try {
    // Disable triggers/constraints for cleaner truncation if needed,
    // but truncating in order is safer.
    console.log('Truncating tables...');

    // shifts references employees, so truncate shifts first or use cascade
    await db.execute(sql`TRUNCATE TABLE "shifts" CASCADE`);
    await db.execute(sql`TRUNCATE TABLE "employees" CASCADE`);
    await db.execute(sql`TRUNCATE TABLE "sync_runs" CASCADE`);

    console.log('Success: All tables have been purged.');
  } catch (error) {
    console.error('Error: Failed to purge database:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('--- Database Purge Finished ---');
  }
}

void purge();
