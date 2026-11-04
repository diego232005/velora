import { mysqlConfig, mysqlPool, testMysql } from './mysql.js';
import { ensurePostgresSchema, pgPool, postgresConfig, testPostgres } from './postgres.js';
import { ensureMssqlSchema, getMssqlPool, mssqlConfig, testMssql } from './mssql.js';
import { getMongo, testMongo, writeDomainEvent } from './mongo.js';
import { getFirebaseMode, initFirebase, pushUserNotification, testFirebase } from './firebase.js';

export {
  mysqlConfig,
  mysqlPool,
  pgPool,
  postgresConfig,
  mssqlConfig,
  getMssqlPool,
  getMongo,
  writeDomainEvent,
  pushUserNotification,
  getFirebaseMode,
};

/** Compatibilidad con imports legacy `from './db.js'` */
export const dbConfig = mysqlConfig;
export const pool = mysqlPool;
export const testConnection = testMysql;

export async function probeAllDatabases() {
  const results = {};

  try {
    results.mysql = await testMysql();
  } catch (error) {
    results.mysql = { ok: false, engine: 'mysql', error: error.message };
  }

  try {
    await ensurePostgresSchema();
    results.postgresql = await testPostgres();
  } catch (error) {
    results.postgresql = { ok: false, engine: 'postgresql', error: error.message };
  }

  try {
    await ensureMssqlSchema();
    results.mssql = await testMssql();
  } catch (error) {
    results.mssql = { ok: false, engine: 'mssql', error: error.message };
  }

  try {
    results.mongodb = await testMongo();
  } catch (error) {
    results.mongodb = { ok: false, engine: 'mongodb', error: error.message };
  }

  try {
    await initFirebase();
    results.firebase = await testFirebase();
  } catch (error) {
    results.firebase = { ok: false, engine: 'firebase', error: error.message };
  }

  return results;
}
