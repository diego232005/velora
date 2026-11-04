import 'dotenv/config';
import { pgPool } from '../db/postgres.js';

const r = await pgPool.query(
  `SELECT referencia, estado, monto_centavos, id_usuario, wompi_id, creado_en
   FROM wompi_transaccion ORDER BY id DESC LIMIT 15`,
);
console.log(JSON.stringify(r.rows, null, 2));
await pgPool.end();
