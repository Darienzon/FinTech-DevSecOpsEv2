# Registro de pruebas y acciones — modo vulnerable

| Fecha y hora (UTC) | Método | Ruta | Resultado HTTP |
|---|---|---|---:|
| 2026-10-05T17:17:43.356Z | GET | `/__panel` | 200 |
| 2026-10-05T17:17:43.396Z | GET | `/__mode` | 200 |
| 2026-10-05T17:17:47.350Z | GET | `/` | 304 |
| 2026-10-05T17:17:47.416Z | GET | `/api/health` | 200 |
| 2026-10-05T17:17:47.783Z | GET | `/api/accounts/1` | 200 |
| 2026-10-05T17:17:53.446Z | POST | `/api/loans` | 401 |
| 2026-10-05T17:18:05.875Z | POST | `/api/login` | 401 |
| 2026-10-05T17:18:09.748Z | POST | `/api/login` | 401 |
| 2026-10-05T17:18:10.920Z | POST | `/api/login` | 401 |
| 2026-10-05T17:18:12.095Z | GET | `/api/admin/logs` | 404 |
| 2026-10-05T17:18:13.180Z | POST | `/api/login` | 401 |
| 2026-10-05T17:18:13.920Z | GET | `/api/admin/logs` | 404 |
| 2026-10-05T17:18:16.498Z | GET | `/api/admin/logs` | 404 |
| 2026-10-05T17:18:17.125Z | POST | `/api/login` | 401 |
| 2026-10-05T17:18:20.230Z | GET | `/` | 304 |
| 2026-10-05T17:18:20.273Z | GET | `/api/health` | 304 |
| 2026-10-05T17:18:20.277Z | GET | `/api/accounts/1` | 304 |
| 2026-10-05T17:18:23.784Z | GET | `/api/admin/logs` | 404 |
| 2026-10-05T17:18:27.445Z | POST | `/api/login` | 200 |
| 2026-10-05T17:18:27.458Z | GET | `/api/accounts/1` | 200 |
| 2026-10-05T17:18:28.725Z | GET | `/api/admin/logs` | 404 |
| 2026-10-05T17:18:29.695Z | POST | `/api/login` | 200 |
| 2026-10-05T17:18:29.707Z | GET | `/api/accounts/1` | 200 |
