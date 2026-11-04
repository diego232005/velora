import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import express from 'express';
import http from 'http';
import swaggerUi from 'swagger-ui-express';
import { dbConfig, probeAllDatabases, testConnection } from './db.js';
import { authRouter } from './routes/auth.js';
import { bulkRouter } from './routes/bulk.js';
import { catalogRouter } from './routes/catalog.js';
import { sportsRouter } from './routes/sports.js';
import { betsRouter } from './routes/bets.js';
import { walletRouter } from './routes/wallet.js';
import { paymentsRouter } from './routes/payments.js';
import { oauthRouter } from './routes/oauth.js';
import { driveRouter } from './routes/drive.js';
import { adminRouter } from './routes/admin.js';
import { openApiSpec } from './swagger/openapi.js';
import { attachWebSockets, broadcast } from './ws/hub.js';
import { ensurePostgresSchema } from './db/postgres.js';
import { syncSportsFromMysqlToPostgres } from './services/syncSports.js';
import { initFirebase } from './db/firebase.js';

const app = express();
const port = Number(process.env.PORT || 4000);
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const publicFrontendOrigin = process.env.PUBLIC_FRONTEND_ORIGIN || '';
const corsOrigins = [frontendOrigin, publicFrontendOrigin].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, corsOrigins[0]);
    },
  }),
);
app.use(express.json({ limit: '2mb' }));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(
  '/uploads',
  express.static(path.resolve(__dirname, '../uploads'), {
    maxAge: '1d',
    fallthrough: true,
  }),
);

app.get('/api/health', async (request, response) => {
  const wantAll = request.query.all === '1' || request.query.all === 'true';
  try {
    await testConnection();
    const payload = {
      ok: true,
      database: dbConfig.database,
      websockets: true,
      swagger: '/api/docs',
    };
    if (wantAll) {
      payload.engines = await probeAllDatabases();
    }
    response.json(payload);
  } catch (error) {
    response.status(500).json({
      ok: false,
      error: 'MySQL no responde.',
      detail: error.message,
    });
  }
});

app.get('/api/openapi.json', (_request, response) => {
  response.json(openApiSpec);
});
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.use('/api/auth', authRouter);
app.use('/api/catalog', catalogRouter);
app.use('/api/bulk', bulkRouter);
app.use('/api/sports', sportsRouter);
app.use('/api/bets', betsRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/oauth', oauthRouter);
app.use('/api/drive', driveRouter);
app.use('/api/admin', adminRouter);

app.use((error, _request, response, _next) => {
  console.error('Unhandled:', error);
  response.status(500).json({ ok: false, error: 'Error interno.' });
});

const server = http.createServer(app);
attachWebSockets(server);

server.listen(port, async () => {
  console.log(`API Velora en http://localhost:${port}`);
  console.log(`Swagger UI: http://localhost:${port}/api/docs`);
  console.log(`WebSocket: ws://localhost:${port}/ws`);

  try {
    await testConnection();
    console.log(
      `MySQL conectado: ${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`,
    );
  } catch (error) {
    console.error('No se pudo abrir MySQL.', error.message);
  }

  try {
    const fb = await initFirebase();
    console.log('Firebase:', fb.mode, fb.projectId || '', fb.detail || '');
  } catch (error) {
    console.warn('Firebase diferido:', error.message);
  }

  try {
    await ensurePostgresSchema();
    const sync = await syncSportsFromMysqlToPostgres();
    console.log('Sync MySQL→PostgreSQL:', sync);
    broadcast('matches', { type: 'sync.completed', ...sync });
  } catch (error) {
    console.warn('PostgreSQL sync diferido:', error.message);
  }
});
