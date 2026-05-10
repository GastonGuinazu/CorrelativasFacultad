#!/usr/bin/env node
/**
 * Descarga una planilla UTN y genera JSON en `public/data/`.
 *
 * Uso: `node scripts/horarios/build-horarios.mjs [quinto|cuarto|tercero|segundo|primero]`
 * Por defecto: quinto (compatibilidad con `npm run horarios:fetch`).
 *
 * Requiere: `GOOGLE_SHEETS_API_KEY` con Sheets API habilitada en Google Cloud.
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { fetchSpreadsheetMeta, fetchSpreadsheetGrid, escapeSheetTitle } from './sheets-api.mjs';
import { parseSheetTab } from './parse-grid.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

/** @typedef {{ spreadsheetId: string; aliasesFile: string; configFile: string; outputRel: string; anioCursado: number; label: string }} HorariosPreset */

/** @type {Record<string, HorariosPreset>} */
const PRESETS = {
  quinto: {
    spreadsheetId: '16VWvLd2raHPeOWuqvDe2vx-ZpgiQebq8T6xMNxxkOiI',
    aliasesFile: 'aliases-v5.json',
    configFile: 'config-quinto.json',
    outputRel: join('public', 'data', 'horarios-quinto.generated.json'),
    anioCursado: 5,
    label: '5.º año'
  },
  cuarto: {
    spreadsheetId: '1d7cmVHpu0GsMiyRMpf98lRI94_Q-RCqGHx20u2ER-eU',
    aliasesFile: 'aliases-v4.json',
    configFile: 'config-cuarto.json',
    outputRel: join('public', 'data', 'horarios-cuarto.generated.json'),
    anioCursado: 4,
    label: '4.º año'
  },
  tercero: {
    spreadsheetId: '1OBBo2LZpuhW57nZZXNFeRHhHhlk-HIiem20yxhrRu-U',
    aliasesFile: 'aliases-v3.json',
    configFile: 'config-tercero.json',
    outputRel: join('public', 'data', 'horarios-tercero.generated.json'),
    anioCursado: 3,
    label: '3.º año'
  },
  segundo: {
    spreadsheetId: '1UNUyrjq03EBUM7aaY1kYnufuu_OQ_xXEvk4ddh9W4l0',
    aliasesFile: 'aliases-v2.json',
    configFile: 'config-segundo.json',
    outputRel: join('public', 'data', 'horarios-segundo.generated.json'),
    anioCursado: 2,
    label: '2.º año'
  },
  primero: {
    spreadsheetId: '1k9ciPJ7Eqa1AaZNnZSNKhjiV69zBBXx3mkQEh-dbXTw',
    aliasesFile: 'aliases-v1.json',
    configFile: 'config-primero.json',
    outputRel: join('public', 'data', 'horarios-primero.generated.json'),
    anioCursado: 1,
    label: '1.º año'
  }
};

/** Libro MVP 5.º año — export histórico para scripts que importen este módulo. */
export const SPREADSHEET_ID_QUINTO = PRESETS.quinto.spreadsheetId;

