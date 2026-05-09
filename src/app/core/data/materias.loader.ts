import { MateriaCatalogo, MateriasJsonRaw, PlanEstudios } from '../models/materia.model';

const ELECTIVA_PREFIX = 'electiva';

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function generarIdElectiva(nivel: number, nombre: string): string {
  return `${ELECTIVA_PREFIX}-n${nivel}-${slugify(nombre)}`;
}

export function normalizarPlan(raw: MateriasJsonRaw): PlanEstudios {
  const obligatorias: MateriaCatalogo[] = raw.obligatorias.map((m) => ({
    id: m.id ?? -1,
    nombre: m.nombre,
    nivel: m.nivel,
    esElectiva: false,
    obligatoria: true,
    cuentaProgresoTitulo: m.excluir_progreso_titulo !== true,
    creditos: m.creditos ?? 0,
    reg: m.reg ?? [],
    aprob: m.aprob ?? [],
    nota: m.nota,
  }));

  const electivas: MateriaCatalogo[] = raw.electivas.map((m) => ({
    id: generarIdElectiva(m.nivel, m.nombre),
    nombre: m.nombre,
    nivel: m.nivel,
    esElectiva: true,
    obligatoria: false,
    cuentaProgresoTitulo: true,
    creditos: m.creditos ?? 0,
    reg: m.reg ?? [],
    aprob: m.aprob ?? [],
    nota: m.nota,
  }));

  return {
    configuracion: raw.configuracion_plan,
    materias: [...obligatorias, ...electivas],
  };
}

export async function cargarPlanEstudios(): Promise<PlanEstudios> {
  const res = await fetch('/materias.json', { cache: 'no-cache' });
  if (!res.ok) {
    throw new Error(`No se pudo cargar materias.json (${res.status})`);
  }
  const raw = (await res.json()) as MateriasJsonRaw;
  return normalizarPlan(raw);
}
