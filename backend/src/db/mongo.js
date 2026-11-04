import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const dbName = process.env.MONGO_DB || 'velora_audit';
const connectTimeoutMS = Number(process.env.MONGO_CONNECT_TIMEOUT_MS || 1500);

let client;
let db;
let unavailableUntil = 0;

export async function getMongo() {
  if (db) return db;
  if (Date.now() < unavailableUntil) {
    throw new Error('MongoDB temporalmente no disponible');
  }
  client = new MongoClient(uri, {
    serverSelectionTimeoutMS: connectTimeoutMS,
    connectTimeoutMS,
  });
  try {
    await client.connect();
    db = client.db(dbName);
    await db.collection('domain_events').createIndex({ type: 1, createdAt: -1 });
    await db.collection('change_log').createIndex({ entity: 1, entityId: 1, at: -1 });
    return db;
  } catch (error) {
    unavailableUntil = Date.now() + 30_000;
    db = undefined;
    client = undefined;
    throw error;
  }
}

export async function testMongo() {
  const database = await getMongo();
  await database.command({ ping: 1 });
  return { ok: true, engine: 'mongodb', database: dbName };
}

export async function writeDomainEvent(event) {
  try {
    const database = await getMongo();
    const doc = {
      type: event.type,
      aggregate: event.aggregate,
      aggregateId: event.aggregateId,
      payload: event.payload || {},
      actorId: event.actorId ?? null,
      createdAt: new Date(),
    };
    await database.collection('domain_events').insertOne(doc);
    return doc;
  } catch (error) {
    return { skipped: true, reason: error.message };
  }
}
