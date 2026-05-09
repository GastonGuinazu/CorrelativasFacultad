/**
 * Progreso hacia el título de Ingeniería (plan de datos): las materias
 * obligatorias que cuentan para el título deben estar aprobadas y se requiere
 * un mínimo de créditos en electivas (no hace falta cursar todas las electivas
 * del listado). Materias marcadas como excluidas (ej. solo título intermedio)
 * no entran en obligatoriasTotal.
 *
 * Denominador: cantidad de obligatorias (que cuentan) + créditos electivos requeridos.
 * Numerador: obligatorias aprobadas + min(créditos electivos aprobados, requeridos).
 */
export function progresoTituloIngenieria(params: {
  obligatoriasTotal: number;
  obligatoriasAprobadas: number;
  creditosElectivosAprobados: number;
  creditosElectivosRequeridos: number;
}): number {
  const {
    obligatoriasTotal,
    obligatoriasAprobadas,
    creditosElectivosAprobados,
    creditosElectivosRequeridos,
  } = params;

  const credRequeridos = Math.max(0, creditosElectivosRequeridos);
  const credContados = Math.min(
    Math.max(0, creditosElectivosAprobados),
    credRequeridos,
  );

  const denominador = obligatoriasTotal + credRequeridos;
  if (denominador <= 0) return 0;

  const numerador = obligatoriasAprobadas + credContados;
  return Math.round((numerador / denominador) * 100);
}
