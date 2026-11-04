import 'dotenv/config';
import { ensurePostgresSchema } from '../db/postgres.js';
import { syncSportsFromMysqlToPostgres } from '../services/syncSports.js';

await ensurePostgresSchema();
const result = await syncSportsFromMysqlToPostgres();
console.log(JSON.stringify(result, null, 2));
process.exit(0);
