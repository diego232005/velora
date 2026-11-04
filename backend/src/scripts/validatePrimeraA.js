/**
 * Valida catálogo Primera A (20 equipos) y partidos local ≠ visitante.
 * Uso: node src/scripts/validatePrimeraA.js
 */
import 'dotenv/config';
import { mysqlPool } from '../db/mysql.js';
import { PRIMERA_A_TEAMS } from '../constants/primeraA.js';

const [teams] = await mysqlPool.execute(
  `SELECT id_equipo, nombre, sigla, activo_primera FROM equipo WHERE activo_primera=1 ORDER BY id_equipo`,
);
const expected = new Set(PRIMERA_A_TEAMS.map((t) => t.id));
const found = new Set(teams.map((t) => t.id_equipo));

const missing = [...expected].filter((id) => !found.has(id));
const extra = [...found].filter((id) => !expected.has(id));

const [bad] = await mysqlPool.execute(
  `SELECT id_partido, id_equipo_local, id_equipo_visitante
   FROM partido WHERE id_equipo_local = id_equipo_visitante`,
);

console.log({
  equiposActivos: teams.length,
  esperado: 20,
  missing,
  extra,
  partidosMismoEquipo: bad.length,
  ok: teams.length === 20 && missing.length === 0 && bad.length === 0,
});

await mysqlPool.end();
process.exit(missing.length || extra.length || bad.length ? 1 : 0);
