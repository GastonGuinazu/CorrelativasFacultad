# CorrelativasFacu / planificador-carrera

**Qué es:** SPA Angular 19 (standalone, Tailwind 4) para seguir materias del plan UTN FRC Ingeniería en Sistemas (2023): correlativas `reg` (regular) / `aprob` (aprobada), estados por materia, estadísticas de electivas.

**Datos:** [`public/materias.json`](public/materias.json) (copia en raíz [`materias.json`](materias.json)). Obligatorias tienen `id` numérico; electivas obtienen id string vía [`materias.loader.ts`](src/app/core/data/materias.loader.ts).

**Reglas de correlativas:** motor puro [`correlativas.engine.ts`](src/app/core/rules/correlativas.engine.ts) — sin IO. Tests: [`correlativas.engine.spec.ts`](src/app/core/rules/correlativas.engine.spec.ts).

**Estado:** [`progress.store.ts`](src/app/core/state/progress.store.ts) + [`progress-storage.ts`](src/app/core/storage/progress-storage.ts) (localStorage). **Progreso al título:** [`progreso-titulo.ts`](src/app/core/rules/progreso-titulo.ts) — obligatorias del plan + créditos electivos requeridos (no “todas las materias del JSON”).

**Comentarios:** opcional Supabase [`comments.service.ts`](src/app/core/services/comments.service.ts); env en [`environment.ts`](src/environments/environment.ts).

**Reglas de negocio narradas:** [`REGLAS_NEGOCIO.md`](REGLAS_NEGOCIO.md) (no todo está codificado en el motor).

**Comandos:** `npm start` — serve; `npm run build` — prod; `npm test` — Karma + Jasmine.

**Convenciones:** cambios acotados al pedido; UI “family-friendly”; seguir estilo existente en componentes bajo `src/app/shared/`.
