import {
  DisponibilidadCalculada,
  EstadoUsuario,
  EvaluacionMateria,
  MapaEstados,
  MateriaCatalogo,
  MateriaId,
  RequisitoFaltante,
} from '../models/materia.model';

const ESTADOS_QUE_REGULARIZAN: ReadonlySet<EstadoUsuario> = new Set([
  'regular',
  'aprobada',
]);

const ESTADOS_QUE_APRUEBAN: ReadonlySet<EstadoUsuario> = new Set(['aprobada']);

export function obtenerEstado(
  estados: MapaEstados,
  id: MateriaId,
): EstadoUsuario {
  return estados[id] ?? 'pendiente';
}

export function cumpleRegular(
  estados: MapaEstados,
  id: MateriaId,
): boolean {
  return ESTADOS_QUE_REGULARIZAN.has(obtenerEstado(estados, id));
}

export function cumpleAprobada(
  estados: MapaEstados,
  id: MateriaId,
): boolean {
  return ESTADOS_QUE_APRUEBAN.has(obtenerEstado(estados, id));
}

export function evaluarMateria(
  materia: MateriaCatalogo,
  estados: MapaEstados,
  catalogoIndex: ReadonlyMap<number, MateriaCatalogo>,
): EvaluacionMateria {
  const faltantesRegular: RequisitoFaltante[] = [];
  const faltantesAprobada: RequisitoFaltante[] = [];

  for (const reqId of materia.reg) {
    if (!cumpleRegular(estados, reqId)) {
      const ref = catalogoIndex.get(reqId);
      faltantesRegular.push({
        id: reqId,
        nombre: ref?.nombre ?? `Materia #${reqId}`,
        tipo: 'regular',
      });
    }
  }

  for (const reqId of materia.aprob) {
    if (!cumpleAprobada(estados, reqId)) {
      const ref = catalogoIndex.get(reqId);
      faltantesAprobada.push({
        id: reqId,
        nombre: ref?.nombre ?? `Materia #${reqId}`,
        tipo: 'aprobada',
      });
    }
  }

  const disponibilidad: DisponibilidadCalculada =
    faltantesRegular.length === 0 && faltantesAprobada.length === 0
      ? 'disponible'
      : 'bloqueada';

  return {
    materia,
    estado: obtenerEstado(estados, materia.id),
    disponibilidad,
    faltantesRegular,
    faltantesAprobada,
  };
}

export function evaluarPlan(
  materias: readonly MateriaCatalogo[],
  estados: MapaEstados,
): EvaluacionMateria[] {
  const index = new Map<number, MateriaCatalogo>();
  for (const m of materias) {
    if (typeof m.id === 'number') index.set(m.id, m);
  }
  return materias.map((m) => evaluarMateria(m, estados, index));
}

export function indexarPorId(
  materias: readonly MateriaCatalogo[],
): ReadonlyMap<number, MateriaCatalogo> {
  const map = new Map<number, MateriaCatalogo>();
  for (const m of materias) {
    if (typeof m.id === 'number') map.set(m.id, m);
  }
  return map;
}
