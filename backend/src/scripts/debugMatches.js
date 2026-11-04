import 'dotenv/config';
import { pool } from '../db.js';

const [t] = await pool.query('DESCRIBE temporada');
console.log('temporada', t.map((c) => c.Field).join(','));
const [tor] = await pool.query('DESCRIBE torneo');
console.log('torneo', tor.map((c) => c.Field).join(','));
const [lig] = await pool.query('DESCRIBE liga');
console.log('liga', lig.map((c) => c.Field).join(','));
const [eq] = await pool.query('DESCRIBE equipo');
console.log('equipo', eq.map((c) => c.Field).join(','));

try {
  const [rows] = await pool.execute(
    `SELECT p.id_partido AS id, lig.nombre AS leagueName
     FROM partido p
     INNER JOIN estado_partido ep ON ep.id_estado_partido = p.id_estado_partido
     INNER JOIN equipo loc ON loc.id_equipo = p.id_equipo_local
     INNER JOIN equipo vis ON vis.id_equipo = p.id_equipo_visitante
     INNER JOIN jornada j ON j.id_jornada = p.id_jornada
     INNER JOIN torneo t ON t.id_torneo = j.id_torneo
     INNER JOIN temporada tem ON tem.id_temporada = t.id_temporada
     INNER JOIN liga lig ON lig.id_liga = tem.id_liga
     LIMIT 5`,
  );
  console.log('join ok', rows);
} catch (error) {
  console.log('ERR', error.code, error.sqlMessage || error.message);
}

process.exit(0);
