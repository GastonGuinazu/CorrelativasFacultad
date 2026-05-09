import { MapaEstados } from '../models/materia.model';

const STORAGE_KEY = 'utn-is-progress-v1';

export type CategoriaComentario =
  | 'donde-cursar'
  | 'opiniones-profes'
  | 'consejos-parciales';

export type ComentarioTipoDb = 'donde_cursar' | 'opiniones' | 'consejos';

export interface ComentarioUsuario {
  id: string;
  texto: string;
  fecha: number;
  nombreUsuario?: string | null;
}

export type ComentariosMap = Record<
  string,
  Record<CategoriaComentario, ComentarioUsuario[]>
>;

export function categoriaToTipoDb(c: CategoriaComentario): ComentarioTipoDb {
  switch (c) {
    case 'donde-cursar':
      return 'donde_cursar';
    case 'opiniones-profes':
      return 'opiniones';
    case 'consejos-parciales':
      return 'consejos';
  }
}

export function tipoDbToCategoria(t: ComentarioTipoDb): CategoriaComentario {
  switch (t) {
    case 'donde_cursar':
      return 'donde-cursar';
    case 'opiniones':
      return 'opiniones-profes';
    case 'consejos':
      return 'consejos-parciales';
  }
}

function bucketsVacios(): Record<CategoriaComentario, ComentarioUsuario[]> {
  return {
    'donde-cursar': [],
    'opiniones-profes': [],
    'consejos-parciales': [],
  };
}

export function mergeComentariosMateria(
  prev: ComentariosMap,
  materiaId: string,
  grouped: Record<CategoriaComentario, ComentarioUsuario[]>,
): ComentariosMap {
  return {
    ...prev,
    [materiaId]: {
      ...bucketsVacios(),
      ...grouped,
    },
  };
}

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function loadProgreso(): MapaEstados {
  if (typeof window === 'undefined') return {};
  return safeParse<MapaEstados>(window.localStorage.getItem(STORAGE_KEY), {});
}

export function saveProgreso(estados: MapaEstados): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(estados));
}

export function clearProgreso(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}
