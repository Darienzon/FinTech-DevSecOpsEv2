# Marco Normativo Organizacional (ONF — Organization Normative Framework)
**Basado en la Norma ISO/IEC 27034-1**

## 1. Alcance
Este marco define los componentes, procesos y políticas globales que la organización exige para garantizar que todas las aplicaciones financieras (FinTech) desarrolladas internamente mantengan un nivel de seguridad aceptable a lo largo de su ciclo de vida (SDLC).

## 2. Elementos del ONF
1. **Política de Codificación Segura:**
   - Prohibición estricta de concatenación directa de entradas en consultas SQL.
   - Obligatoriedad de validación de entradas mediante Zero Trust Input (listas blancas y expresiones regulares).
2. **Ciclo de Vida de Desarrollo Seguro (S-SDLC):**
   - Integración de pruebas estáticas (SAST) y dinámicas (DAST) automatizadas.
   - Fase obligatoria de auditoría y pentesting antes de cada paso a producción.
3. **Gestión de Identidades y Sesiones:**
   - Longitud mínima de tokens de sesión: 256 bits aleatorios (criptográficamente fuertes).
   - Uso exclusivo de cookies con atributos `HttpOnly`, `SameSite=Strict` y `Secure`.
4. **Manejo Excepcional y Logs:**
   - Desactivación de stack traces y variables de entorno en mensajes de error hacia el cliente.
   - Registro de auditoría centralizado para intentos fallidos de autenticación y transacciones anómalas.