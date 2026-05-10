---
name: angular-ui-correlativas
description: >-
  UI Angular standalone, Tailwind 4 y componentes compartidos del planificador.
  Usar al editar páginas en features o componentes en shared.
---

# UI (Angular + Tailwind)

- **Stack:** Angular 19 standalone; estilos con Tailwind 4; rutas en [`src/app/app.routes.ts`](src/app/app.routes.ts).
- **Rutas de features:** `''` planificador, `mapa` mapa de correlatividades, `cursos-profes` horarios/docentes (`etiquetaMatch` en [`materia-match-label.ts`](../../../src/app/core/utils/materia-match-label.ts): huecos E1/E2 no enumeran todas las opciones en cada fila), `cronograma` armado de grilla semanal (materias disponibles + comisiones + solapes).
- **`/cronograma`:** aviso que enlaza al planificador (lista según correlativas y estado); selector **1.er / 2.do** cuatrimestre; grilla **timeline continuo** por día; `lg:sticky`; solapes en columnas (`cronograma-armado.page.ts` + `cronograma-resumen-horario.ts`). Hover en **Usar esta comisión** dibuja vista previa semitransparente; si solapa con materias ya elegidas, tono bordeaux/rojo.
- **Patrones:** reutilizar componentes existentes bajo [`src/app/shared/`](src/app/shared) (modales, tarjetas, paneles) en lugar de duplicar markup o estilos.
- **Tono:** UI clara y “family-friendly”; mantener coherencia tipográfica, espaciado y accesibilidad con lo ya presente en la app.

## Carpetas

- [`src/app/features/`](src/app/features)
- [`src/app/shared/`](src/app/shared)

Cambios acotados al pedido; no refactorizar carpetas enteras salvo que el ticket lo pida.
