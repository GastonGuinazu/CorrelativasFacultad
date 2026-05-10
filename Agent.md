# CorrelativasFacu / planificador-carrera

**Qué es:** SPA Angular 19 (standalone, Tailwind 4) para seguir materias del plan UTN FRC Ingeniería en Sistemas (2023): correlativas `reg` (regular) / `aprob` (aprobada), estados por materia, estadísticas de electivas.

## Skills del proyecto (contexto bajo demanda)

Índice liviano para agentes: [`AGENTS.md`](AGENTS.md).

Leé solo el skill que corresponda al área que vas a tocar — viven en `.cursor/skills/<nombre>/SKILL.md`:

| Área | Skill |
|------|--------|
| Motor de correlativas, grafo del plan | [correlativas-engine](.cursor/skills/correlativas-engine/SKILL.md) |
| Progreso, localStorage, progreso al título | [progress-y-storage](.cursor/skills/progress-y-storage/SKILL.md) |
| Páginas y componentes UI (`features`, `shared`) | [angular-ui-correlativas](.cursor/skills/angular-ui-correlativas/SKILL.md) |
| `materias.json`, loader, modelo materia | [materias-y-json](.cursor/skills/materias-y-json/SKILL.md) |
| Comentarios Supabase | [supabase-comments](.cursor/skills/supabase-comments/SKILL.md) |
| Horarios Google Sheets (ETL 1.º–5.º, JSON) | [horarios-sheets](.cursor/skills/horarios-sheets/SKILL.md) |

**Reglas de negocio narradas** (no todo está en el motor): [`REGLAS_NEGOCIO.md`](REGLAS_NEGOCIO.md).

**Comandos:** `npm start` — serve; `npm run build` — prod; `npm test` — Karma + Jasmine.

**Rutas:** `/` planificador; `/mapa`; `/cursos-profes`; `/cronograma` (armado semanal con datos de `horarios-*.generated.json`).

**Convenciones:** cambios acotados al pedido; UI “family-friendly”; seguir estilo existente en [`src/app/shared/`](src/app/shared/).

### Mantenimiento de skills y rules

Regla siempre activa del proyecto: [`.cursor/rules/maintain-cursor-context.mdc`](.cursor/rules/maintain-cursor-context.mdc). Si el cambio es **importante** (p. ej. flujo nuevo, persistencia, motor, modelo de datos) o **toca un área que ya tiene skill**, antes de dar por cerrado el trabajo: actualizá el `SKILL.md` afectado (o creá skill + fila en la tabla de arriba + rule con `globs` si es un dominio nuevo) y revisá si hace falta [`REGLAS_NEGOCIO.md`](REGLAS_NEGOCIO.md).

### Delegación (subagentes)

- Búsqueda amplia en el repo o mapa de archivos (“¿dónde está…?”): subagente **explore** (solo lectura) para no cargar de golpe demasiados archivos en el chat principal.
- Ejecutar build, tests o scripts con salida larga: **shell** / terminal integrada.
