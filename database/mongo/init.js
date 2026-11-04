db = db.getSiblingDB('velora_audit');

db.createCollection('domain_events', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['type', 'aggregate', 'aggregateId', 'payload', 'createdAt'],
      properties: {
        type: { bsonType: 'string' },
        aggregate: { bsonType: 'string' },
        aggregateId: { bsonType: ['string', 'int', 'long'] },
        payload: { bsonType: 'object' },
        actorId: { bsonType: ['int', 'null'] },
        createdAt: { bsonType: 'date' },
      },
    },
  },
});

db.createCollection('change_log');
db.createCollection('import_runs');

db.domain_events.createIndex({ type: 1, createdAt: -1 });
db.domain_events.createIndex({ aggregate: 1, aggregateId: 1 });
db.change_log.createIndex({ entity: 1, entityId: 1, at: -1 });
db.import_runs.createIndex({ startedAt: -1 });

db.domain_events.insertOne({
  type: 'system.bootstrap',
  aggregate: 'platform',
  aggregateId: 'velora',
  payload: { message: 'Mongo audit store initialized' },
  actorId: null,
  createdAt: new Date(),
});
