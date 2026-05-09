export type MateriaId = number | string;

/** Filtro del listado por nivel: todas, solo electivas u obligatorias */
export type FiltroMateriasCatalogo = 'todas' | 'electivas' | 'obligatorias';

export type EstadoUsuario = 'pendiente' | 'cursando' | 'regular' | 'aprobada';

export type DisponibilidadCalculada = 'disponible' | 'bloqueada';

export interface MateriaRaw {
  id?: number;
  nombre: string;
  nivel: number;
  reg: number[];
  aprob: number[];
  creditos?: number;
  nota?: string;
  /** Si true, la materia no cuenta para el % de progreso al título de Ingeniería (ej. solo título intermedio Analista). */
  excluir_progreso_titulo?: boolean;
}

export interface MateriaCatalogo {
  id: MateriaId;
  nombre: string;
  nivel: number;
  esElectiva: boolean;
  creditos: number;
  reg: number[];
  aprob: number[];
  nota?: string;
  obligatoria: boolean;
  /** Si es false, la materia no entra en el % "Progreso al título" de Ingeniería (sigue en el plan y correlativas). */
  cuentaProgresoTitulo: boolean;
}

/** Etiqueta de tipo para listados (no electiva ≠ obligatoria al título). */
export function etiquetaTipoCatalogo(m: MateriaCatalogo): string {
  if (m.esElectiva) return 'Electiva';
  if (!m.cuentaProgresoTitulo) return 'Título intermedio';
  return 'Obligatoria';
}

export interface ConfiguracionPlan {
  nombre: string;
  plan: string;
  requisitos: {
    creditos_ingenieria: number;
    creditos_analista_nivel3: number;
    pps_obligatoria: boolean;
  };
}

export interface PlanEstudios {
  configuracion: ConfiguracionPlan;
  materias: MateriaCatalogo[];
}

export interface MateriasJsonRaw {
  configuracion_plan: ConfiguracionPlan;
  obligatorias: MateriaRaw[];
  electivas: MateriaRaw[];
}

export interface RequisitoFaltante {
  id: number;
  nombre: string;
  tipo: 'regular' | 'aprobada';
}

export interface EvaluacionMateria {
  materia: MateriaCatalogo;
  estado: EstadoUsuario;
  disponibilidad: DisponibilidadCalculada;
  faltantesRegular: RequisitoFaltante[];
  faltantesAprobada: RequisitoFaltante[];
}

export type MapaEstados = Record<MateriaId, EstadoUsuario>;
