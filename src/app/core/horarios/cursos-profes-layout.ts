import {
  HorarioBloque,
  MateriaMatch,
  ResumenMateriaDocenteFila,
} from '../models/horarios-quinto.model';
import { parseHoraAMinutos } from '../rules/cronograma-overlap';

/** Orden de columnas en la grilla (solo aparecen días presentes en datos). */
export const DIAS_SEMANA_ORDEN = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
] as const;

function normTime(t: string): string {
  const m = String(t ?? '').match(/^(\d{1,2}):(\d{2})/);
  if (!m) return String(t ?? '').trim();
  return `${Number(m[1])}:${m[2]}`;
}

function slotKey(inicio: string, fin: string): string {
  return `${normTime(inicio)}|${normTime(fin)}`;
}

/** Coherente con el validador de scripts; usa solo datos ya presentes en el JSON. */
export function materiaMatchKey(m: MateriaMatch | null): string {
  if (!m) return '';
  if (m.tipo === 'obligatoria') return `ob:${m.id}`;
  if (m.tipo === 'electiva')
    return `el:${String(m.nombreCanonico ?? '')}|${String(m.nombreElectiva ?? '')}`;
  if (m.tipo === 'huecoElectivo') {
    const opts = [...(m.opciones ?? [])]
      .map((x) => String(x).trim())
      .sort();
    return `he:${m.hueco}:${opts.join('|')}`;
  }
  return '';
}

export function inferCuatrimestreTagDesdeTexto(
  cuatrimestre: string | null | undefined,
): '1er' | '2do' | null {
  if (!cuatrimestre?.trim()) return null;
  const n = cuatrimestre.toLowerCase();
  if (/\b1er\b|primer\s+cuat/i.test(n)) return '1er';
  if (/\b2do\b|segundo\s+cuat/i.test(n)) return '2do';
  return null;
}

export function tagEfectivoBloque(b: HorarioBloque): '1er' | '2do' | null {
  if (b.cuatrimestreTag === '1er' || b.cuatrimestreTag === '2do') {
    return b.cuatrimestreTag;
  }
  return inferCuatrimestreTagDesdeTexto(b.cuatrimestre);
}

export function particionarBloquesPorCuatrimestre(bloques: readonly HorarioBloque[]): {
  primer: HorarioBloque[];
  segundo: HorarioBloque[];
  sinCuatrimestre: HorarioBloque[];
} {
  const primer: HorarioBloque[] = [];
  const segundo: HorarioBloque[] = [];
  const sinCuatrimestre: HorarioBloque[] = [];
  for (const b of bloques) {
    const t = tagEfectivoBloque(b);
    if (t === '1er') primer.push(b);
    else if (t === '2do') segundo.push(b);
    else sinCuatrimestre.push(b);
  }
  return { primer, segundo, sinCuatrimestre };
}

/** Por cada match de materia, en qué cuatrimestres aparece en la grilla. */
export function cuatrimestresPorMatchEnBloques(
  bloques: readonly HorarioBloque[],
): Map<string, Set<'1er' | '2do'>> {
  const map = new Map<string, Set<'1er' | '2do'>>();
  for (const b of bloques) {
    const key = materiaMatchKey(b.materiaMatch);
    if (!key) continue;
    const t = tagEfectivoBloque(b);
    if (t !== '1er' && t !== '2do') continue;
    if (!map.has(key)) map.set(key, new Set());
    map.get(key)!.add(t);
  }
  return map;
}

/**
 * Reparte filas del resumen Materia/Docentes según bloques del mismo match.
 * Sin match o sin bloques con ese match → se muestra en ambos cuatrimestres (conservador).
 * Match en un solo cuatrimestre → solo esa tabla.
 */
export function partitionResumenPorCuatrimestre(
  resumen: readonly ResumenMateriaDocenteFila[],
  bloques: readonly HorarioBloque[],
): { primer: ResumenMateriaDocenteFila[]; segundo: ResumenMateriaDocenteFila[] } {
  const tagsPorMatch = cuatrimestresPorMatchEnBloques(bloques);
  const primer: ResumenMateriaDocenteFila[] = [];
  const segundo: ResumenMateriaDocenteFila[] = [];

  for (const fila of resumen) {
    const key = materiaMatchKey(fila.materiaMatch);
    const tags = key ? tagsPorMatch.get(key) : undefined;

    if (!key || !tags || tags.size === 0) {
      primer.push(fila);
      segundo.push(fila);
      continue;
    }
    if (tags.has('1er') && tags.has('2do')) {
      primer.push(fila);
      segundo.push(fila);
    } else if (tags.has('1er')) {
      primer.push(fila);
    } else {
      segundo.push(fila);
    }
  }

  return { primer, segundo };
}

export interface WeeklyGridFila {
  horaInicio: string;
  horaFin: string;
  etiquetaHorario: string;
  /** Una celda por día (clave = nombre del día tal como viene en bloques). */
  celdas: Record<string, HorarioBloque[]>;
}

export interface WeeklyGridModel {
  dias: string[];
  filas: WeeklyGridFila[];
}

function ordenarDias(dias: Iterable<string>): string[] {
  const seen = new Set<string>();
  const list = [...dias].filter((d) => {
    const t = d.trim();
    if (!t || seen.has(t)) return false;
    seen.add(t);
    return true;
  });
  const idx = (d: string) => {
    const i = DIAS_SEMANA_ORDEN.indexOf(d as (typeof DIAS_SEMANA_ORDEN)[number]);
    return i >= 0 ? i : 999;
  };
  return list.sort((a, b) => idx(a) - idx(b));
}

/**
 * Grilla semanal: filas = franjas horarias únicas ordenadas; columnas = días con clase.
 */
export function buildWeeklyGrid(bloques: readonly HorarioBloque[]): WeeklyGridModel {
  if (!bloques.length) {
    return { dias: [], filas: [] };
  }

  const dias = ordenarDias(bloques.map((b) => b.dia));

  const slotKeys = new Set<string>();
  for (const b of bloques) {
    slotKeys.add(slotKey(b.horaInicio, b.horaFin));
  }
  const ordenados = [...slotKeys].sort((a, b) => {
    const [ai, af] = a.split('|');
    const [bi, bf] = b.split('|');
    const ma = parseHoraAMinutos(ai) ?? 0;
    const mb = parseHoraAMinutos(bi) ?? 0;
    if (ma !== mb) return ma - mb;
    const fa = parseHoraAMinutos(af) ?? 0;
    const fb = parseHoraAMinutos(bf) ?? 0;
    return fa - fb;
  });

  const filas: WeeklyGridFila[] = ordenados.map((key) => {
    const [hi, hf] = key.split('|');
    const celdas: Record<string, HorarioBloque[]> = {};
    for (const d of dias) {
      celdas[d] = [];
    }
    for (const b of bloques) {
      if (slotKey(b.horaInicio, b.horaFin) !== key) continue;
      const dia = b.dia.trim();
      if (!celdas[dia]) celdas[dia] = [];
      celdas[dia].push(b);
    }
    return {
      horaInicio: hi,
      horaFin: hf,
      etiquetaHorario: `${hi} – ${hf}`,
      celdas,
    };
  });

  return { dias, filas };
}
