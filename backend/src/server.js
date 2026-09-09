import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { dbConfig, testConnection } from './db.js';
import { authRouter } from './routes/auth.js';
import { catalogRouter } from './routes/catalog.js';

const app = express();
const port = Number(process.env.PORT || 4000);
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

app.use(
  cors({
    origin: frontendOrigin,
  }),
);
app.use(express.json());

app.get('/api/health', async (_request, response) => {
  try {
    await testConnection();
    response.json({
      ok: true,
      database: dbConfig.database,
    });
  } catch (error) {
    response.status(500).json({
      ok: false,
      error: 'MySQL no responde.',
      detail: error.message,
    });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/catalog', catalogRouter);

app.listen(port, async () => {
  console.log(`API Velora en http://localhost:${port}`);
  try {
    await testConnection();
    console.log(
      `MySQL conectado: ${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`,
    );
  } catch (error) {
    console.error('No se pudo abrir MySQL.');
    console.error(error.message);
  }
});
