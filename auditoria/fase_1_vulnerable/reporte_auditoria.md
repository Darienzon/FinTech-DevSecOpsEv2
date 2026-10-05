# Registro de pruebas y acciones — modo vulnerable

Las peticiones HTTP recibidas por la aplicación en modo vulnerable se agregan automáticamente al final de este informe. Se registra la fecha UTC, el método, la ruta sin parámetros de consulta y el resultado HTTP; no se guardan cuerpos ni credenciales.

| Fecha y hora (UTC) | Método | Ruta | Resultado HTTP |
|---|---|---|---:|
| 2026-10-05T04:14:03.791Z | GET | `/__mode` | 200 |
| 2026-10-05T04:14:03.798Z | GET | `/api/health` | 200 |
| 2026-10-05T04:14:03.800Z | POST | `/__mode/seguro` | 200 |
| 2026-10-05T04:14:31.496Z | GET | `/api/health` | 200 |
| 2026-10-05T04:19:55.398Z | GET | `/api/health` | 200 |
| 2026-10-05T04:19:55.422Z | GET | `/api/health` | 200 |
| 2026-10-05T04:19:55.437Z | GET | `/api/accounts/2` | 200 |
| 2026-10-05T04:19:55.704Z | POST | `/api/login` | 200 |
| 2026-10-05T04:19:55.709Z | GET | `/api/transactions/search` | 200 |
| 2026-10-05T04:20:20.840Z | GET | `/api/health` | 200 |
| 2026-10-05T04:20:20.843Z | GET | `/api/health` | 200 |
| 2026-10-05T04:20:20.865Z | GET | `/api/accounts/2` | 200 |
| 2026-10-05T04:20:20.883Z | POST | `/api/login` | 200 |
| 2026-10-05T04:20:20.886Z | GET | `/api/transactions/search` | 200 |
