/**
 * @typedef {{ nombreCanonico: string, tipo: 'obligatoria', id: number } | { nombreCanonico: string, tipo: 'electiva', nombreElectiva: string } | { tipo: 'huecoElectivo', hueco: string, opciones: string[] } | null } MatchResult
 */

/**
 * Normaliza texto de celda para comparar.
 * @param {string} s
 */
export function normalizeText(s) {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Evita que abreviaturas cortas ("IA") matcheen dentro de frases largas.
 * @param {string} n texto normalizado
 * @param {string} pn patrón normalizado
 */
function textMatchesPattern(n, pn) {
  if (!pn) return false;
  if (n === pn) return true;
  /** Tokens tipo "IA", "E1", "SG" */
  const SHORT = 4;
  if (pn.length <= SHORT) {
    const tokens = n.split(/[\s,;/]+/).filter(Boolean);
    return tokens.some((t) => t === pn);
  }
  return n.includes(pn) || pn.includes(n);
}

/**
 * @param {string} raw
 * @param {object} aliases desde aliases-v5.json
 * @returns {MatchResult}
 */
export function matchMateriaAlias(raw, aliases) {
  const n = normalizeText(raw);
  if (!n) return null;

  const oblig = aliases.obligatoriasPorId ?? {};
  for (const [idStr, cfg] of Object.entries(oblig)) {
    const patrones = cfg.patrones ?? [];
    for (const p of patrones) {
      const pn = normalizeText(p);
      if (!pn) continue;
      if (textMatchesPattern(n, pn)) {
        return {
          tipo: 'obligatoria',
          id: Number(idStr),
          nombreCanonico: cfg.nombreCanonico ?? ''
        };
      }
    }
  }

  const elect = aliases.electivasPorNombre ?? {};
  for (const [nombreElectiva, cfg] of Object.entries(elect)) {
    if (nombreElectiva.startsWith('$')) continue;
    const patrones = cfg.patrones ?? [];
    for (const p of patrones) {
      const pn = normalizeText(p);
      if (!pn) continue;
      if (textMatchesPattern(n, pn)) {
        return {
          tipo: 'electiva',
          nombreElectiva: nombreElectiva,
          nombreCanonico: nombreElectiva
        };
      }
    }
  }

  const huecos = aliases.huecosElectivos ?? {};
  for (const [hueco, cfg] of Object.entries(huecos)) {
    const patrones = cfg.patrones ?? [];
    const opciones = cfg.opciones ?? [];
    for (const p of patrones) {
      const pn = normalizeText(p);
      if (!pn) continue;
      if (textMatchesPattern(n, pn)) {
        return { tipo: 'huecoElectivo', hueco, opciones };
      }
    }
    for (const op of opciones) {
      const on = normalizeText(op);
      if (on && textMatchesPattern(n, on)) {
        return { tipo: 'huecoElectivo', hueco, opciones };
      }
    }
  }

  return null;
}
