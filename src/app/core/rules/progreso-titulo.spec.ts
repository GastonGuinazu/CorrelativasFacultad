import { progresoTituloIngenieria } from './progreso-titulo';

describe('progresoTituloIngenieria', () => {
  const base = {
    obligatoriasTotal: 40,
    obligatoriasAprobadas: 0,
    creditosElectivosAprobados: 0,
    creditosElectivosRequeridos: 20,
  };

  it('devuelve 100% con todas las obligatorias y créditos electivos cumplidos', () => {
    expect(
      progresoTituloIngenieria({
        ...base,
        obligatoriasAprobadas: 40,
        creditosElectivosAprobados: 22,
      }),
    ).toBe(100);
  });

  it('no penaliza créditos electivos por encima del requisito', () => {
    expect(
      progresoTituloIngenieria({
        ...base,
        obligatoriasAprobadas: 40,
        creditosElectivosAprobados: 40,
      }),
    ).toBe(100);
  });

  it('combina obligatorias y créditos en una sola meta', () => {
    expect(
      progresoTituloIngenieria({
        ...base,
        obligatoriasAprobadas: 20,
        creditosElectivosAprobados: 10,
      }),
    ).toBe(50);
  });

  it('devuelve 0 si no hay meta definida', () => {
    expect(
      progresoTituloIngenieria({
        obligatoriasTotal: 0,
        obligatoriasAprobadas: 0,
        creditosElectivosAprobados: 0,
        creditosElectivosRequeridos: 0,
      }),
    ).toBe(0);
  });
});
