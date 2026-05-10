import { HorarioBloque } from '../models/horarios-quinto.model';
import { parseHoraAMinutos } from '../rules/cronograma-overlap';

const ORDEN_DIA = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
] as const;

const DIA_CORTO: Record<string, string> = {
  Lunes: 'Lun',
  Martes: 'Mar',
  Miércoles: 'Mié',
  Jueves: 'Jue',
  'Viernes': 'Vie',
  Sábado: 'Sáb',
};

function ordenDia(dia: string): number {
  const i = ORDEN_DIA.indexOf(dia as (typeof ORDEN_DIA)[number]);
  return i >= 0 ? i : 99;
}

/** Texto `H:MM` desde minutos desde medianoche (grilla, etiquetas). */
export function formatHoraMinutosMedianoche(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h}:${min.toString().padStart(2, '0')}`;
}

/**
 * Hueco máximo (min) entre fin de un tramo e inicio del siguiente para seguir mostrando un solo rango
 * (recreos cortos entre módulos del mismo día en la planilla).
 */
const MAX_HUECO_MINUTOS_UNIR = 25;

/**
 * Une bloques del mismo día en intervalos continuos (solape, toque o separados solo por recreo corto).
 * Reutilizable en grilla del cronograma y en resumen de texto.
 */
export function fusionarIntervalosHorarioPorDia(
  bloques: readonly HorarioBloque[],
): { dia: string; ini: number; fin: number }[] {
  const sorted = [...bloques].sort((a, b) => {
    const od = ordenDia(a.dia) - ordenDia(b.dia);
    if (od !== 0) return od;
    const ai = parseHoraAMinutos(a.horaInicio) ?? 0;
    const bi = parseHoraAMinutos(b.horaInicio) ?? 0;
    return ai - bi;
  });

  const merged: { dia: string; ini: number; fin: number }[] = [];

  for (const b of sorted) {
    const ini = parseHoraAMinutos(b.horaInicio);
    let fin = parseHoraAMinutos(b.horaFin);
    if (ini === null || fin === null) continue;
    if (fin < ini) fin = ini;

    const last = merged[merged.length - 1];
    const mismoDia = last && last.dia === b.dia;
    const huecoMin = mismoDia ? ini - last.fin : Infinity;
    const unir =
      mismoDia &&
      huecoMin <= MAX_HUECO_MINUTOS_UNIR;

    if (!last || !mismoDia || !unir) {
      merged.push({ dia: b.dia, ini, fin });
    } else {
      last.fin = Math.max(last.fin, fin);
    }
  }

  return merged;
}

/**
 * Texto compacto para tarjetas de comisión (bloques ya filtrados por cuatrimestre).
 * Rangos del mismo día se muestran compactos (un solo intervalo si solo hay recreo corto entre tramos).
 */
export function resumenHorarioBloques(bloques: readonly HorarioBloque[]): string {
  if (!bloques.length) return '';
  const merged = fusionarIntervalosHorarioPorDia(bloques);
  return merged
    .map(({ dia, ini, fin }) => {
      const dc = DIA_CORTO[dia] ?? dia.slice(0, 3);
      return `${dc} ${formatHoraMinutosMedianoche(ini)}–${formatHoraMinutosMedianoche(fin)}`;
    })
    .join(' · ');
}
