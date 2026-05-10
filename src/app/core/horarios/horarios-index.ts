import {
  HorarioBloque,
  HorariosCurso,
  HorariosPayload,
  MateriaMatch,
} from '../models/horarios-quinto.model';
import { MateriaCatalogo, MateriaId } from '../models/materia.model';
import { OfertaCursoHorario } from '../models/cronograma-armado.model';
import { normalizeLoose } from '../utils/materia-match-label';
import { huecosPermitidosParaElectiva } from './electiva-hueco-restricciones';

export function materiaCatalogMatchesMatch(
  m: MateriaCatalogo,
  match: MateriaMatch | null,
): boolean {
  if (!match) return false;
  if (match.tipo === 'obligatoria') {
    return !m.esElectiva && m.id === match.id;
  }
  if (match.tipo === 'electiva') {
    return (
      m.esElectiva &&
      (normalizeLoose(m.nombre) === normalizeLoose(match.nombreCanonico) ||
        normalizeLoose(m.nombre) === normalizeLoose(match.nombreElectiva))
    );
  }
  if (match.tipo === 'huecoElectivo') {
    if (!m.esElectiva) return false;
    if (
      !match.opciones.some((op) => normalizeLoose(op) === normalizeLoose(m.nombre))
    ) {
      return false;
    }
    const soloHuecos = huecosPermitidosParaElectiva(m.nombre);
    if (soloHuecos?.length) {
      return soloHuecos.includes(match.hueco as 'E1' | 'E2');
    }
    return true;
  }
  return false;
}

function bloquesParaMateria(
  bloques: readonly HorarioBloque[],
  m: MateriaCatalogo,
): HorarioBloque[] {
  return bloques.filter((b) => materiaCatalogMatchesMatch(m, b.materiaMatch));
}

function docentesDesdeResumen(curso: HorariosCurso, m: MateriaCatalogo): string | null {
  const partes: string[] = [];
  for (const fila of curso.resumenMateriaDocente ?? []) {
    if (!materiaCatalogMatchesMatch(m, fila.materiaMatch)) continue;
    const d = fila.docentesCrudo?.trim();
    if (d) partes.push(d);
  }
  if (!partes.length) return null;
  return [...new Set(partes)].join(' · ');
}

/**
 * Arma ofertas (comisiones) para una materia del catálogo a partir de todos los payloads cargados.
 */
export function ofertasParaMateria(
  payloads: readonly HorariosPayload[],
  m: MateriaCatalogo,
): OfertaCursoHorario[] {
  const out: OfertaCursoHorario[] = [];
  for (const payload of payloads) {
    const anio = payload.fuente.anioCursado;
    for (const curso of payload.cursos) {
      const bloques = bloquesParaMateria(curso.bloques, m);
      const hayResumen = (curso.resumenMateriaDocente ?? []).some((f) =>
        materiaCatalogMatchesMatch(m, f.materiaMatch),
      );
      if (!bloques.length && !hayResumen) continue;
      out.push({
        anioCursado: anio,
        sheetId: curso.sheetId,
        curso: curso.curso,
        docentesResumen: docentesDesdeResumen(curso, m),
        bloques,
      });
    }
  }
  return out;
}

export function claveMateria(id: MateriaId): string {
  return String(id);
}
