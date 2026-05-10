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

/** Abreviaturas tipo "IA", "E1", "IS", "AS" — mismo umbral que patrones cortos */
const SHORT_TOKEN_MAX_LEN = 4;

/**
 * Evita falsos positivos: texto corto dentro de nombre largo (p. ej. "is" ⊂ "legislacion", "as" ⊂ "tecnologias").
 * @param {string} longNorm patrón largo ya normalizado
 * @param {string} shortNorm celda corta ya normalizada
 */
function longPatternContainsShortAsWord(longNorm, shortNorm) {
  const chunks = longNorm.split(/[\s,;/]+/).filter(Boolean);
  return chunks.some((c) => c === shortNorm);
}

/**
 * Evita que abreviaturas cortas ("IA") matcheen dentro de frases largas.
 * @param {string} n texto normalizado
 * @param {string} pn patrón normalizado
 */
function textMatchesPattern(n, pn) {
  if (!pn) return false;
  if (n === pn) return true;
  if (pn.length <= SHORT_TOKEN_MAX_LEN) {
    const tokens = n.split(/[\s,;/]+/).filter(Boolean);
    return tokens.some((t) => t === pn);
  }
  if (n.includes(pn)) return true;
  if (!pn.includes(n)) return false;
  /** pn incluye n como substring; si n es abreviatura corta, exigir palabra/token completo en pn */
  if (n.length <= SHORT_TOKEN_MAX_LEN) {
    return longPatternContainsShortAsWord(pn, n);
  }
  return true;
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
