---
name: horarios-sheets
description: >-
  ETL horarios/docentes: Google Sheets API → scripts/horarios → JSON en public/data;
  UI /cursos-profes y /cronograma. Leer al editar fetch, aliases-v1–v5, parse-grid, match-alias o esas páginas.
---

# Horarios y Google Sheets

## Flujo

```
Sheets API + build-horarios.mjs → horarios-<año>.generated.json (public/data/) → HttpClient (cursos-profes, cronograma carga los 5 JSON)
```

## Presets (una fila por año cursado)

| Preset `argv` | npm | Aliases | Salida `public/data/` | UI `anio` query |
|---------------|-----|---------|-------------------------|-----------------|
| `quinto` | `horarios:fetch` | `aliases-v5.json` | `horarios-quinto.generated.json` | 5 |
| `cuarto` | `horarios:fetch:cuarto` | `aliases-v4.json` | `horarios-cuarto.generated.json` | 4 |
| `tercero` | `horarios:fetch:tercero` | `aliases-v3.json` | `horarios-tercero.generated.json` | 3 |
| `segundo` | `horarios:fetch:segundo` | `aliases-v2.json` | `horarios-segundo.generated.json` | 2 |
| `primero` | `horarios:fetch:primero` | `aliases-v1.json` | `horarios-primero.generated.json` | 1 |

`spreadsheetId` por preset: [`build-horarios.mjs`](../../../scripts/horarios/build-horarios.mjs). Lista blanca de pestañas: `config-<preset>.json` → `sheetTitlesAllowOnly` (vacío = todas las visibles).

## Archivos clave

| Rol | Ruta |
|-----|------|
| Build | [`scripts/horarios/build-horarios.mjs`](../../../scripts/horarios/build-horarios.mjs) |
| Parser grilla | [`scripts/horarios/parse-grid.mjs`](../../../scripts/horarios/parse-grid.mjs) |
| Match texto → materia | [`scripts/horarios/match-alias.mjs`](../../../scripts/horarios/match-alias.mjs) |
| API Sheets | [`scripts/horarios/sheets-api.mjs`](../../../scripts/horarios/sheets-api.mjs) |
| Schema JSON / tipos app | [`src/app/core/models/horarios-quinto.model.ts`](../../../src/app/core/models/horarios-quinto.model.ts) |
| Páginas | [`cursos-profes.page.ts`](../../../src/app/features/cursos-profes/cursos-profes.page.ts), [`cronograma-armado.page.ts`](../../../src/app/features/cronograma-armado/cronograma-armado.page.ts) |
| Rutas | `cursos-profes`, `cronograma` en [`app.routes.ts`](../../../src/app/app.routes.ts); `/horarios` → redirect a cursos-profes |

## Parser `parse-grid.mjs` (grilla)

- Elige el encabezado Lunes…Viernes con **mayor score** (celdas de materia no vacías bajo filas de hora), no solo la primera fila con ≥3 días.
- Segundo cuadro (2.do cuatrimestre): fila título con “cuatrimestre”, opcional **nueva fila** Lunes…Viernes; se actualiza el mapa de columnas y el carry.
- Par **desde/hasta** por fila (`findFirstTimePairColumn` + `shiftColumnasAgenda` por fila): soporta columna A vacía y horas en B–C.
- Celdas de materia vacías: carry vertical (solo si parece celda combinada: mismo `bgKey` que el arrastre; filas ~45 min). **No** arrastrar a filas cortas (≤22 min, recreo) ni largas (≥62 min, almuerzo/hueco) ni si la celda vacía es blanca y la materia venía con color (`parse-grid.mjs`). Luego **merge** de franjas consecutivas misma materia/día/cuatrimestre.
- Cada bloque: `cuatrimestre`, `cuatrimestreTag` (`1er`|`2do`), `dia`, horas, `materiaMatch`.
- Diagnóstico: `npm run horarios:debug -- <spreadsheetId> <pestaña>` → [`debug-sheet.mjs`](../../../scripts/horarios/debug-sheet.mjs).
- Exporta: `normalizeTimeCell`, `findFirstTimePairColumn`, `inferCuatrimestreTag` (tests en `parse-grid.test.mjs`).

## UI

- **Cursos y Profes:** selector **1.º–5.º año**; `?anio=1..5`. JSON según tabla arriba.
- **Cronograma:** usa los cinco JSON; índice materia → comisiones en [`horarios-index.ts`](../../../src/app/core/horarios/horarios-index.ts) y solapes en [`cronograma-overlap.ts`](../../../src/app/core/rules/cronograma-overlap.ts).

## Operación

- Env: `GOOGLE_SHEETS_API_KEY`. Opcional: `HORARIOS_INCLUDE_HIDDEN_SHEETS=1`.
- Tests: `npm run test:horarios`.
- Guía larga (API key, troubleshooting): [`scripts/horarios/README.md`](../../../scripts/horarios/README.md).

No mantener aquí tablas de abreviaturas por materia; viven en cada `aliases-v{n}.json` y en el plan (`materias.json`).
