import { bgKeyFromColor } from './sheets-api.mjs';
import { matchMateriaAlias } from './match-alias.mjs';

const DAY_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const TIME_RE = /^\d{1,2}:\d{2}$/;

/**
 * Normaliza celdas tipo hora (Sheets puede devolver "8:00", "08:00:00", etc.).
 * @param {string} raw
 * @returns {string}
 */
export function normalizeTimeCell(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return '';
  const h = Number(m[1]);
  const min = m[2];
  if (h > 23 || Number(min) > 59) return '';
  return `${h}:${min}`;
}

/** Duración de la fila horaria en minutos (desde/hasta en primera pareja útil). */
export function duracionSlotMinutos(t0, t1) {
  const a = normalizeTimeCell(t0);
  const b = normalizeTimeCell(t1);
  if (!TIME_RE.test(a) || !TIME_RE.test(b)) return 0;
  const ma = /^(\d{1,2}):(\d{2})$/.exec(a);
  const mb = /^(\d{1,2}):(\d{2})$/.exec(b);
  if (!ma || !mb) return 0;
  const m0 = Number(ma[1]) * 60 + Number(ma[2]);
  const m1 = Number(mb[1]) * 60 + Number(mb[2]);
  return Math.max(0, m1 - m0);
}

/** Recreo corto o fila larga tipo almuerzo: no se arrastra materia a celdas vacías (huecos en blanco). */
const MIN_MINUTOS_RECESO = 22;
const MIN_MINUTOS_FILA_LARGA = 62;

/**
 * Primera pareja de columnas consecutivas que parecen desde/hasta.
 * @param {{ text: string, bgKey: string|null }[]} row
 * @returns {number}
 */
export function findFirstTimePairColumn(row) {
  if (!row?.length) return -1;
  for (let c = 0; c < row.length - 1; c++) {
    const t0 = normalizeTimeCell(row[c]?.text ?? '');
    const t1 = normalizeTimeCell(row[c + 1]?.text ?? '');
    if (TIME_RE.test(t0) && TIME_RE.test(t1)) return c;
  }
  return -1;
}

/**
 * @param {import('./sheets-api.mjs').unknown} value Google CellData
 */
function cellFromValue(value) {
  if (!value) return { text: '', bgKey: null };
  const text = value.formattedValue ?? '';
  const rgb = value.effectiveFormat?.backgroundColor?.rgbColor;
  return {
    text: String(text).replace(/\r\n/g, '\n').trim(),
    bgKey: bgKeyFromColor(rgb)
  };
}

/**
 * @param {object[]|undefined} rowData
 * @returns {{ text: string, bgKey: string|null }[][]}
 */
export function rowDataToMatrix(rowData) {
  if (!rowData?.length) return [];
  let maxCol = 0;
  const rows = rowData.map((row) => {
    const vals = row.values ?? [];
    maxCol = Math.max(maxCol, vals.length);
    return vals.map(cellFromValue);
  });
  for (const row of rows) {
    while (row.length < maxCol) {
      row.push({ text: '', bgKey: null });
    }
  }
  return rows;
}

