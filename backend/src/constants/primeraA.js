/** 20 clubes oficiales Categoría Primera A (Liga BetPlay) — ids del seed MySQL. */
export const PRIMERA_A_TEAMS = [
  { id: 1, sigla: 'AGU', nombre: 'Aguilas Doradas' },
  { id: 2, sigla: 'ALI', nombre: 'Alianza' },
  { id: 3, sigla: 'AME', nombre: 'America de Cali' },
  { id: 4, sigla: 'BUC', nombre: 'Atletico Bucaramanga' },
  { id: 5, sigla: 'NAC', nombre: 'Atletico Nacional' },
  { id: 6, sigla: 'BOY', nombre: 'Boyaca Chico' },
  { id: 7, sigla: 'CUC', nombre: 'Cucuta Deportivo' },
  { id: 8, sigla: 'TOL', nombre: 'Deportes Tolima' },
  { id: 9, sigla: 'CAL', nombre: 'Deportivo Cali' },
  { id: 10, sigla: 'PAS', nombre: 'Deportivo Pasto' },
  { id: 11, sigla: 'PER', nombre: 'Deportivo Pereira' },
  { id: 12, sigla: 'FOR', nombre: 'Fortaleza' },
  { id: 13, sigla: 'DIM', nombre: 'Independiente Medellin' },
  { id: 14, sigla: 'IDB', nombre: 'Internacional de Bogota' },
  { id: 15, sigla: 'JAG', nombre: 'Jaguares' },
  { id: 16, sigla: 'JUN', nombre: 'Junior' },
  { id: 17, sigla: 'LLA', nombre: 'Llaneros' },
  { id: 18, sigla: 'MIL', nombre: 'Millonarios' },
  { id: 19, sigla: 'ONC', nombre: 'Once Caldas' },
  { id: 20, sigla: 'SFE', nombre: 'Independiente Santa Fe' },
];

export const PRIMERA_A_IDS = new Set(PRIMERA_A_TEAMS.map((t) => t.id));

export function assertDistinctTeams(homeId, awayId) {
  const home = Number(homeId);
  const away = Number(awayId);
  if (!Number.isInteger(home) || !Number.isInteger(away)) {
    const err = new Error('Equipos local y visitante inválidos.');
    err.status = 400;
    throw err;
  }
  if (home === away) {
    const err = new Error(
      'No se puede programar un partido con el mismo equipo como local y visitante.',
    );
    err.status = 400;
    throw err;
  }
  return { home, away };
}

export function assertPrimeraATeam(teamId) {
  const id = Number(teamId);
  if (!PRIMERA_A_IDS.has(id)) {
    const err = new Error(
      `El equipo ${id} no pertenece a la Categoría Primera A (Liga BetPlay).`,
    );
    err.status = 400;
    throw err;
  }
  return id;
}

/** Estados PG en los que ya no se aceptan apuestas. */
export const MATCH_STATES_CLOSED_FOR_BETS = new Set([
  'en_vivo',
  'finalizado',
  'cancelado',
  'aplazado',
  'suspendido',
]);
