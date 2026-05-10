# Horarios desde Google Sheets (1.º–5.º año)

## Generar JSON

1. En [Google Cloud Console](https://console.cloud.google.com/) creá un proyecto o usá uno existente.
2. Habilitá **Google Sheets API**.
3. Credenciales → **API key** (restringila a Sheets API y, si podés, a llamadas desde tu IP/CI).
4. En la terminal (PowerShell):

```powershell
$env:GOOGLE_SHEETS_API_KEY="tu_api_key"
npm run horarios:fetch
npm run horarios:fetch:cuarto
npm run horarios:fetch:tercero
npm run horarios:fetch:segundo
npm run horarios:fetch:primero
```

Salidas:

- 5.º: [`public/data/horarios-quinto.generated.json`](../../public/data/horarios-quinto.generated.json) — libro `16VWvLd2…`
- 4.º: [`public/data/horarios-cuarto.generated.json`](../../public/data/horarios-cuarto.generated.json) — libro `1d7cmVHpu0…`
- 3.º: [`public/data/horarios-tercero.generated.json`](../../public/data/horarios-tercero.generated.json) — libro `1OBBo2LZpuhW57nZZXNFeRHhHhlk-HIiem20yxhrRu-U`
- 2.º: [`public/data/horarios-segundo.generated.json`](../../public/data/horarios-segundo.generated.json) — libro `1UNUyrjq03EBUM7aaY1kYnufuu_OQ_xXEvk4ddh9W4l0`
- 1.º: [`public/data/horarios-primero.generated.json`](../../public/data/horarios-primero.generated.json) — libro `1k9ciPJ7Eqa1AaZNnZSNKhjiV69zBBXx3mkQEh-dbXTw`

La planilla debe ser legible con “cualquiera con el enlace” o la API key debe tener acceso al doc.

### Pestañas ocultas y “cursos” de más

Google Sheets puede tener **hojas ocultas** (no se ven como pestaña normal). El script **no las incluye** salvo que definas:

`HORARIOS_INCLUDE_HIDDEN_SHEETS=1`

El emparejamiento respuesta/metadata es por **`sheetId`**, no por posición en el array (la API no garantiza el mismo orden).

## Tests del parser

```bash
npm run test:horarios
```

## Si `bloques` sale vacío en el JSON

1. Revisá la consola del fetch: por cada pestaña se imprime `N bloques horario`; si es **0** pero el resumen Materia/Docentes sí tiene filas, el problema está en la **grilla** (encabezado de días / columnas de hora / merges).
2. Diagnosticá una pestaña concreta (misma API key que el fetch):

```powershell
$env:GOOGLE_SHEETS_API_KEY="tu_api_key"
npm run horarios:debug -- 1k9ciPJ7Eqa1AaZNnZSNKhjiV69zBBXx3mkQEh-dbXTw 1K1
```

Argumentos: `spreadsheetId` y **título exacto** de la pestaña. Verás candidatos a fila encabezado, `timeCol`, columnas por día y un preview de celdas.

3. Cada bloque incluye `cuatrimestre` (texto de la fila título) y `cuatrimestreTag` (`1er` \| `2do`) cuando el título contiene “cuatrimestre”, para filtros en la UI.

## Archivos

| Archivo | Rol |
|--------|-----|
| [`config-quinto.json`](config-quinto.json) | Lista blanca `sheetTitlesAllowOnly` para 5.º (evita hojas extra, p. ej. `5K5`). |
| [`config-cuarto.json`](config-cuarto.json) | Igual para 4.º (vacío = todas las pestañas visibles). |
| [`config-tercero.json`](config-tercero.json) | Igual para 3.º. |
| [`config-segundo.json`](config-segundo.json) | Igual para 2.º. |
| [`config-primero.json`](config-primero.json) | Igual para 1.º. |
| [`aliases-v5.json`](aliases-v5.json) | Patrones 5.º → obligatorias (`id` 31–36) / electivas / huecos |
| [`aliases-v4.json`](aliases-v4.json) | Patrones 4.º → obligatorias (`id` 24–30), DAO, electivas, huecos E1/E2 |
| [`aliases-v3.json`](aliases-v3.json) | Patrones 3.º → obligatorias (`id` 12, 18–23, 99), Backend electiva |
| [`aliases-v2.json`](aliases-v2.json) | Patrones 2.º → obligatorias (`id` 9, 10, 13–17) |
| [`aliases-v1.json`](aliases-v1.json) | Patrones 1.º → obligatorias (`id` 1–8, 11) |
| [`build-horarios.mjs`](build-horarios.mjs) | `node … quinto` \| `cuarto` \| `tercero` \| `segundo` \| `primero` |
| [`parse-grid.mjs`](parse-grid.mjs) | Grilla → bloques (`cuatrimestre`, `cuatrimestreTag`, horarios) + tabla Materia/Docentes |
| [`debug-sheet.mjs`](debug-sheet.mjs) | Diagnóstico de una pestaña (`npm run horarios:debug -- <id> <título>`) |
| [`match-alias.mjs`](match-alias.mjs) | Resolución de alias |
| [`sheets-api.mjs`](sheets-api.mjs) | Llamadas REST Sheets API v4 |