/** @param {string} s */
function norm(s) {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Entre filas que tienen ≥3 etiquetas de día, elige la que mejor coincide con filas de horario + celdas de materia.
 * @param {{ text: string, bgKey: string|null }[][]} matrix
 */
function findBestDayHeaderRow(matrix) {
  /** @type {number[]} */
  const candidates = [];
  for (let r = 0; r < matrix.length; r++) {
    const row = matrix[r];
    let hits = 0;
    for (const label of DAY_LABELS) {
      const nl = norm(label);
      if (row.some((cell) => norm(cell.text).includes(nl))) hits++;
    }
    if (hits >= 3) candidates.push(r);
  }
  if (!candidates.length) return -1;

  let bestR = candidates[0];
  let bestScore = -1;

  for (const r of candidates) {
    const dayColsEnc = mapDayColumns(matrix[r]);
    if (Object.keys(dayColsEnc).length < 3) continue;

    let score = 0;
    for (let rr = r + 1; rr < Math.min(matrix.length, r + 120); rr++) {
      const row = matrix[rr];
      const tc = findFirstTimePairColumn(row);
      if (tc < 0) continue;
      const t0 = normalizeTimeCell(row[tc]?.text ?? '');
      const t1 = normalizeTimeCell(row[tc + 1]?.text ?? '');
      if (!TIME_RE.test(t0) || !TIME_RE.test(t1)) continue;
      const shiftRow = shiftColumnasAgenda(dayColsEnc, row);
      for (const label of DAY_LABELS) {
        const hc = dayColsEnc[label];
        if (hc === undefined) continue;
        const col = hc + shiftRow;
        if (col < 0 || col >= row.length) continue;
        const txt = (row[col]?.text ?? '').trim();
        if (txt) score += 3;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestR = r;
    }
  }

  return bestScore >= 0 ? bestR : candidates[0];
}

/**
 * Fila con Lunes…Viernes como encabezado de grilla (≥4 para descartar leyendas).
 * @param {{ text: string, bgKey: string|null }[]} row
 * @returns {Record<string, number>|null}
 */
function tryParseDayHeaderRow(row) {
  let hits = 0;
  for (const label of DAY_LABELS.slice(0, 5)) {
    const nl = norm(label);
    if (row.some((cell) => norm(cell.text).includes(nl))) hits++;
  }
  if (hits < 4) return null;
  const m = mapDayColumns(row);
  return Object.keys(m).length >= 4 ? m : null;
}

/**
 * Normaliza etiqueta de cuatrimestre para filtros (cronograma).
 * @param {string} text
 * @returns {'1er'|'2do'|null}
 */
export function inferCuatrimestreTag(text) {
  const n = norm(text);
  if (!n.includes('cuatrimestre')) return null;
  if (/\b2\s*(do|º)|\bsegundo\b/.test(n)) return '2do';
  if (/\b1\s*(er|º)|\bprimero\b/.test(n)) return '1er';
  if (n.includes('2do') || n.includes('segundo')) return '2do';
  if (n.includes('1er') || n.includes('primero')) return '1er';
  return null;
}

/**
 * @param {{ text: string, bgKey: string|null }[]} headerRow
 * @returns {Record<string, number>}
 */
function mapDayColumns(headerRow) {
  /** @type {Record<string, number>} */
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

/**
 * Alinea columnas de día del encabezado con la fila de datos: las materias empiezan
 * dos columnas después del par desde/hasta (puede estar en A–B o B–C si A está vacía).
 * @param {Record<string, number>} dayColsEncabezado
 * @param {{ text: string, bgKey: string|null }[]} primeraFilaHorario
 */
function shiftColumnasAgenda(dayColsEncabezado, primeraFilaHorario) {
  const vals = Object.values(dayColsEncabezado);
  if (!vals.length) return 0;
  const minEnc = Math.min(...vals);
  const tc = findFirstTimePairColumn(primeraFilaHorario);
  if (tc < 0) return 0;
  const subjectsStart = tc + 2;
  return subjectsStart - minEnc;
}

/**
 * Une franjas consecutivas misma materia/día/cuatrimestre (celdas combinadas en vertical).
 * @param {object[]} bloques
 */
function mergeAdjacentBloques(bloques) {
  const order = Object.fromEntries(DAY_LABELS.map((d, i) => [d, i]));
  const sorted = [...bloques].sort((a, b) => {
    const od = (order[a.dia] ?? 99) - (order[b.dia] ?? 99);
    if (od !== 0) return od;
    const ai = a.horaInicio.localeCompare(b.horaInicio);
    if (ai !== 0) return ai;
    return String(a.materiaCrudo ?? '').localeCompare(String(b.materiaCrudo ?? ''));
  });

  /** @type {object[]} */
  const out = [];
  for (const b of sorted) {
    const prev = out[out.length - 1];
    const sameSlot =
      prev &&
      prev.dia === b.dia &&
      prev.cuatrimestre === b.cuatrimestre &&
      prev.cuatrimestreTag === b.cuatrimestreTag &&
      String(prev.materiaCrudo ?? '') === String(b.materiaCrudo ?? '') &&
      prev.horaFin === b.horaInicio;
    if (sameSlot) {
      prev.horaFin = b.horaFin;
    } else {
      out.push({ ...b });
    }
  }
  return out;
}

/**
 * Bloques horarios en la grilla principal (pareja desde/hasta en las primeras columnas útiles).
 * @param {{ text: string, bgKey: string|null }[][]} matrix
 * @param {object} aliases
 */
function extractBloquesHorario(matrix, aliases) {
  /** @type {object[]} */
  const bloques = [];
  let cuatrimestre = '';
  /** @type {'1er'|'2do'|null} */
  let cuatrimestreTag = null;

  const bestHeaderRow = findBestDayHeaderRow(matrix);
  if (bestHeaderRow < 0) {
    return { bloques, warnings: ['No se encontró fila de encabezado con días de la semana.'] };
  }

  /** @type {Record<string, number>} */
  let activeDayColsEnc = mapDayColumns(matrix[bestHeaderRow]);
  if (Object.keys(activeDayColsEnc).length === 0) {
    return { bloques, warnings: ['Encabezado de días sin columnas reconocidas.'] };
  }

  let lastHeaderRow = bestHeaderRow;

  /** Repite texto de materia hacia abajo cuando la celda viene vacía (merge vertical). */
  /** @type {Record<string, string>} */
  const carryText = {};
  /** @type {Record<string, string|null>} */
  const carryBg = {};

  for (let r = 0; r < matrix.length; r++) {
    const row = matrix[r];
    const joined = row.map((c) => c.text).join(' ').trim();
    if (norm(joined).includes('cuatrimestre')) {
      cuatrimestre = joined;
      cuatrimestreTag = inferCuatrimestreTag(joined);
      for (const label of DAY_LABELS) {
        delete carryText[label];
        delete carryBg[label];
      }
    }

    const maybeHeader = tryParseDayHeaderRow(row);
    if (maybeHeader) {
      activeDayColsEnc = maybeHeader;
      lastHeaderRow = r;
      for (const label of DAY_LABELS) {
        delete carryText[label];
        delete carryBg[label];
      }
      continue;
    }

    if (r <= lastHeaderRow) continue;

    const tc = findFirstTimePairColumn(row);
    if (tc < 0) continue;

    const t0 = normalizeTimeCell(row[tc]?.text ?? '');
    const t1 = normalizeTimeCell(row[tc + 1]?.text ?? '');
    if (!TIME_RE.test(t0) || !TIME_RE.test(t1)) continue;

    const shiftRow = shiftColumnasAgenda(activeDayColsEnc, row);

    for (const label of DAY_LABELS) {
      const hc = activeDayColsEnc[label];
      if (hc === undefined) continue;
      const col = hc + shiftRow;
      if (col < 0 || col >= row.length) continue;
      const cell = row[col];
      let materiaCrudo = (cell?.text ?? '').trim();
      let bg = cell?.bgKey ?? null;
      if (materiaCrudo) {
        carryText[label] = materiaCrudo;
        carryBg[label] = bg;
      } else if (carryText[label]) {
        const prevBg = carryBg[label];
        const dur = duracionSlotMinutos(t0, t1);

        // Celda vacía con fondo distinto al bloque superior → fin del merge (celda blanca / otro color).
        const fondoCortaArrastre =
          prevBg !== null &&
          (bg === null || bg !== prevBg);

        // Fila muy corta (recreo) o muy larga (almuerzo / hueco): no es continuación de módulo típico.
        const filaHuecoHorario =
          dur <= MIN_MINUTOS_RECESO || dur >= MIN_MINUTOS_FILA_LARGA;

        if (fondoCortaArrastre || filaHuecoHorario) {
          delete carryText[label];
          delete carryBg[label];
          continue;
        }

        materiaCrudo = carryText[label];
        bg = carryBg[label] ?? null;
      }
      if (!materiaCrudo) continue;

      const match = matchMateriaAlias(materiaCrudo, aliases);
      bloques.push({
        cuatrimestre: cuatrimestre || null,
        cuatrimestreTag,
        dia: label,
        horaInicio: t0,
        horaFin: t1,
        materiaCrudo,
        materiaMatch: match,
        colorRgb: bg
      });
    }
  }

  return { bloques: mergeAdjacentBloques(bloques), warnings: [] };
}

/**
 * Tabla resumen Materia | Docentes (columnas posteriores a la grilla).
 * @param {{ text: string, bgKey: string|null }[][]} matrix
 * @param {object} aliases
 */
function extractResumenMateriaDocente(matrix, aliases) {
  /** @type {object[]} */
  const filas = [];

  let materiaCol = -1;
  let docentesCol = -1;
  let headerFoundRow = -1;

  for (let r = 0; r < Math.min(matrix.length, 80); r++) {
    const row = matrix[r];
    for (let c = 0; c < row.length; c++) {
      const tx = norm(row[c].text);
      if (tx === 'materia' || tx.includes('materia')) {
        materiaCol = c;
      }
      if (tx === 'docentes' || tx.includes('docente')) {
        docentesCol = c;
      }
    }
    if (materiaCol >= 0 && docentesCol >= 0) {
      headerFoundRow = r;
      break;
    }
    materiaCol = -1;
    docentesCol = -1;
  }

  if (headerFoundRow < 0 || materiaCol < 0 || docentesCol < 0) {
    return { filas, warnings: ['No se encontró encabezado Materia/Docentes.'] };
  }

  for (let r = headerFoundRow + 1; r < matrix.length; r++) {
    const m = (matrix[r][materiaCol]?.text ?? '').trim();
    const d = (matrix[r][docentesCol]?.text ?? '').trim();
    if (!m && !d) continue;
    if (norm(m) === 'materia' || norm(d) === 'docentes') continue;

    const match = m ? matchMateriaAlias(m, aliases) : null;
    filas.push({
      materiaCrudo: m || null,
      docentesCrudo: d || null,
      materiaMatch: match,
      colorRgbMateria: matrix[r][materiaCol]?.bgKey ?? null,
      colorRgbDocentes: matrix[r][docentesCol]?.bgKey ?? null
    });

    if (filas.length > 200) break;
  }

  return { filas, warnings: [] };
}

/**
 * @param {object} sheetProps properties.sheetId, title
 * @param {object[]|undefined} dataFirst first element of sheet.data[] from API
 * @param {object} aliases
 */
export function parseSheetTab(sheetProps, dataFirst, aliases) {
  const rowData = dataFirst?.rowData ?? [];
  const matrix = rowDataToMatrix(rowData);
  const title = sheetProps.title ?? '';

  const h1 = extractBloquesHorario(matrix, aliases);
  const h2 = extractResumenMateriaDocente(matrix, aliases);

  const warnings = [...h1.warnings, ...h2.warnings];

  return {
    curso: title,
    sheetId: sheetProps.sheetId,
    bloques: h1.bloques,
    resumenMateriaDocente: h2.filas,
    warnings,
    stats: {
      filasMatrix: matrix.length,
      columnasMatrix: matrix[0]?.length ?? 0
    }
  };
}
