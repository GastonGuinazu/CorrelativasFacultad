import { MateriaCatalogo, MateriaId } from '../models/materia.model';

export type TipoAristaPlan = 'reg' | 'aprob';

/** Arista dirigida prerequisito → materia (desde catálogo `reg` / `aprob`). */
export interface AristaPlan {
  from: number;
  to: MateriaId;
  tipos: TipoAristaPlan[];
}

function keyArista(from: number, to: MateriaId): string {
  return `${from}->${String(to)}`;
}

/**
 * Construye aristas únicas por par (from, to), acumulando si aparece en `reg` y/o `aprob`.
 */
export function aristasDelPlan(
  materias: readonly MateriaCatalogo[],
): AristaPlan[] {
  const map = new Map<string, AristaPlan>();
  for (const m of materias) {
    const to = m.id;
    for (const p of m.reg) {
      const k = keyArista(p, to);
      const cur = map.get(k);
      if (cur) {
        if (!cur.tipos.includes('reg')) cur.tipos.push('reg');
      } else {
        map.set(k, { from: p, to, tipos: ['reg'] });
      }
    }
    for (const p of m.aprob) {
      const k = keyArista(p, to);
      const cur = map.get(k);
      if (cur) {
        if (!cur.tipos.includes('aprob')) cur.tipos.push('aprob');
      } else {
        map.set(k, { from: p, to, tipos: ['aprob'] });
      }
    }
  }
  return [...map.values()];
}

/**
 * Para cada ID de materia obligatoria `from`, lista materias que la tienen como correlativa.
 */
export function indiceSucesoras(
  aristas: readonly AristaPlan[],
): Map<number, MateriaId[]> {
  const m = new Map<number, MateriaId[]>();
  for (const a of aristas) {
    const arr = m.get(a.from) ?? [];
    const dup = arr.some((id) => String(id) === String(a.to));
    if (!dup) arr.push(a.to);
    m.set(a.from, arr);
  }
  return m;
}
