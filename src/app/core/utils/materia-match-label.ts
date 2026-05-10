import { MateriaMatch } from '../models/horarios-quinto.model';

export function normalizeLoose(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Etiqueta legible para una celda de materia (planilla / horarios). */
export function etiquetaMatch(match: MateriaMatch | null, crudo: string | null): string {
  if (!match) return (crudo ?? '').trim() || '—';
  if (match.tipo === 'obligatoria') return match.nombreCanonico;
  if (match.tipo === 'electiva') return match.nombreCanonico;
  return `${match.opciones.join(' · ')} (${match.hueco})`;
}

export function textoCrudoVisible(crudo: string, match: MateriaMatch | null): boolean {
  const c = crudo.trim();
  if (!c || !match) return false;
  const canon =
    match.tipo === 'huecoElectivo'
      ? match.opciones.join(' ')
      : match.nombreCanonico;
  return normalizeLoose(c) !== normalizeLoose(canon);
}
