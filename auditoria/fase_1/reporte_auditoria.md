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
| 2026-10-05T16:49:04.435Z | GET | `/` | 200 |
| 2026-10-05T16:49:04.476Z | GET | `/api/health` | 200 |
| 2026-10-05T16:49:04.942Z | GET | `/api/accounts/1` | 200 |
| 2026-10-05T16:49:04.945Z | GET | `/favicon.ico` | 404 |
| 2026-10-05T16:49:06.783Z | POST | `/__mode/toggle` | 200 |
| 2026-10-05T16:49:07.461Z | GET | `/api/health` | 200 |
| 2026-10-05T16:49:07.467Z | GET | `/api/accounts/1` | 304 |
| 2026-10-05T16:49:07.852Z | POST | `/__mode/toggle` | 200 |
| 2026-10-05T16:49:39.491Z | GET | `/api/health` | 200 |
| 2026-10-05T16:49:39.496Z | GET | `/api/accounts/1` | 304 |
| 2026-10-05T16:49:40.193Z | POST | `/__mode/toggle` | 200 |
| 2026-10-05T16:49:42.534Z | GET | `/api/health` | 200 |
| 2026-10-05T16:49:42.546Z | GET | `/api/accounts/1` | 304 |
| 2026-10-05T16:49:44.872Z | POST | `/__mode/toggle` | 200 |
