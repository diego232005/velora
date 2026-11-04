import 'dotenv/config';
import { mysqlPool } from '../db/mysql.js';

const [r] = await mysqlPool.execute(
  `SELECT s.id_seleccion, s.etiqueta, m.nombre, tm.codigo, m.id_partido
   FROM seleccion s
   JOIN mercado m ON m.id_mercado=s.id_mercado
   JOIN tipo_mercado tm ON tm.id_tipo_mercado=m.id_tipo_mercado
   WHERE m.id_partido=1
   ORDER BY m.id_mercado,s.id_seleccion`,
);
console.log(r);
await mysqlPool.end();
