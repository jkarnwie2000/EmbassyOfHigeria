// Starts a throwaway PostgreSQL (embedded-postgres), applies migrations and seeds it.
// Set TEST_DATABASE_URL to use an existing PostgreSQL server instead (e.g. in CI).
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import EmbeddedPostgres from 'embedded-postgres';

export default async function setup() {
  let pg;
  const url = process.env.TEST_DATABASE_URL || 'postgresql://embassy:embassy@localhost:5434/embassy_test';
  if (!process.env.TEST_DATABASE_URL) {
    const dir = path.resolve('.test-postgres');
    fs.rmSync(dir, { recursive: true, force: true });
    pg = new EmbeddedPostgres({ databaseDir: dir, user: 'embassy', password: 'embassy', port: 5434, persistent: false, onLog: () => {} });
    await pg.initialise();
    await pg.start();
    await pg.createDatabase('embassy_test');
  }
  fs.rmSync(path.resolve('.test-storage'), { recursive: true, force: true });

  const env = { ...process.env, DATABASE_URL: url };
  // The embedded database is created empty above, so applying migrations is enough.
  // (When TEST_DATABASE_URL is used, point it at a dedicated, empty test database.)
  execSync('npx prisma migrate deploy', { env, stdio: 'pipe' });
  execSync('node prisma/seed.mjs', { env, stdio: 'pipe' });

  return async () => {
    if (pg) await pg.stop();
    fs.rmSync(path.resolve('.test-storage'), { recursive: true, force: true });
  };
}
