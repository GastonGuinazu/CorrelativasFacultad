/**
 * Cliente mínimo Google Sheets API v4 (fetch + API key).
 */

const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

/**
 * @param {string} title
 */
export function escapeSheetTitle(title) {
  return `'${String(title).replace(/'/g, "''")}'`;
}

/**
 * @param {object} rgbColor
 * @returns {string|null}
 */
export function bgKeyFromColor(rgbColor) {
  if (!rgbColor || typeof rgbColor !== 'object') return null;
  const r = rgbColor.red ?? 0;
  const g = rgbColor.green ?? 0;
  const b = rgbColor.blue ?? 0;
  const R = Math.round(r * 255);
  const G = Math.round(g * 255);
  const B = Math.round(b * 255);
  // Tratar blanco / casi blanco como sin color semántico
  if (R >= 245 && G >= 245 && B >= 245) return null;
  return `${R},${G},${B}`;
}

/**
 * @typedef {{ sheetId: number, title: string, hidden: boolean }} SheetMeta
 */

/**
 * @param {string} spreadsheetId
 * @param {string} apiKey
 * @returns {Promise<{ spreadsheetId: string, sheets: SheetMeta[] }>}
 */
export async function fetchSpreadsheetMeta(spreadsheetId, apiKey) {
  const fields = encodeURIComponent('sheets(properties(sheetId,title,hidden))');
  const url = `${SHEETS_BASE}/${spreadsheetId}?fields=${fields}&key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Sheets API meta ${res.status}: ${errText}`);
  }
  const data = await res.json();
  const sheets = (data.sheets ?? []).map((s) => ({
    sheetId: s.properties.sheetId,
    title: s.properties.title ?? '',
    hidden: Boolean(s.properties.hidden)
  }));
  return { spreadsheetId: data.spreadsheetId ?? spreadsheetId, sheets };
}

/**
 * @param {string} spreadsheetId
 * @param {string} apiKey
 * @param {string[]} ranges A1 notation ranges including quoted sheet titles
 * @returns {Promise<object>} respuesta completa (incluye sheets[].data con grid)
 */
export async function fetchSpreadsheetGrid(spreadsheetId, apiKey, ranges) {
  const params = new URLSearchParams();
  params.set('key', apiKey);
  // Sin `fields`: respuesta completa por rango (celdas con formattedValue + effectiveFormat para color).
  params.set('includeGridData', 'true');
  for (const r of ranges) {
    params.append('ranges', r);
  }
  const url = `${SHEETS_BASE}/${spreadsheetId}?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Sheets API grid ${res.status}: ${errText}`);
  }
  return res.json();
}
