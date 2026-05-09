import { MateriaCatalogo } from '../models/materia.model';
import { aristasDelPlan, indiceSucesoras } from './grafo-plan';

function materia(
  id: MateriaCatalogo['id'],
  overrides: Partial<Omit<MateriaCatalogo, 'id'>> = {},
): MateriaCatalogo {
  return {
    id,
    nombre: overrides.nombre ?? `M${String(id)}`,
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

describe('grafo-plan', () => {
  describe('aristasDelPlan', () => {
    it('crea arista reg desde prerequisito numérico', () => {
      const plan = [
        materia(1, { nivel: 1 }),
        materia(2, { nivel: 2, reg: [1], aprob: [] }),
      ];
      const a = aristasDelPlan(plan);
      expect(a).toContain(
        jasmine.objectContaining({ from: 1, to: 2, tipos: ['reg'] }),
      );
    });

    it('fusiona reg y aprob en una arista con dos tipos', () => {
      const plan = [
        materia(1),
        materia(2, { reg: [1], aprob: [1] }),
      ];
      const a = aristasDelPlan(plan);
      expect(a.length).toBe(1);
      expect(a[0].tipos.sort()).toEqual(['aprob', 'reg']);
    });

    it('incluye electivas como destino', () => {
      const idEl = 'electiva-n3-x';
      const plan = [
        materia(1),
        materia(idEl, {
          esElectiva: true,
          obligatoria: false,
          nivel: 3,
          reg: [1],
          aprob: [],
        }),
      ];
      const a = aristasDelPlan(plan);
      expect(a.some((x) => x.to === idEl && x.from === 1)).toBe(true);
    });
  });

  describe('indiceSucesoras', () => {
    it('agrupa destinos por prerequisito', () => {
      const aristas = aristasDelPlan([
        materia(1),
        materia(2, { reg: [1] }),
        materia(3, { reg: [1] }),
      ]);
      const idx = indiceSucesoras(aristas);
      const set = new Map<number, Set<string>>();
      for (const [k, v] of idx) {
        set.set(k, new Set(v.map(String)));
      }
      expect(set.get(1)?.has('2')).toBe(true);
      expect(set.get(1)?.has('3')).toBe(true);
    });
  });
});
