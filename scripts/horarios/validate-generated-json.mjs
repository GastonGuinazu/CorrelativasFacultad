#!/usr/bin/env node
/**
 * Valida los JSON generados por el ETL (`public/data/horarios-*.generated.json`),
 * curso por curso (pestaña de planilla): matching de alias, avisos del parser y
 * coherencia grilla ↔ tabla Materia/Docentes.
 *
 * Es la misma fuente que consume `/cursos-profes` y `/cronograma`.
 *
 * Uso:
 *   node scripts/horarios/validate-generated-json.mjs
 *   node scripts/horarios/validate-generated-json.mjs --json
 *
 * Salida: código 1 si hay al menos un problema severity `error`.
 */

import { access, readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

/** @typedef {'error'|'warn'} Severity */

/** @typedef {{ severity: Severity; curso: string; sheetId: number; anioCursado: number; code: string; detail: string }} Issue */

const OUTPUT_FILES = [
  { anioCursado: 5, label: '5.º', rel: join('public', 'data', 'horarios-quinto.generated.json') },
  { anioCursado: 4, label: '4.º', rel: join('public', 'data', 'horarios-cuarto.generated.json') },
  { anioCursado: 3, label: '3.º', rel: join('public', 'data', 'horarios-tercero.generated.json') },
  { anioCursado: 2, label: '2.º', rel: join('public', 'data', 'horarios-segundo.generated.json') },
  { anioCursado: 1, label: '1.º', rel: join('public', 'data', 'horarios-primero.generated.json') }
];

/**
 * Clave estable para comparar matches entre bloques y resumen (misma lógica conceptual que la app).
 * @param {object|null|undefined} m
 */
export function materiaMatchKey(m) {
  if (!m) return '';
  if (m.tipo === 'obligatoria') return `ob:${m.id}`;
  if (m.tipo === 'electiva')
    return `el:${String(m.nombreCanonico ?? '')}|${String(m.nombreElectiva ?? '')}`;
  if (m.tipo === 'huecoElectivo') {
    const opts = [...(m.opciones ?? [])].map((x) => String(x).trim()).sort();
    return `he:${m.hueco}:${opts.join('|')}`;
  }
  return '';
}

/**
 * @param {object} curso
 * @param {number} anioCursado
 * @returns {Issue[]}
 */
export function validateCurso(curso, anioCursado) {
  const issues = [];
  const cursoLabel = curso.curso ?? '(sin título)';
  const sheetId = curso.sheetId ?? -1;

  const push = (severity, code, detail) => {
    issues.push({ severity, curso: cursoLabel, sheetId, anioCursado, code, detail });
  };

  const bloques = curso.bloques ?? [];
  const resumen = curso.resumenMateriaDocente ?? [];

  for (const w of curso.warnings ?? []) {
    push('warn', 'parser.warning', w);
  }

  for (const b of bloques) {
    if (!b.materiaMatch && (b.materiaCrudo ?? '').trim()) {
      const cu = b.cuatrimestreTag ?? '';
      const cuando = [b.dia, b.horaInicio, b.horaFin].filter(Boolean).join(' ');
      push(
        'error',
        'bloque.sin_match',
        `Celda sin alias: "${(b.materiaCrudo ?? '').trim()}" (${cuatrimestreLabel(cu)} ${cuando})`.trim()
      );
    }
  }

  for (const fila of resumen) {
    const mc = (fila.materiaCrudo ?? '').trim();
    if (mc && !fila.materiaMatch) {
      push('error', 'resumen.sin_match', `Tabla Materia/Docentes sin alias: "${mc}"`);
    }
  }

  /** Solo obligatorias: en electivas/huecos la grilla suele decir "Electiva 1/2" y la tabla el nombre concreto — comparar sería ruido. */
  /** @type {Set<string>} */
  const keysBloquesOb = new Set();
  for (const b of bloques) {
    if (b.materiaMatch?.tipo !== 'obligatoria') continue;
    const k = materiaMatchKey(b.materiaMatch);
    if (k) keysBloquesOb.add(k);
  }

  /** @type {Set<string>} */
  const keysResumenOb = new Set();
  for (const f of resumen) {
    if (f.materiaMatch?.tipo !== 'obligatoria') continue;
    const k = materiaMatchKey(f.materiaMatch);
    if (k) keysResumenOb.add(k);
  }

  for (const k of keysBloquesOb) {
    if (!keysResumenOb.has(k)) {
      push(
        'warn',
        'grilla.sin_fila_resumen',
        `Hay horarios para "${describeKey(k)}" pero ninguna fila en tabla Materia/Docentes con el mismo match de obligatoria (docentes pueden faltar en UI).`
      );
    }
  }

  for (const k of keysResumenOb) {
    if (!keysBloquesOb.has(k)) {
      push(
        'warn',
        'resumen.sin_bloques',
        `La tabla lista "${describeKey(k)}" pero no hay bloques horarios con ese match de obligatoria (revisar grilla o alias).`
      );
    }
  }

  if (!bloques.length && !resumen.length) {
    push('warn', 'curso.vacio', 'Sin bloques ni filas de resumen (pestaña vacía o grilla no interpretada).');
  }

  return issues;
}

function cuatrimestreLabel(tag) {
  if (tag === '1er') return '1.er cuat.';
  if (tag === '2do') return '2.do cuat.';
  return '';
}

function describeKey(k) {
  if (k.startsWith('ob:')) return `materia id ${k.slice(3)}`;
  if (k.startsWith('el:')) return k.slice(3).replace('|', ' / ');
  if (k.startsWith('he:')) return `hueco ${k.slice(3)}`;
  return k;
}

/**
 * @param {object} payload
 * @returns {Issue[]}
 */
export function validatePayload(payload) {
  const anio = payload?.fuente?.anioCursado ?? 0;
  const issues = [];
  for (const curso of payload?.cursos ?? []) {
    issues.push(...validateCurso(curso, anio));
  }
  return issues;
}

async function fileExists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

function formatIssue(i) {
  return `[${i.severity.toUpperCase()}] ${i.anioCursado}.º · ${i.curso} (sheet ${i.sheetId}) — ${i.code}: ${i.detail}`;
}

async function main() {
  const asJson = process.argv.includes('--json');
  const allIssues = [];

  for (const { anioCursado, label, rel } of OUTPUT_FILES) {
    const abs = join(ROOT, rel);
    if (!(await fileExists(abs))) {
      allIssues.push({
        severity: 'warn',
        curso: '—',
        sheetId: -1,
        anioCursado,
        code: 'archivo.falta',
        detail: `No existe ${rel} (ejecutá npm run horarios:fetch o el preset equivalente).`
      });
      continue;
    }

    let payload;
    try {
      payload = JSON.parse(await readFile(abs, 'utf8'));
    } catch (e) {
      allIssues.push({
        severity: 'error',
        curso: '—',
        sheetId: -1,
        anioCursado,
        code: 'archivo.json_invalido',
        detail: String(e?.message ?? e)
      });
      continue;
    }

    const fuenteAnio = payload?.fuente?.anioCursado;
    if (fuenteAnio != null && fuenteAnio !== anioCursado) {
      allIssues.push({
        severity: 'warn',
        curso: '—',
        sheetId: -1,
        anioCursado,
        code: 'payload.anio_mismatch',
        detail: `El archivo ${rel} declara anioCursado=${fuenteAnio} (esperado ${anioCursado} para ${label}).`
      });
    }

    allIssues.push(...validatePayload(payload));
  }

  const errors = allIssues.filter((i) => i.severity === 'error');
  const warns = allIssues.filter((i) => i.severity === 'warn');

  if (asJson) {
    console.log(
      JSON.stringify(
        {
          summary: { errors: errors.length, warnings: warns.length, total: allIssues.length },
          issues: allIssues
        },
        null,
        2
      )
    );
  } else {
    console.log(
      `Validación horarios generados — errores: ${errors.length}, advertencias: ${warns.length}\n`
    );
    if (!allIssues.length) {
      console.log('Sin problemas detectados en los JSON presentes.');
    } else {
      for (const i of allIssues) {
        console.log(formatIssue(i));
      }
    }
  }

  process.exit(errors.length ? 1 : 0);
}

/** Tests pueden importar sin ejecutar main */
const isMain = process.argv[1]?.includes('validate-generated-json.mjs');
if (isMain) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
