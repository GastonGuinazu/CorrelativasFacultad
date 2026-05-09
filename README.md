# Planificador de carrera — UTN FRC (Ingeniería en Sistemas, plan 2023)

SPA para **seguir materias**, **correlativas** (regular / aprobada) y **requisitos del plan** desde el navegador.

---

## Sobre este repositorio

Es un proyecto que fui construyendo como **experiencia personal**: decisiones de modelo de datos, motor de reglas, estado en Angular y UI. Lo comparto **para que se vea el trabajo**, no como plantilla lista para clonar ni como producto mantenido para terceros.

---

## Qué incluye

| Área | Descripción |
|------|-------------|
| Plan | Materias por nivel, obligatorias y electivas; datos en `public/materias.json`. |
| Correlativas | Motor sin IO (`correlativas.engine.ts`) + tests unitarios. |
| Progreso | Estados por materia guardados en **localStorage** en tu navegador. |
| Comentarios | Opcional: **Supabase**, comentarios por materia con anon key (sin login). |

Documentación de contexto: [`REGLAS_NEGOCIO.md`](REGLAS_NEGOCIO.md). Convenciones y mapa del código: [`Agent.md`](Agent.md).

---

## Stack

Angular **19** (standalone, Signals), **Tailwind CSS 4**, **Supabase** solo para la función de comentarios.

---

## Desarrollo local

Requisitos: **Node.js** (LTS) y **npm**.

```bash
npm install
npm start
```

Abre **http://localhost:4200/**.

| Comando | Uso |
|---------|-----|
| `npm run build` | Build de producción |
| `npm test` | Tests (Karma + Jasmine) |
| `npm run test:ci` | Tests en modo CI (Chrome headless) |

### Comentarios con Supabase (opcional)

1. Creá un proyecto en [Supabase](https://supabase.com).
2. Ejecutá el SQL de [`supabase/migrations/`](supabase/migrations/) en el SQL Editor.
3. Copiá URL y **anon key** en [`src/environments/environment.ts`](src/environments/environment.ts).

Sin Supabase, la app funciona; solo no habrá comentarios compartidos entre usuarios.

---

## Demo y capturas

*(Cuando tengas deploy o screenshots, sumá acá el link o una imagen en `/docs` para quien entre desde GitHub.)*

---

## Aviso

La información del plan en el JSON **no sustituye** a la publicada por la **UTN / la facultad**. Usala como ayuda, no como verdad oficial.

---

## Licencia

No hay licencia pública en este repo: el código queda bajo tu autoría por defecto. Si más adelante querés permitir reutilización, conviene añadir un archivo `LICENSE` (por ejemplo MIT).
