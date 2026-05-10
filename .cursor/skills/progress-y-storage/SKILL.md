---
name: progress-y-storage
description: >-
  Estado de progreso del usuario, persistencia en localStorage y cálculo de progreso al título.
  Usar al editar progress.store, progress-storage o progreso-titulo.
---

# Progreso y almacenamiento

- **Persistencia:** [`src/app/core/storage/progress-storage.ts`](src/app/core/storage/progress-storage.ts) — respetar el esquema guardado; si cambia la forma de los datos, valorar migración o compatibilidad hacia atrás.
- **Estado reactivo:** [`src/app/core/state/progress.store.ts`](src/app/core/state/progress.store.ts) — mantener una sola fuente de verdad para estados por materia.
- **Progreso al título:** [`src/app/core/rules/progreso-titulo.ts`](src/app/core/rules/progreso-titulo.ts) — se basa en obligatorias del plan + créditos electivos requeridos; **no** en “aprobar todas las materias que aparecen en el JSON”.

## Tests

- [`src/app/core/rules/progreso-titulo.spec.ts`](src/app/core/rules/progreso-titulo.spec.ts)

Reglas narradas: [`REGLAS_NEGOCIO.md`](REGLAS_NEGOCIO.md).
