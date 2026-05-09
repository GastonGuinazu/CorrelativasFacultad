import { MateriaCatalogo, MateriaId } from '../models/materia.model';
import {
  cumpleAprobada,
  cumpleRegular,
  evaluarMateria,
  evaluarPlan,
  indexarPorId,
  obtenerEstado,
} from './correlativas.engine';

function materia(
  id: MateriaId,
  overrides: Partial<Omit<MateriaCatalogo, 'id'>> = {},
): MateriaCatalogo {
  return {
    id,
    nombre: overrides.nombre ?? `Materia ${String(id)}`,
    nivel: overrides.nivel ?? 1,
    esElectiva: overrides.esElectiva ?? false,
    obligatoria: overrides.obligatoria ?? true,
    cuentaProgresoTitulo: overrides.cuentaProgresoTitulo ?? true,
    creditos: overrides.creditos ?? 0,
    reg: overrides.reg ?? [],
    aprob: overrides.aprob ?? [],
    nota: overrides.nota,
  };
}

describe('correlativas.engine', () => {
  describe('obtenerEstado', () => {
    it('devuelve pendiente si no hay entrada', () => {
      expect(obtenerEstado({}, 1)).toBe('pendiente');
    });

    it('lee estado guardado por id numérico', () => {
      expect(obtenerEstado({ 5: 'regular' }, 5)).toBe('regular');
    });

    it('lee estado guardado por id string (electivas)', () => {
      const id = 'electiva-n3-test';
      expect(obtenerEstado({ [id]: 'aprobada' }, id)).toBe('aprobada');
    });
  });

  describe('cumpleRegular', () => {
    it('es false para pendiente y cursando', () => {
      expect(cumpleRegular({ 1: 'pendiente' }, 1)).toBe(false);
      expect(cumpleRegular({ 1: 'cursando' }, 1)).toBe(false);
    });

    it('es true para regular y aprobada', () => {
      expect(cumpleRegular({ 1: 'regular' }, 1)).toBe(true);
      expect(cumpleRegular({ 1: 'aprobada' }, 1)).toBe(true);
    });
  });

  describe('cumpleAprobada', () => {
    it('solo es true si está aprobada', () => {
      expect(cumpleAprobada({ 1: 'regular' }, 1)).toBe(false);
      expect(cumpleAprobada({ 1: 'aprobada' }, 1)).toBe(true);
    });
  });

  describe('evaluarMateria', () => {
    const cat = new Map<number, MateriaCatalogo>([
      [1, materia(1, { nombre: 'Álgebra' })],
      [2, materia(2, { nombre: 'Análisis I' })],
    ]);

    it('sin correlativas queda disponible', () => {
      const m = materia(99, { nombre: 'Libre', reg: [], aprob: [] });
      const ev = evaluarMateria(m, {}, cat);
      expect(ev.disponibilidad).toBe('disponible');
      expect(ev.faltantesRegular.length).toBe(0);
      expect(ev.faltantesAprobada.length).toBe(0);
    });

    it('lista faltantes de regular cuando no cumplen', () => {
      const m = materia(10, { reg: [1, 2], aprob: [] });
      const ev = evaluarMateria(m, {}, cat);
      expect(ev.disponibilidad).toBe('bloqueada');
      expect(ev.faltantesRegular.map((f) => f.id)).toEqual([1, 2]);
      expect(ev.faltantesRegular.every((f) => f.tipo === 'regular')).toBe(true);
    });

    it('regulariza correlativa de regular', () => {
      const m = materia(10, { reg: [1], aprob: [] });
      const ev = evaluarMateria(m, { 1: 'regular' }, cat);
      expect(ev.disponibilidad).toBe('disponible');
    });

    it('lista faltantes de aprobada hasta que estén aprobadas', () => {
      const m = materia(18, { reg: [], aprob: [1, 2] });
      let ev = evaluarMateria(m, { 1: 'regular', 2: 'regular' }, cat);
      expect(ev.disponibilidad).toBe('bloqueada');
      expect(ev.faltantesAprobada.length).toBe(2);

      ev = evaluarMateria(m, { 1: 'aprobada', 2: 'regular' }, cat);
      expect(ev.disponibilidad).toBe('bloqueada');
      expect(ev.faltantesAprobada.map((f) => f.id)).toEqual([2]);

      ev = evaluarMateria(m, { 1: 'aprobada', 2: 'aprobada' }, cat);
      expect(ev.disponibilidad).toBe('disponible');
    });

    it('usa nombre genérico si el id no está en el índice', () => {
      const m = materia(50, { reg: [999], aprob: [] });
      const ev = evaluarMateria(m, {}, cat);
      expect(ev.faltantesRegular[0].nombre).toBe('Materia #999');
    });
  });

  describe('evaluarPlan', () => {
    it('solo indexa ids numéricos para resolver nombres de correlativas', () => {
      const oblig = materia(1, { nombre: 'Base' });
      const elect = materia('electiva-n4-x', {
        nombre: 'Electiva X',
        esElectiva: true,
        obligatoria: false,
        reg: [1],
        aprob: [],
      });
      const plan = [oblig, elect];
      const evs = evaluarPlan(plan, { 1: 'regular' });
      expect(evs.length).toBe(2);
      const electEv = evs.find((e) => e.materia.esElectiva);
      expect(electEv?.disponibilidad).toBe('disponible');
      expect(electEv?.estado).toBe('pendiente');
    });
  });

  describe('indexarPorId', () => {
    it('contiene solo materias con id numérico', () => {
      const plan = [
        materia(1),
        materia('e-1', { esElectiva: true, obligatoria: false }),
      ];
      const idx = indexarPorId(plan);
      expect(idx.size).toBe(1);
      expect(idx.get(1)?.nombre).toBe('Materia 1');
    });
  });
});
