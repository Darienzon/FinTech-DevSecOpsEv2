# Perfil de Controles Específicos de Aplicación (ASC — Application Security Control)
**Aplicación: FinTech API | Norma ISO/IEC 27034**

| ID ASC | Categoría ISO 27034 | Riesgo OWASP Mitigado | Descripción del Control Implementado | Estado |
|---|---|---|---|---|
| **ASC-01** | Control de Acceso Aritmético | A01:2021 — Broken Access Control | Verificación de propiedad basada en la sesión del usuario (`ownAccount`). Se descarta la confianza en parámetros URL (`user_id`). | Implementado |
| **ASC-02** | Criptografía Aplicada | A02:2021 — Cryptographic Failures | Almacenamiento de contraseñas usando `scrypt` con sal aleatoria de 16 bytes. Comparación en tiempo constante (`timingSafeEqual`). | Implementado |
| **ASC-03** | Sanitización de Consultas | A03:2021 — Injection (SQLi) | Sustitución de cadenas concatenadas por consultas preparadas parametrizadas en SQLite (`better-sqlite3`). | Implementado |
| **ASC-04** | Validación de Lógica de Negocio | A04:2021 — Insecure Design | Módulo de límites de transferencia (máx $10.000), verificación estricta de saldo e impedimento de transferencias negativas o a uno mismo. | Implementado |
| **ASC-05** | Gestión de Excepciones | A05:2021 — Security Misconfiguration | Manejador global de errores que responde con HTTP 400/500 genéricos y correlaciona fallos con UUID internos, ocultando credenciales. | Implementado |
| **ASC-06** | Gestión de Dependencias | A06:2021 — Vulnerable Components | Actualización de la librería `moment` a versión segura (>= 2.29.4) y restricción estricta de formatos locales permitidos. | Implementado |
| **ASC-07** | Autenticación Robusta | A07:2021 — Identification Failures | Reemplazo de tokens de 4 dígitos por identificadores de sesión criptográficos almacenados en base de datos con expiración y Rate Limiting. | Implementado |
| **ASC-08** | Ingesta Segura de Archivos | A08:2021 — Software and Data Integrity | Validación de subida de comprobantes mediante inspección de Magic Bytes, restricción de extensiones (`png`, `jpg`, `pdf`) y UUIDs aleatorios. | Implementado |
| **ASC-09** | Trazabilidad y Eventos | A09:2021 — Security Logging Failures | Módulo de logging centralizado (`security.log`) que registra eventos de autenticación, fallos de validación y transferencias anómalas. | Implementado |
| **ASC-10** | Protección de Peticiones Servidor | A10:2021 — SSRF | Validación de URLs para imágenes de perfil limitando el esquema a HTTPS, lista blanca de dominios y resolución DNS para bloquear IPs privadas. | Implementado |