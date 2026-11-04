import 'dotenv/config';
import { pgPool } from '../db/postgres.js';
import { mysqlPool } from '../db/mysql.js';

const cups = await pgPool.query(
  `SELECT id_cupon, estado, monto_centavos, cuota_total_millis, ganancia_potencial_centavos, creado_en
   FROM cupon ORDER BY id_cupon DESC LIMIT 10`,
);
console.log('cupones', cups.rows);

for (const c of cups.rows) {
  const legs = await pgPool.query(
    `SELECT cs.id_seleccion, cs.cuota_millis, s.etiqueta, s.estado AS sel_estado,
            m.nombre AS mercado, m.id_partido, m.tipo_codigo,
            p.goles_local, p.goles_visitante, p.id_equipo_local, p.id_equipo_visitante, p.estado
     FROM cupon_seleccion cs
     JOIN seleccion_ops s ON s.id_seleccion = cs.id_seleccion
     JOIN mercado_ops m ON m.id_mercado = s.id_mercado
     JOIN partido_ops p ON p.id_partido = m.id_partido
     WHERE cs.id_cupon = $1`,
    [c.id_cupon],
  );
  console.log(`--- cupon ${c.id_cupon} ---`, legs.rows);
}

const [matches] = await mysqlPool.execute(
  `SELECT p.id_partido,
          loc.nombre AS local_n, loc.sigla AS local_s,
          vis.nombre AS visit_n, vis.sigla AS visit_s,
          s.etiqueta, s.cuota, s.id_seleccion
   FROM partido p
   JOIN equipo loc ON loc.id_equipo = p.id_equipo_local
   JOIN equipo vis ON vis.id_equipo = p.id_equipo_visitante
   JOIN mercado m ON m.id_partido = p.id_partido
   JOIN tipo_mercado tm ON tm.id_tipo_mercado = m.id_tipo_mercado AND tm.codigo = '1X2'
   JOIN seleccion s ON s.id_mercado = m.id_mercado
   WHERE (loc.nombre LIKE '%America%' AND vis.nombre LIKE '%Nacional%')
      OR (loc.nombre LIKE '%Nacional%' AND vis.nombre LIKE '%America%')
   ORDER BY p.id_partido, s.id_seleccion`,
);
console.log('america-nacional 1X2', matches);

await pgPool.end();
await mysqlPool.end();