/** Normaliza título de pestaña para comparar con config (mayúsculas / espacios). */
function normSheetTitle(t) {
  return String(t ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

async function main() {
  const arg = (process.argv[2] || 'quinto').trim().toLowerCase();
  const preset = PRESETS[arg];
  if (!preset) {
    console.error(
      `Preset desconocido "${process.argv[2]}". Usá: ${Object.keys(PRESETS).join(', ')}`
    );
    process.exit(1);
  }

  const apiKey = process.env.GOOGLE_SHEETS_API_KEY?.trim();
  if (!apiKey) {
    console.error(
      'Falta GOOGLE_SHEETS_API_KEY. Creá una API key con Sheets API habilitada y exportá:\n' +
        '  set GOOGLE_SHEETS_API_KEY=tu_key   (Windows cmd)\n' +
        '  $env:GOOGLE_SHEETS_API_KEY="tu_key" (PowerShell)'
    );
    process.exit(1);
  }

  const aliasesPath = join(__dirname, preset.aliasesFile);
  const aliases = JSON.parse(await readFile(aliasesPath, 'utf8'));

  const configPath = join(__dirname, preset.configFile);
  /** @type {{ sheetTitlesAllowOnly?: string[] }} */
  const sheetConfig = JSON.parse(await readFile(configPath, 'utf8'));

  const spreadsheetId = preset.spreadsheetId;
  console.log(`Obteniendo metadata (${preset.label})…`, spreadsheetId);
  const { sheets: sheetsAll } = await fetchSpreadsheetMeta(spreadsheetId, apiKey);

  const includeHidden = process.env.HORARIOS_INCLUDE_HIDDEN_SHEETS === '1';
  let sheets = includeHidden ? sheetsAll : sheetsAll.filter((s) => !s.hidden);

  const skippedHidden = sheetsAll.filter((s) => s.hidden);
  if (skippedHidden.length && !includeHidden) {
    console.log(
      'Pestañas ocultas (omitidas; usá HORARIOS_INCLUDE_HIDDEN_SHEETS=1 para incluirlas):',
      skippedHidden.map((s) => s.title).join(', ')
    );
  }

  const allowOnly = sheetConfig.sheetTitlesAllowOnly;
  if (allowOnly?.length) {
    const allowSet = new Set(allowOnly.map(normSheetTitle));
    const before = sheets.length;
    sheets = sheets.filter((s) => allowSet.has(normSheetTitle(s.title)));
    const skipped = sheetsAll.filter(
      (s) =>
        (!includeHidden ? !s.hidden : true) && !allowSet.has(normSheetTitle(s.title))
    );
    if (skipped.length) {
      console.log(
        `Pestañas fuera de ${preset.configFile} (omitidas):`,
        skipped.map((s) => s.title).join(', ')
      );
    }
    if (before !== sheets.length) {
      console.log(
        `Filtrado por sheetTitlesAllowOnly: ${before} → ${sheets.length} pestaña(s).`
      );
    }
  }

  console.log('Pestañas a procesar:', sheets.map((s) => s.title).join(', '));

  const ranges = sheets.map((s) => `${escapeSheetTitle(s.title)}!A1:AE200`);
  console.log('Descargando grillas (formato + valores)…');

  const grid = await fetchSpreadsheetGrid(spreadsheetId, apiKey, ranges);

  /** sheetId → hoja en la respuesta (el orden puede no coincidir con el de metadata). */
  const gridBySheetId = new Map();
  for (const sh of grid.sheets ?? []) {
    const sid = sh.properties?.sheetId;
    if (sid !== undefined && sid !== null) {
      gridBySheetId.set(sid, sh);
    }
  }

  /** @type {object[]} */
  const cursos = [];
  for (const props of sheets) {
    const sheetResp = gridBySheetId.get(props.sheetId);
    const dataFirst = sheetResp?.data?.[0];
    const parsed = parseSheetTab(props, dataFirst, aliases);
    cursos.push(parsed);
    console.log(
      `  ${parsed.curso}: ${parsed.bloques.length} bloques horario, ${parsed.resumenMateriaDocente.length} filas resumen`
    );
    if (parsed.warnings?.length) {
      parsed.warnings.forEach((w) => console.warn(`    ⚠ ${w}`));
    }
  }

  const outPath = join(ROOT, preset.outputRel);
  await mkdir(dirname(outPath), { recursive: true });

  const payload = {
    schemaVersion: 1,
    fuente: {
      spreadsheetId,
      url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
      extraidoEn: new Date().toISOString(),
      anioCursado: preset.anioCursado
    },
    cursos
  };

  await writeFile(outPath, JSON.stringify(payload, null, 2), 'utf8');
  console.log('OK →', outPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
