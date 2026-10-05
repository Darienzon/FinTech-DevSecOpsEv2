# Manifiesto Ético de Responsabilidad en el Desarrollo de Software

## 1. Declaración de Principios
Como equipo de Ingeniería de Software y DevSecOps, reconocemos que el código fuente que escribimos tiene un impacto directo en la privacidad, integridad y seguridad financiera de los usuarios. La negligencia en la implementación de controles de seguridad no es un mero error técnico, sino una falta ética profesional.

## 2. Responsabilidad ante la Pérdida o Exposición de Datos
* **Principio de Deber de Cuidado:** Todo desarrollador debe aplicar el principio de "Seguridad por Diseño" (Security by Design) e "Incapacidad por Defecto" (Zero Trust).
* **Transparencia y Divulgación Responsable:** Ante el hallazgo de una vulnerabilidad o brecha de seguridad, el equipo tiene la obligación de reportar internamente el fallo sin ocultarlo y proceder con el parche de mitigación inmediato.
* **Privacidad de los Datos:** La recolección de credenciales o datos financieros sin mecanismos criptográficos de protección (como hashing con sal) constituye una violación grave a la confianza del usuario final.

## 3. Compromiso DevSecOps
 Nos comprometemos a no desplegar código en entornos de producción que contenga fallos conocidos de la lista OWASP Top 10.
 Nos comprometemos a auditar de manera continua las dependencias de terceros para evitar el uso de librerías obsoletas o vulnerables.
 Nos comprometemos a respaldar la gobernanza técnica mediante estándares reconocidos internacionalmente como la ISO/IEC 27034.