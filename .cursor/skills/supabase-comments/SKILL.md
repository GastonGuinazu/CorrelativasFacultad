---
name: supabase-comments
description: >-
  Comentarios por materia vía Supabase (opcional).
  Usar al editar comments.service.ts, variables de entorno o flujos de votos/comentarios.
---

# Comentarios Supabase

- **Cliente y API:** [`src/app/core/services/comments.service.ts`](src/app/core/services/comments.service.ts) — tipos de categoría alineados con [`src/app/core/storage/progress-storage.ts`](src/app/core/storage/progress-storage.ts) donde aplique.
- **Configuración:** URL y anon key en [`src/environments/environment.ts`](src/environments/environment.ts) (y entorno de producción si existe). No pegar secretos en documentación; referenciar solo el archivo de entorno.

Si Supabase no está configurado, la app debe degradar con mensajes claros (comportamiento ya definido en el servicio).
