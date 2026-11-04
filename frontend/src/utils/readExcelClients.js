import * as XLSX from 'xlsx';

function normalizeKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}

export function isExcelFile(file) {
  if (!file) return false;
  const name = file.name.toLowerCase();
  return name.endsWith('.xlsx') || name.endsWith('.xls');
}

export async function readExcelClients(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

  return rawRows.map((row, index) => {
    const mapped = {};
    Object.entries(row).forEach(([key, value]) => {
      mapped[normalizeKey(key)] = value;
    });

    return {
      line: index + 2,
      nombres: String(mapped.nombres || '').trim(),
      apellidos: String(mapped.apellidos || '').trim(),
      correo: String(mapped.correo || '').trim(),
      telefono: String(mapped.telefono || '').trim(),
      ciudad: String(mapped.ciudad || '').trim(),
      tipo_documento: String(mapped.tipo_documento || '').trim(),
      numero_documento: String(mapped.numero_documento || '').trim(),
      fecha_nacimiento: String(mapped.fecha_nacimiento || '').trim(),
      contrasena: String(mapped.contrasena || '').trim(),
    };
  });
}
