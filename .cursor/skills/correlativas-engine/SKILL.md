---
name: correlativas-engine
description: >-
  Cambios en el motor de correlativas (sin IO), grafo del plan y tests asociados.
  Usar al editar correlativas.engine.ts, grafo-plan.ts o sus .spec.ts.
---

# Motor de correlativas

- **Sin IO:** la lógica vive en funciones puras; no mezclar localStorage, HTTP ni servicios.
- **Tipos de correlativa:** `reg` (regular) y `aprob` (aprobada); respetar el contrato existente en el modelo y en el JSON.
- **Tests obligatorios:** cualquier cambio de comportamiento debe ir con actualización de tests en el mismo cambio.

## Archivos clave

- [`src/app/core/rules/correlativas.engine.ts`](src/app/core/rules/correlativas.engine.ts)
- [`src/app/core/rules/correlativas.engine.spec.ts`](src/app/core/rules/correlativas.engine.spec.ts)
- [`src/app/core/rules/grafo-plan.ts`](src/app/core/rules/grafo-plan.ts)
- [`src/app/core/rules/grafo-plan.spec.ts`](src/app/core/rules/grafo-plan.spec.ts)

Narrativa de negocio no siempre reflejada en código: [`REGLAS_NEGOCIO.md`](REGLAS_NEGOCIO.md).
