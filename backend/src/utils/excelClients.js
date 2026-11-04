import * as XLSX from 'xlsx';
import { CLIENT_HEADERS } from '../data/randomClients.js';

function normalizeKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}

function excelDate(value) {
  if (!value && value !== 0) return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return '';
    const month = String(parsed.m).padStart(2, '0');
    const day = String(parsed.d).padStart(2, '0');
    return `${parsed.y}-${month}-${day}`;
  }
  return String(value).trim().slice(0, 10);
}

export function workbookFromRows(rows) {
  const sheetRows = [CLIENT_HEADERS, ...rows.map((row) => CLIENT_HEADERS.map((key) => row[key]))];
  const sheet = XLSX.utils.aoa_to_sheet(sheetRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Clientes');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export function parseClientWorkbook(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json(firstSheet, { defval: '', raw: false });

  return rawRows.map((row, index) => {
    const mapped = {};
    Object.entries(row).forEach(([key, value]) => {
      mapped[normalizeKey(key)] = value;
    });

    return {
      line: index + 2,
      nombres: String(mapped.nombres || '').trim(),
      apellidos: String(mapped.apellidos || '').trim(),
      correo: String(mapped.correo || '').trim().toLowerCase(),
      telefono: String(mapped.telefono || '').trim(),
      ciudad: String(mapped.ciudad || '').trim(),
      tipo_documento: String(mapped.tipo_documento || '').trim(),
      numero_documento: String(mapped.numero_documento || '').replace(/\D/g, ''),
      fecha_nacimiento: excelDate(mapped.fecha_nacimiento),
      contrasena: String(mapped.contrasena || '').trim(),
    };
  });
}
