const fs = require('fs');
const path = require('path');

function createAuditReportMiddleware(file, mode) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (!fs.existsSync(file) || fs.statSync(file).size === 0) {
    fs.writeFileSync(
      file,
      `# Registro de pruebas y acciones — modo ${mode}\n\n| Fecha y hora (UTC) | Método | Ruta | Resultado HTTP |\n|---|---|---|---:|\n`,
      'utf8'
    );
  }

  return (req, res, next) => {
    if (req.auditReportLogged) return next();
    req.auditReportLogged = true;

    let recorded = false;
    const record = (result) => {
      if (recorded) return;
      recorded = true;

      const cell = (value) => String(value).replace(/\|/g, '\\|').replace(/[\r\n]/g, ' ');
      const route = (req.originalUrl || req.url || '/').split('?')[0];
      const line = `| ${new Date().toISOString()} | ${cell(req.method)} | \`${cell(route)}\` | ${cell(result)} |\n`;

      try {
        fs.appendFileSync(file, line, 'utf8');
      } catch (error) {
        console.error(`[AUDITORIA ${mode}] No se pudo escribir en ${file}:`, error);
      }
    };

    res.once('finish', () => record(res.statusCode));
    res.once('close', () => record('conexión cerrada'));
    next();
  };
}

module.exports = createAuditReportMiddleware;
