import { HorarioBloque } from '../models/horarios-quinto.model';

const DAY_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/**
 * Convierte "8:30" o "08:30:00" a minutos desde medianoche.
 */
export function parseHoraAMinutos(raw: string): number | null {
  const s = String(raw ?? '').trim();
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** Rango horario de la facultad para la grilla (minutos desde medianoche). */
export const GRILLA_INICIO_MIN = 8 * 60;
export const GRILLA_FIN_MIN = 23 * 60 + 5;

function intervalosSolapan(
  aInicio: number,
  aFin: number,
  bInicio: number,
  bFin: number,
): boolean {
  return aInicio < bFin && bInicio < aFin;
}

export function bloquesSolapan(a: HorarioBloque, b: HorarioBloque): boolean {
  if (a.dia !== b.dia) return false;
  const ai = parseHoraAMinutos(a.horaInicio);
  const af = parseHoraAMinutos(a.horaFin);
  const bi = parseHoraAMinutos(b.horaInicio);
  const bf = parseHoraAMinutos(b.horaFin);
  if (ai === null || af === null || bi === null || bf === null) return false;
  return intervalosSolapan(ai, af, bi, bf);
}

export interface SolapePar {
  bloqueA: HorarioBloque;
  bloqueB: HorarioBloque;
}

/**
 * Devuelve el primer par de bloques que se solapan entre dos listas (p. ej. dos selecciones).
 */
export function encontrarSolapeEntreListas(
  bloquesA: readonly HorarioBloque[],
  bloquesB: readonly HorarioBloque[],
): SolapePar | null {
  for (const x of bloquesA) {
    for (const y of bloquesB) {
      if (bloquesSolapan(x, y)) return { bloqueA: x, bloqueB: y };
    }
  }
  return null;
}

/**
 * Entre todas las selecciones (cada una con sus bloques), detecta si algún par solapa.
 */
export function haySolapeEntreSelecciones(
  listas: ReadonlyArray<readonly HorarioBloque[]>,
): SolapePar | null {
  for (let i = 0; i < listas.length; i++) {
    for (let j = i + 1; j < listas.length; j++) {
      const p = encontrarSolapeEntreListas(listas[i], listas[j]);
      if (p) return p;
    }
  }
  return null;
}

export function ordenDia(dia: string): number {
  const i = DAY_ORDER.indexOf(dia);
  return i >= 0 ? i : 99;
}
