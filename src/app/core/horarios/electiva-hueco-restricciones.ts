import { normalizeLoose } from '../utils/materia-match-label';

/**
 * Huecos electivos (E1/E2) en los que puede dictarse cada electiva cuando la planilla
 * solo dice "Electiva 1/2" y el ETL no puede inferir la materia por celda.
 *
 * Sin esto, cualquier electiva listada en `opciones` de E1 y E2 en aliases matchea
 * **todos** los bloques de ambos huecos (p. ej. Green Software aparecía también en Viernes E2).
 *
 * Ajustar si la oferta real de una comisión difiere (convención UTN FRC / plan vigente).
 */
export const ELECTIVA_SOLO_HUECOS: Readonly<
  Record<string, readonly ('E1' | 'E2')[]>
> = {
  'Green Software': ['E1'],
};

export function huecosPermitidosParaElectiva(
  nombreMateria: string,
): readonly ('E1' | 'E2')[] | null {
  const n = normalizeLoose(nombreMateria);
  for (const [k, v] of Object.entries(ELECTIVA_SOLO_HUECOS)) {
    if (normalizeLoose(k) === n) return v;
  }
  return null;
}
