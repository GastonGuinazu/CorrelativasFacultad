/** Eventos emitidos por ProgressStore para micro-interacciones (confetti, UI). */
export type CelebracionEvent =
  | { kind: 'materia-aprobada'; materiaId: 99 | 36 }
  | { kind: 'titulo-completo' };
