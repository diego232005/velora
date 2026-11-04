import { listDriveFolderFiles, mapDriveFiles } from './googleDrive.js';

/** Archivo Drive (sin .png) → claves de equipo */
const FILE_ALIASES = {
  aguilas_doradas: ['aguilas doradas', 'aguilas', 'agu'],
  alianza: ['alianza', 'ali'],
  alianza_petrolera: ['alianza petrolera'],
  america: ['america de cali', 'america', 'ame'],
  atlnacional: ['atletico nacional', 'nacional', 'nac'],
  boyacachico: ['boyaca chico', 'boyaca', 'boy'],
  bucaramanga: ['atletico bucaramanga', 'bucaramanga', 'buc'],
  cucuta: ['cucuta deportivo', 'cucuta', 'cuc'],
  depcali: ['deportivo cali', 'cali', 'cal'],
  dim: ['independiente medellin', 'medellin', 'dim'],
  fortaleza: ['fortaleza', 'for'],
  internacional_bogota: ['internacional de bogota', 'internacional', 'idb'],
  jaguares: ['jaguares', 'jag'],
  junior: ['junior', 'jun'],
  llaneros: ['llaneros', 'lla'],
  millonarios: ['millonarios', 'mil'],
  oncecaldas: ['once caldas', 'onc'],
  pasto: ['deportivo pasto', 'pasto', 'pas'],
  pereira: ['deportivo pereira', 'pereira', 'per'],
  santafe: ['independiente santa fe', 'santa fe', 'sfe'],
  tolima: ['deportes tolima', 'tolima', 'tol'],
};

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

let cache = { at: 0, byKey: new Map() };

export function shieldsFolderId() {
  return (
    process.env.GOOGLE_DRIVE_SHIELDS_FOLDER_ID ||
    process.env.GOOGLE_DRIVE_PRIMERA_A_FOLDER_ID ||
    '1rqK5_doVELFZH_X8877s-Wk5r_C7Mq7m'
  );
}

export function profilesFolderId() {
  return (
    process.env.GOOGLE_DRIVE_PROFILES_FOLDER_ID ||
    '1D_vKAGeZxr0fodjpVLt35JqJUo7VyXlY'
  );
}

export async function getCrestLookup(force = false) {
  const now = Date.now();
  if (!force && cache.byKey.size && now - cache.at < 5 * 60_000) {
    return cache.byKey;
  }

  const listed = await listDriveFolderFiles({ folderId: shieldsFolderId() });
  const files = mapDriveFiles(listed.files || [], 'shields');
  const byKey = new Map();

  for (const file of files) {
    const base = String(file.name || '')
      .replace(/\.[^.]+$/, '')
      .toLowerCase();
    const url = file.id ? `/api/drive/file/${file.id}` : null;
    if (!url) continue;
    const aliases = FILE_ALIASES[base] || [base.replace(/_/g, ' ')];
    for (const alias of aliases) {
      byKey.set(normalize(alias), { url, fileId: file.id, name: file.name });
    }
    byKey.set(normalize(base.replace(/_/g, ' ')), {
      url,
      fileId: file.id,
      name: file.name,
    });
  }

  cache = { at: now, byKey };
  return byKey;
}

export async function resolveCrestUrl({ name, short, id }) {
  try {
    const lookup = await getCrestLookup();
    const keys = [name, short, id != null ? String(id) : '']
      .map(normalize)
      .filter(Boolean);
    for (const key of keys) {
      if (lookup.has(key)) return lookup.get(key).url;
    }
    // coincidencia parcial por nombre
    const nameKey = normalize(name);
    for (const [key, value] of lookup.entries()) {
      if (nameKey.includes(key) || key.includes(nameKey)) return value.url;
    }
  } catch (error) {
    console.warn('resolveCrestUrl:', error.message);
  }
  return null;
}

export async function attachCrestsToTeams(teams) {
  const lookup = await getCrestLookup().catch(() => new Map());
  return teams.map((team) => {
    const keys = [team.name, team.short, team.nombre, team.sigla]
      .map(normalize)
      .filter(Boolean);
    let crestUrl = null;
    for (const key of keys) {
      if (lookup.has(key)) {
        crestUrl = lookup.get(key).url;
        break;
      }
    }
    if (!crestUrl) {
      const nameKey = normalize(team.name || team.nombre);
      for (const [key, value] of lookup.entries()) {
        if (nameKey && (nameKey.includes(key) || key.includes(nameKey))) {
          crestUrl = value.url;
          break;
        }
      }
    }
    return { ...team, crestUrl };
  });
}
