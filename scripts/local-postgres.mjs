// Runs a real PostgreSQL server locally without Docker (development convenience).
// Usage: npm run db:local   → postgresql://embassy:embassy@localhost:5433/embassy
import fs from 'node:fs';
import path from 'node:path';
import EmbeddedPostgres from 'embedded-postgres';

const dir = path.resolve(process.argv[2] || '.local-postgres');
const port = Number(process.argv[3] || 5433);
const dbName = process.argv[4] || 'embassy';

const pg = new EmbeddedPostgres({
  databaseDir: dir,
  user: 'embassy',
  password: 'embassy',
  port,
  persistent: true,
  onLog: () => {},
});

const fresh = !fs.existsSync(path.join(dir, 'PG_VERSION'));
if (fresh) await pg.initialise();
await pg.start();
if (fresh) {
  try {
    await pg.createDatabase(dbName);
  } catch (e) {
    if (!String(e.message).includes('already exists')) throw e;
  }
}
console.log(`PostgreSQL ready: postgresql://embassy:embassy@localhost:${port}/${dbName}`);
console.log('Press Ctrl+C to stop.');

const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
