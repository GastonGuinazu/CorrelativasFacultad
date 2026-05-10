import {
  bloquesSolapan,
  encontrarSolapeEntreListas,
  haySolapeEntreSelecciones,
  parseHoraAMinutos,
} from './cronograma-overlap';
import { HorarioBloque } from '../models/horarios-quinto.model';

describe('cronograma-overlap', () => {
  it('parseHoraAMinutos', () => {
    expect(parseHoraAMinutos('8:00')).toBe(480);
    expect(parseHoraAMinutos('08:30')).toBe(510);
    expect(parseHoraAMinutos('23:05')).toBe(23 * 60 + 5);
    expect(parseHoraAMinutos('')).toBeNull();
  });

  it('bloquesSolapan mismo día', () => {
    const base = {
      cuatrimestre: null,
      dia: 'Lunes',
      materiaCrudo: 'x',
      materiaMatch: null,
      colorRgb: null,
    };
    const a: HorarioBloque = {
      ...base,
      horaInicio: '10:00',
      horaFin: '11:00',
    };
    const b: HorarioBloque = {
      ...base,
      horaInicio: '10:30',
      horaFin: '11:30',
    };
    expect(bloquesSolapan(a, b)).toBeTrue();

    const c: HorarioBloque = {
      ...base,
      horaInicio: '11:00',
      horaFin: '12:00',
    };
    expect(bloquesSolapan(a, c)).toBeFalse();

    const martes: HorarioBloque = { ...a, dia: 'Martes' };
    expect(bloquesSolapan(a, martes)).toBeFalse();
  });

  it('haySolapeEntreSelecciones', () => {
    const mk = (
      dia: string,
      ini: string,
      fin: string,
    ): HorarioBloque => ({
      cuatrimestre: null,
      dia,
      horaInicio: ini,
      horaFin: fin,
      materiaCrudo: 'm',
      materiaMatch: null,
      colorRgb: null,
    });
    const s1 = [mk('Lunes', '9:00', '11:00')];
    const s2 = [mk('Lunes', '10:00', '12:00')];
    expect(haySolapeEntreSelecciones([s1, s2])).not.toBeNull();
    expect(haySolapeEntreSelecciones([s1, [mk('Martes', '10:00', '12:00')]])).toBeNull();
  });

  it('encontrarSolapeEntreListas borde contiguo no solapa [10,11) y [11,12)', () => {
    const mk = (ini: string, fin: string): HorarioBloque => ({
      cuatrimestre: null,
      dia: 'Lunes',
      horaInicio: ini,
      horaFin: fin,
      materiaCrudo: 'm',
      materiaMatch: null,
      colorRgb: null,
    });
    expect(encontrarSolapeEntreListas([mk('10:00', '11:00')], [mk('11:00', '12:00')])).toBeNull();
  });
});
