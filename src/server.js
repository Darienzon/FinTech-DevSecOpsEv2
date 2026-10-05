/**
 * Lanzador FinTech: sirve la versión vulnerable o la segura en el mismo puerto
 * y permite alternar entre ambas en caliente (toggle) desde /__panel.
 *
 * El panel y el toggle solo aceptan conexiones locales (la máquina del servidor),
 * así la máquina auditora no puede cambiar el modo. ALLOW_REMOTE_TOGGLE=1 lo permite.
 */
const express = require('express');
const path = require('path');
const vulnerable = require('./vulnerable/app_vulnerable');
const segura = require('./seguro/app_segura');
const createAuditReportMiddleware = require('./audit-report');

const apps = { vulnerable, seguro: segura };
let mode = process.env.MODE === 'seguro' ? 'seguro' : 'vulnerable';

// Rutas actualizadas alineadas con la pauta (fase1 / fase2)
const auditReports = {
  vulnerable: createAuditReportMiddleware(
    path.join(__dirname, '..', 'auditoria', 'fase1', 'reporte_auditoria.md'),
    'vulnerable'
  ),
  seguro: createAuditReportMiddleware(
    path.join(__dirname, '..', 'auditoria', 'fase2', 'reporte_auditoria_fase_2.md'),
    'seguro'
  ),
};

const root = express();
root.use((req, res, next) => auditReports[mode](req, res, next));

const PANEL = `<!doctype html><html lang="es"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>FinTech — Modo</title>
<style>
body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#111;color:#eee}
.card{text-align:center;padding:2rem 3rem;border-radius:16px;background:#1c1c1c}
#estado{font-size:2rem;font-weight:700;margin:.5rem 0 1.5rem}
button{font-size:1.1rem;padding:.8rem 1.6rem;border:0;border-radius:10px;cursor:pointer;font-weight:600}
</style>
<div class="card"><div>Modo actual de FinTech API</div><div id="estado">…</div>
<button id="btn">Cambiar modo</button></div>
<script>
const estado=document.getElementById('estado'),btn=document.getElementById('btn');
function pinta(m){const v=m==='vulnerable';estado.textContent=v?'🔓 VULNERABLE':'🔒 SEGURO';
estado.style.color=v?'#ff5c5c':'#4cd964';btn.textContent=v?'Cambiar a SEGURO':'Cambiar a VULNERABLE';}
fetch('/__mode').then(r=>r.json()).then(d=>pinta(d.mode));
btn.onclick=()=>fetch('/__mode/toggle',{method:'POST'}).then(r=>r.json()).then(d=>pinta(d.mode));
</script></html>`;

const localOnly = (req, res, next) => {
  const ip = req.socket.remoteAddress;
  if (process.env.ALLOW_REMOTE_TOGGLE === '1' || ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(ip)) return next();
  res.status(404).json({ error: 'Recurso no encontrado' });
};

root.get('/__panel', localOnly, (req, res) => res.type('html').send(PANEL));
root.get('/__mode', localOnly, (req, res) => res.json({ mode }));
root.post('/__mode/:target', localOnly, (req, res) => {
  const t = req.params.target;
  mode = t === 'toggle' ? (mode === 'vulnerable' ? 'seguro' : 'vulnerable') : (apps[t] ? t : mode);
  console.log(`>>> MODO CAMBIADO A: ${mode.toUpperCase()}`);
  res.json({ mode });
});

root.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Todo lo demás lo atiende la app del modo activo
root.use((req, res, next) => apps[mode](req, res, next));

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
root.listen(PORT, HOST, () => {
  console.log(`FinTech API en http://${HOST}:${PORT} — modo inicial: ${mode.toUpperCase()}`);
  console.log(`Panel de cambio de modo (solo local): http://localhost:${PORT}/__panel`);
});