/** @deprecated Prefer `./db/index.js` — se mantiene para imports legacy. */
export {
  dbConfig,
  pool,
  testConnection,
  mysqlPool,
  pgPool,
  probeAllDatabases,
  writeDomainEvent,
} from './db/index.js';
