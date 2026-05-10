/**
 * JSON generado por los scripts ETL (`horarios-*-generated.json`, años 1–5).
 * Mismo schema para todos los años cursados.
 */

export interface HorariosQuintoPayload {
  schemaVersion: number;
  fuente: HorariosFuente;
  cursos: HorariosCurso[];
}

/** Alias del mismo payload (cualquier año cursado en `fuente.anioCursado`). */
export type HorariosPayload = HorariosQuintoPayload;

export interface HorariosFuente {
  spreadsheetId: string;
  url: string;
  extraidoEn: string | null;
  anioCursado: number;
}

export interface HorariosCurso {
  curso: string;
  sheetId: number;
  bloques: HorarioBloque[];
  resumenMateriaDocente: ResumenMateriaDocenteFila[];
  warnings?: string[];
  stats?: { filasMatrix?: number; columnasMatrix?: number };
}

export interface HorarioBloque {
  cuatrimestre: string | null;
  /** Derivado del título de cuadro en la planilla; más estable que parsear `cuatrimestre`. */
  cuatrimestreTag?: '1er' | '2do' | null;
  dia: string;
  horaInicio: string;
  horaFin: string;
  materiaCrudo: string;
  materiaMatch: MateriaMatch | null;
  colorRgb: string | null;
}

export type MateriaMatch =
  | {
      tipo: 'obligatoria';
      id: number;
      nombreCanonico: string;
    }
  | {
      tipo: 'electiva';
      nombreElectiva: string;
      nombreCanonico: string;
    }
  | {
      tipo: 'huecoElectivo';
      hueco: string;
      opciones: string[];
    };

export interface ResumenMateriaDocenteFila {
  materiaCrudo: string | null;
  docentesCrudo: string | null;
  materiaMatch: MateriaMatch | null;
  colorRgbMateria: string | null;
  colorRgbDocentes: string | null;
}
