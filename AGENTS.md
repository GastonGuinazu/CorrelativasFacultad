# Instrucciones para agentes (Cursor)

Objetivo: **misma información que [`Agent.md`](Agent.md)**, pero orientado a **elegir skill** y **no duplicar** tablas largas en el chat.

## Antes de implementar

1. Leé [`Agent.md`](Agent.md) si el cambio es sustancial (stack, rutas, convenciones).
2. Abrí **solo** el skill del dominio que vas a tocar (tabla abajo). No leas todos los skills.

## Skills por dominio

| Dominio | Skill |
|--------|--------|
| Motor correlativas, grafo | `.cursor/skills/correlativas-engine/SKILL.md` |
| Progreso usuario, localStorage | `.cursor/skills/progress-y-storage/SKILL.md` |
| UI Angular, features, shared | `.cursor/skills/angular-ui-correlativas/SKILL.md` |
| `materias.json`, loader, modelo materia | `.cursor/skills/materias-y-json/SKILL.md` |
| Comentarios Supabase | `.cursor/skills/supabase-comments/SKILL.md` |
| ETL horarios Sheets → JSON, aliases, `/cursos-profes` | `.cursor/skills/horarios-sheets/SKILL.md` |

Reglas de negocio narrativas: [`REGLAS_NEGOCIO.md`](REGLAS_NEGOCIO.md) (enlace; no copiar texto largo).

## Horarios (resumen)

- **Pipeline:** `GOOGLE_SHEETS_API_KEY` → `npm run horarios:fetch:*` → `public/data/horarios-*.generated.json` → app lee JSON en `/cursos-profes` y `/cronograma` (este último fusiona los cinco archivos).
- **Aliases:** `scripts/horarios/aliases-v{1–5}.json` — IDs deben existir en [`public/materias.json`](public/materias.json).
- **Detalle:** [`scripts/horarios/README.md`](scripts/horarios/README.md).

## Ahorro de tokens

- No pegues JSON generado completo ni respuestas API en el chat.
- Preferí rutas de archivo y comandos (`npm run …`) sobre volcar contenido.
