---
name: angular-ui-correlativas
description: >-
  UI Angular standalone, Tailwind 4 y componentes compartidos del planificador.
  Usar al editar páginas en features o componentes en shared.
---

# UI (Angular + Tailwind)

- **Stack:** Angular 19 standalone; estilos con Tailwind 4; rutas en [`src/app/app.routes.ts`](src/app/app.routes.ts).
- **Rutas de features:** `''` planificador, `mapa` mapa de correlatividades, `cursos-profes` horarios/docentes, `cronograma` armado de grilla semanal (materias disponibles + comisiones + solapes).
- **`/cronograma`:** selector **1.er / 2.do** cuatrimestre arriba en full width; lista y comisiones filtradas por bloques del JSON; grilla con **columnas día = timeline continuo** (bloques en % 8:00–23:05, tramos fusionados como el resumen); panel `lg:sticky`; solapes en la misma franja horaria repartidos en columnas (`cronograma-armado.page.ts` + `core/utils/cronograma-resumen-horario.ts`).
- **Patrones:** reutilizar componentes existentes bajo [`src/app/shared/`](src/app/shared) (modales, tarjetas, paneles) en lugar de duplicar markup o estilos.
- **Tono:** UI clara y “family-friendly”; mantener coherencia tipográfica, espaciado y accesibilidad con lo ya presente en la app.

## Carpetas

- [`src/app/features/`](src/app/features)
- [`src/app/shared/`](src/app/shared)

Cambios acotados al pedido; no refactorizar carpetas enteras salvo que el ticket lo pida.
