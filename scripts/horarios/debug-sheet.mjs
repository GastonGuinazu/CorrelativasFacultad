#!/usr/bin/env node
/**
 * Diagnóstico de una pestaña: matriz resumida + índices que usa parse-grid.
 *
 * Uso:
 *   $env:GOOGLE_SHEETS_API_KEY="..."
 *   node scripts/horarios/debug-sheet.mjs <spreadsheetId> <sheetTitle>
 *
 * Ejemplo (1.º año):
 *   node scripts/horarios/debug-sheet.mjs 1k9ciPJ7Eqa1AaZNnZSNKhjiV69zBBXx3mkQEh-dbXTw 1K1
 */

import { fetchSpreadsheetGrid, escapeSheetTitle } from './sheets-api.mjs';
import {
  rowDataToMatrix,
  findFirstTimePairColumn,
  normalizeTimeCell,
} from './parse-grid.mjs';

const spreadsheetId = process.argv[2];
const sheetTitle = process.argv[3];

if (!spreadsheetId || !sheetTitle) {
  console.error(
    'Uso: node scripts/horarios/debug-sheet.mjs <spreadsheetId> <sheetTitle>',
  );
  process.exit(1);
}

const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
if (!apiKey) {
  console.error('Definí GOOGLE_SHEETS_API_KEY');
  process.exit(1);
}

const TIME_RE = /^\d{1,2}:\d{2}$/;

function norm(s) {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const DAY_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function findDayHeaderCandidates(matrix) {
  const out = [];
  for (let r = 0; r < matrix.length; r++) {
    const row = matrix[r];
    let hits = 0;
    for (const label of DAY_LABELS) {
      const nl = norm(label);
      if (row.some((cell) => norm(cell.text).includes(nl))) hits++;
    }
    if (hits >= 3) out.push(r);
  }
  return out;
}

function mapDayColumns(headerRow) {
  const map = {};
  for (let c = 0; c < headerRow.length; c++) {
    const t = norm(headerRow[c].text);
    for (const label of DAY_LABELS) {
      const nl = norm(label);
      if (t === nl || t.includes(nl)) {
        map[label] = c;
        break;
      }
    }
  }
  return map;
}

function shiftColumnasAgenda(dayColsEncabezado, primeraFilaHorario) {
  const vals = Object.values(dayColsEncabezado);
  if (!vals.length) return 0;
  const minEnc = Math.min(...vals);
  const tc = findFirstTimePairColumn(primeraFilaHorario);
  if (tc < 0) return 0;
  const subjectsStart = tc + 2;
  return subjectsStart - minEnc;
}

function dumpMatrixPreview(matrix, maxRows = 28, maxCols = 14) {
  for (let r = 0; r < Math.min(matrix.length, maxRows); r++) {
    const cells = matrix[r].slice(0, maxCols).map((c) => {
      const t = (c.text ?? '').replace(/\n/g, '↵').slice(0, 22);
      return t || '·';
    });
    console.log(`  R${String(r).padStart(2, '0')} | ${cells.join(' | ')}`);
  }
  if (matrix.length > maxRows) console.log(`  ... (${matrix.length} filas total)`);
}

async function main() {
  const range = `${escapeSheetTitle(sheetTitle)}!A1:AE200`;
  console.log('Rango:', range);
  const grid = await fetchSpreadsheetGrid(spreadsheetId, apiKey, [range]);
  const sheetResp = grid.sheets?.[0];
  const dataFirst = sheetResp?.data?.[0];
  const rowData = dataFirst?.rowData ?? [];
  const matrix = rowDataToMatrix(rowData);

  console.log('\nDimensiones:', matrix.length, 'x', matrix[0]?.length ?? 0);
  console.log('\n--- Primeras filas (texto truncado) ---');
  dumpMatrixPreview(matrix);

  const candidates = findDayHeaderCandidates(matrix);
  console.log('\nCandidatos fila encabezado (≥3 días):', candidates.join(', ') || '(ninguno)');

  for (const hr of candidates.slice(0, 5)) {
    const enc = mapDayColumns(matrix[hr]);
    console.log(`\n  headerRow=${hr} dayCols:`, enc);
    let firstTc = -1;
    let firstDataRow = -1;
    for (let r = hr + 1; r < Math.min(matrix.length, hr + 60); r++) {
      const tc = findFirstTimePairColumn(matrix[r]);
      if (tc >= 0) {
        firstTc = tc;
        firstDataRow = r;
        break;
      }
    }
    console.log(`  primera fila horario: R${firstDataRow}, timeCol=${firstTc}`);
    if (firstDataRow >= 0) {
      const row = matrix[firstDataRow];
      const sh = shiftColumnasAgenda(enc, row);
      console.log(`  shift=${sh}`);
      for (const label of DAY_LABELS) {
        const hc = enc[label];
        if (hc === undefined) continue;
        const col = hc + sh;
        const txt = (row[col]?.text ?? '').trim().slice(0, 40);
        console.log(`    ${label} col=${col} -> "${txt}"`);
      }
    }
  }

  const timeColsFound = [];
  for (let r = 0; r < matrix.length; r++) {
    const tc = findFirstTimePairColumn(matrix[r]);
    if (tc >= 0) {
      const row = matrix[r];
      const t0 = normalizeTimeCell(row[tc]?.text ?? '');
      const t1 = normalizeTimeCell(row[tc + 1]?.text ?? '');
      if (TIME_RE.test(t0) && TIME_RE.test(t1)) timeColsFound.push({ r, tc });
    }
  }
  console.log(
    '\nFilas con pareja HH:MM (primeras 15):',
    timeColsFound
      .slice(0, 15)
      .map((x) => `R${x.r}[tc=${x.tc}]`)
      .join(', '),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
