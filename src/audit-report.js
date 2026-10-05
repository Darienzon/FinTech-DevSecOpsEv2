const fs = require('fs');
const path = require('path');

function createAuditReportMiddleware(file, mode) {
  // Asegurar directorio y cabecera inicial de forma síncrona UNA SOLA VEZ al iniciar el middleware
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    if (!fs.existsSync(file) || fs.statSync(file).size === 0) {
      const header = `# Registro de pruebas y acciones — modo ${mode}\n\n| Fecha y hora (UTC) | Método | Ruta | Resultado HTTP |\n|---|---|---|---:|\n`;
      fs.writeFileSync(file, header, 'utf8');
    }
  } catch (err) {
    console.error(`[AUDITORIA ${mode}] Error al inicializar el archivo de log:`, err);
  }

  return (req, res, next) => {
    if (req.auditReportLogged) return next();
    req.auditReportLogged = true;

    let recorded = false;
    const record = (result) => {
      if (recorded) return;
      recorded = true;

      // Sanitizar celdas para evitar romper la tabla Markdown
      const cell = (value) =>
        String(value ?? '')
          .replace(/\|/g, '\\|')
          .replace(/[\r\n]/g, ' ')
          .replace(/`/g, "'");

      const route = (req.originalUrl || req.url || '/').split('?')[0];
      const timestamp = new Date().toISOString();
      const line = `| ${timestamp} | ${cell(req.method)} | \`${cell(route)}\` | ${cell(result)} |\n`;

      // Escritura asíncrona para evitar bloquear el event loop de Node.js
      fs.appendFile(file, line, 'utf8', (err) => {
        if (err) {
          console.error(`[AUDITORIA ${mode}] No se pudo escribir en ${file}:`, err);
        }
      });
    };

    // Eventos para capturar la finalización de la respuesta
    res.once('finish', () => record(res.statusCode));
    res.once('close', () => record('Conexión cerrada prematuramente'));

    next();
  };
}

module.exports = createAuditReportMiddleware;