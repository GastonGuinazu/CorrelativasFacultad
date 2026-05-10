import { HorarioBloque } from './horarios-quinto.model';
import { MateriaId } from './materia.model';

/** Identificador estable de una comisión dentro del JSON de horarios. */
export interface CursoHorarioKey {
  anioCursado: number;
  sheetId: number;
  curso: string;
}

/** Una opción de cursada para una materia del plan (comisión + docentes + bloques filtrados). */
export interface OfertaCursoHorario extends CursoHorarioKey {
  docentesResumen: string | null;
  bloques: HorarioBloque[];
}

/** Materia del plan + comisión elegida para el armado visual. */
export interface CronogramaSeleccion {
  materiaId: MateriaId;
  oferta: OfertaCursoHorario;
}
