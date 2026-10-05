# Registro de pruebas y acciones — modo seguro

Las peticiones HTTP recibidas por la aplicación en modo seguro se agregan automáticamente al final de este informe. Se registra la fecha UTC, el método, la ruta sin parámetros de consulta y el resultado HTTP; no se guardan cuerpos ni credenciales.

| Fecha y hora (UTC) | Método | Ruta | Resultado HTTP |
|---|---|---|---:|
| 2026-10-05T04:14:03.803Z | GET | `/api/health` | 200 |
| 2026-10-05T04:14:31.513Z | GET | `/api/health` | 200 |
| 2026-10-05T04:19:56.295Z | GET | `/api/health` | 200 |
| 2026-10-05T04:19:56.297Z | GET | `/api/health` | 200 |
| 2026-10-05T04:19:56.300Z | GET | `/api/accounts/2` | 401 |
| 2026-10-05T04:19:56.347Z | POST | `/api/login` | 200 |
| 2026-10-05T04:19:56.351Z | GET | `/api/transactions/search` | 400 |
| 2026-10-05T04:19:56.354Z | GET | `/api/transactions/fecha` | 400 |
| 2026-10-05T04:20:21.417Z | GET | `/api/health` | 200 |
| 2026-10-05T04:20:21.420Z | GET | `/api/health` | 200 |
| 2026-10-05T04:20:21.438Z | GET | `/api/accounts/2` | 401 |
| 2026-10-05T04:20:21.486Z | POST | `/api/login` | 200 |
| 2026-10-05T04:20:21.490Z | GET | `/api/transactions/search` | 400 |
| 2026-10-05T16:49:06.790Z | GET | `/api/health` | 200 |
| 2026-10-05T16:49:06.796Z | GET | `/api/accounts/1` | 401 |
| 2026-10-05T16:49:07.456Z | POST | `/__mode/toggle` | 200 |
| 2026-10-05T16:49:07.865Z | GET | `/api/health` | 200 |
| 2026-10-05T16:49:07.883Z | GET | `/api/accounts/1` | 401 |
| 2026-10-05T16:49:39.486Z | POST | `/__mode/toggle` | 200 |
| 2026-10-05T16:49:40.206Z | GET | `/api/health` | 200 |
| 2026-10-05T16:49:40.224Z | GET | `/api/accounts/1` | 401 |
| 2026-10-05T16:49:42.522Z | POST | `/__mode/toggle` | 200 |
| 2026-10-05T16:49:44.877Z | GET | `/api/health` | 200 |
| 2026-10-05T16:49:44.883Z | GET | `/api/accounts/1` | 401 |
| 2026-10-05T16:49:53.586Z | POST | `/api/loans` | 401 |
| 2026-10-05T16:49:57.118Z | POST | `/api/login` | 200 |
| 2026-10-05T16:49:57.122Z | GET | `/api/accounts/1` | 200 |
| 2026-10-05T16:50:00.031Z | POST | `/api/loans` | 400 |
| 2026-10-05T16:50:18.147Z | POST | `/api/loans` | 200 |
| 2026-10-05T16:50:21.131Z | GET | `/api/accounts/1` | 200 |
| 2026-10-05T16:50:21.147Z | GET | `/api/transactions/search` | 200 |
