---
name: materias-y-json
description: >-
  Fuente de datos del plan: materias.json, loader y modelo de materia.
  Usar al editar materias.loader.ts, materia.model.ts o archivos JSON del plan.
---

# Materias y JSON

- **Fuente:** [`public/materias.json`](public/materias.json); copia en raíz [`materias.json`](materias.json) — mantener coherencia si ambos deben seguir iguales (según flujo del proyecto).
- **IDs:** obligatorias con `id` numérico; electivas con id string asignado en [`src/app/core/data/materias.loader.ts`](src/app/core/data/materias.loader.ts).
- **Modelo:** [`src/app/core/models/materia.model.ts`](src/app/core/models/materia.model.ts) — no romper tipos usados por el motor ni por la UI.

Cambios en JSON grandes: revisar impacto en correlativas y en tests del motor antes de commitear.
