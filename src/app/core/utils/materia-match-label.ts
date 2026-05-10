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
  /** Hueco E1/E2: no listar todas las opciones en cada fila (parece que todas se dictan en ese horario). */
  const raw = (crudo ?? '').trim();
  const tituloHueco =
    raw ||
    (match.hueco === 'E1'
      ? 'Electiva 1'
      : match.hueco === 'E2'
        ? 'Electiva 2'
        : `Electiva (${match.hueco})`);
  const n = match.opciones.length;
  return `${tituloHueco} (${n} opciones en catálogo)`;
}

export function textoCrudoVisible(crudo: string, match: MateriaMatch | null): boolean {
  const c = crudo.trim();
  if (!c || !match) return false;
  if (match.tipo === 'huecoElectivo') {
    const nc = normalizeLoose(c);
    /** La etiqueta ya incluye "Electiva 1/2"; no repetir la línea cruda genérica. */
    if (/^electiva\s*[12]$|^e[12]$/.test(nc)) return false;
    return normalizeLoose(c) !== normalizeLoose(match.opciones.join(' '));
  }
  return normalizeLoose(c) !== normalizeLoose(match.nombreCanonico);
}
