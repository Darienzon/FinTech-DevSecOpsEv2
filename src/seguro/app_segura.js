/**
 * FinTech API — VERSIÓN SEGURA (Fase 2)
 * Zero Trust Input: toda entrada se valida en el servidor con listas blancas y regex.
 */
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Database = require('better-sqlite3');
const multer = require('multer');
const moment = require('moment');            // [A06] >= 2.29.4
require('moment/locale/es');
const crypto = require('crypto');
const dns = require('dns').promises;
const net = require('net');
const fs = require('fs');
const path = require('path');
const createAuditReportMiddleware = require('../audit-report');

const ROOT = path.join(__dirname, '..', '..');
const UPLOADS = path.join(ROOT, 'uploads', 'seguro');
const LOG_FILE = path.join(ROOT, 'logs', 'security.log');
const AUDIT_REPORT = path.join(ROOT, 'auditoria', 'fase_2_seguro', 'reporte_auditoria_fase_2.md');
fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
fs.mkdirSync(path.join(ROOT, 'logs'), { recursive: true });
fs.mkdirSync(UPLOADS, { recursive: true });

// ---------- [A09] Registro de eventos de seguridad ----------
function audit(event, req, detail = {}) {
  const line = JSON.stringify({
    ts: new Date().toISOString(), event, ip: req && req.ip,
    user: (req && req.user && req.user.id) || null,
    path: req && req.originalUrl ? req.originalUrl.split('?')[0] : null, ...detail,
  }) + '\n';
  fs.appendFile(LOG_FILE, line, () => {});
}

// ---------- [A02] Hash de contraseñas con scrypt + sal ----------
const hashPassword = (pw) => {
  const salt = crypto.randomBytes(16);
  return salt.toString('hex') + ':' + crypto.scryptSync(pw, salt, 64).toString('hex');
};
const verifyPassword = (pw, stored) => {
  const [s, h] = stored.split(':');
  const c = crypto.scryptSync(pw, Buffer.from(s, 'hex'), 64);
  return crypto.timingSafeEqual(c, Buffer.from(h, 'hex'));
};
const DUMMY_HASH = hashPassword('dummy-password'); // evita enumeración de usuarios por tiempo
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');

const db = new Database(path.join(ROOT, 'data', 'seguro.db'));
db.exec(`
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password_hash TEXT,
  role TEXT, balance REAL, email TEXT, avatar_url TEXT);
CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, user_id INTEGER, expires INTEGER);
CREATE TABLE IF NOT EXISTS tx(
  id INTEGER PRIMARY KEY AUTOINCREMENT, from_id INTEGER, to_id INTEGER,
  amount REAL, date TEXT, note TEXT, ts INTEGER);
CREATE TABLE IF NOT EXISTS loans(id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, amount REAL, ts INTEGER);
CREATE TABLE IF NOT EXISTS receipts(name TEXT PRIMARY KEY, user_id INTEGER, ts INTEGER);
`);
if (!db.prepare('SELECT COUNT(*) c FROM users').get().c) {
  const u = db.prepare('INSERT INTO users(username,password_hash,role,balance,email) VALUES(?,?,?,?,?)');
  u.run('alice', hashPassword('alice123'), 'user', 1000, 'alice@fintech.test');
  u.run('bob', hashPassword('bob123'), 'user', 500, 'bob@fintech.test');
  u.run('admin', hashPassword('admin123'), 'admin', 0, 'admin@fintech.test');
  const t = db.prepare('INSERT INTO tx(from_id,to_id,amount,date,note,ts) VALUES(?,?,?,?,?,?)');
  t.run(1, 2, 50, '2026-09-01', 'Pago almuerzo', 0);
  t.run(2, 1, 20, '2026-09-02', 'Devolución', 0);
  t.run(2, 3, 5, '2026-09-03', 'Comisión', 0);
}

// ---------- Listas blancas y regex ----------
const RE = {
  username: /^[a-zA-Z0-9_]{3,20}$/,
  id: /^[1-9]\d{0,8}$/,
  amount: /^\d{1,6}(\.\d{1,2})?$/,
  email: /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,190}\.[A-Za-z]{2,24}$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  file: /^[0-9a-f-]{36}\.(png|jpg|pdf)$/,
};
const LOCALES = new Set(['es', 'en']);
const AVATAR_HOSTS = new Set((process.env.AVATAR_ALLOWED_HOSTS || 'i.pravatar.cc,ui-avatars.com,www.gravatar.com').split(','));
const MAGIC = { png: [0x89, 0x50, 0x4e, 0x47], jpg: [0xff, 0xd8, 0xff], pdf: [0x25, 0x50, 0x44, 0x46] };
const MIME = { png: 'image/png', jpg: 'image/jpeg', pdf: 'application/pdf' };
const LIMITS = { transferMax: 10000, anomaly: 5000, loanMin: 100, loanMax: 5000 };

const bad = (req, res, msg, code = 400) => {
  audit('VALIDATION_FAIL', req, { msg });
  return res.status(code).json({ error: msg });
};
const body = (req) => (req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {});
const parseAmount = (v) => {
  const s = typeof v === 'number' ? String(v) : v;
  if (typeof s !== 'string' || !RE.amount.test(s)) return null;
  const n = Number(s);
  return n > 0 ? n : null;
};

const app = express();
app.use(createAuditReportMiddleware(AUDIT_REPORT, 'seguro'));
app.use(helmet());
app.use(express.json({ limit: '10kb', strict: true }));

// ---------- [A01][A07] Autenticación por sesión aleatoria de 256 bits ----------
function auth(req, res, next) {
  const m = /(?:^|;\s*)session=([0-9a-f]{64})(?:;|$)/.exec(req.headers.cookie || '');
  if (!m) { audit('AUTH_MISSING', req); return res.status(401).json({ error: 'No autenticado' }); }
  const s = db.prepare(
    'SELECT u.id, u.username, u.role, s.expires FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?'
  ).get(sha(m[1]));
  if (!s || s.expires < Date.now()) { audit('AUTH_INVALID', req); return res.status(401).json({ error: 'Sesión inválida' }); }
  req.user = s;
  next();
}

app.get('/api/health', (req, res) => res.json({ status: 'ok', mode: 'seguro' }));

const loginLimiter = rateLimit({
  windowMs: 60_000, limit: 8, standardHeaders: true, legacyHeaders: false,
  handler: (req, res) => { audit('RATE_LIMIT', req); res.status(429).json({ error: 'Demasiados intentos' }); },
});
app.post('/api/login', loginLimiter, (req, res) => {
  const { username, password } = body(req);
  if (typeof username !== 'string' || typeof password !== 'string' ||
      !RE.username.test(username) || password.length < 1 || password.length > 64) {
    return bad(req, res, 'Credenciales con formato inválido');
  }
  const u = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  const ok = verifyPassword(password, u ? u.password_hash : DUMMY_HASH) && u;
  if (!ok) { audit('LOGIN_FAIL', req, { username }); return res.status(401).json({ error: 'Credenciales inválidas' }); }
  db.prepare('DELETE FROM sessions WHERE expires < ?').run(Date.now());
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(sha(token), u.id, Date.now() + 30 * 60_000);
  res.cookie('session', token, {
    httpOnly: true, sameSite: 'strict', secure: process.env.COOKIE_SECURE === '1', maxAge: 30 * 60_000, path: '/',
  });
  audit('LOGIN_OK', req, { user_id: u.id });
  res.json({ message: 'ok', user_id: u.id });
});

// ---------- [A01] Control de acceso: la sesión decide, no el parámetro de la URL ----------
function ownAccount(req, res) {
  if (!RE.id.test(req.params.user_id)) { bad(req, res, 'user_id inválido'); return null; }
  const id = Number(req.params.user_id);
  if (id !== req.user.id && req.user.role !== 'admin') {
    audit('ACCESS_DENIED', req, { target: id });
    res.status(403).json({ error: 'Acceso denegado' });
    return null;
  }
  return id;
}
app.get('/api/accounts/:user_id', auth, (req, res) => {
  const id = ownAccount(req, res); if (id === null) return;
  const u = db.prepare('SELECT id, username, role, balance, email, avatar_url FROM users WHERE id = ?').get(id);
  u ? res.json(u) : res.status(404).json({ error: 'No existe' });
});
app.put('/api/accounts/:user_id', auth, (req, res) => {
  const id = ownAccount(req, res); if (id === null) return;
  const { email } = body(req);
  if (typeof email !== 'string' || !RE.email.test(email)) return bad(req, res, 'email inválido');
  db.prepare('UPDATE users SET email = ? WHERE id = ?').run(email, id);
  res.json({ message: 'Cuenta actualizada' });
});

// ---------- [A03] Consulta parametrizada + validación de id ----------
app.get('/api/transactions/search', auth, (req, res) => {
  const id = req.query.id;
  if (typeof id !== 'string' || !RE.id.test(id)) return bad(req, res, 'id inválido');
  const rows = db.prepare('SELECT * FROM tx WHERE id = ?').all(Number(id))
    .filter((r) => req.user.role === 'admin' || r.from_id === req.user.id || r.to_id === req.user.id);
  res.json(rows);
});

// ---------- [A04] Reglas de negocio: montos, saldo, límites y velocidad ----------
app.post('/api/transfer', auth, (req, res) => {
  const b = body(req);
  const amount = parseAmount(b.amount);
  const toRaw = String(b.to_user_id);
  if (amount === null) return bad(req, res, 'amount debe ser positivo con máx. 2 decimales');
  if (!RE.id.test(toRaw)) return bad(req, res, 'to_user_id inválido');
  const to = Number(toRaw);
  if (amount > LIMITS.transferMax) {
    audit('TRANSFER_ANOMALY', req, { reason: 'over_limit', amount });
    return bad(req, res, 'Monto sobre el límite permitido');
  }
  if (to === req.user.id) return bad(req, res, 'No se permite transferir a la misma cuenta');
  if (!db.prepare('SELECT 1 FROM users WHERE id = ?').get(to)) return res.status(404).json({ error: 'Destino no existe' });
  if (db.prepare('SELECT COUNT(*) c FROM tx WHERE from_id = ? AND ts > ?').get(req.user.id, Date.now() - 60_000).c >= 5) {
    audit('TRANSFER_ANOMALY', req, { reason: 'velocity' });
    return res.status(429).json({ error: 'Demasiadas transferencias' });
  }
  const note = typeof b.note === 'string' ? b.note.slice(0, 100).replace(/[^\w\s.,áéíóúñÁÉÍÓÚÑ-]/g, '') : '';
  const run = db.transaction(() => {
    const bal = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id).balance;
    if (bal < amount) return false;
    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(amount, req.user.id);
    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(amount, to);
    db.prepare('INSERT INTO tx(from_id,to_id,amount,date,note,ts) VALUES(?,?,?,?,?,?)')
      .run(req.user.id, to, amount, new Date().toISOString().slice(0, 10), note, Date.now());
    return true;
  });
  if (!run()) return bad(req, res, 'Saldo insuficiente');
  if (amount >= LIMITS.anomaly) audit('TRANSFER_ANOMALY', req, { reason: 'high_amount', amount });
  res.json({ message: 'Transferencia realizada' });
});
app.post('/api/loans', auth, (req, res) => {
  const amount = parseAmount(body(req).amount);
  if (amount === null || amount < LIMITS.loanMin || amount > LIMITS.loanMax) {
    return bad(req, res, `amount debe estar entre ${LIMITS.loanMin} y ${LIMITS.loanMax}`);
  }
  const owed = db.prepare('SELECT COALESCE(SUM(amount),0) s FROM loans WHERE user_id = ?').get(req.user.id).s;
  if (owed + amount > LIMITS.loanMax) { audit('LOAN_LIMIT', req, { amount }); return bad(req, res, 'Excede el cupo de crédito'); }
  db.transaction(() => {
    db.prepare('INSERT INTO loans(user_id,amount,ts) VALUES(?,?,?)').run(req.user.id, amount, Date.now());
    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(amount, req.user.id);
  })();
  res.json({ message: 'Crédito aprobado', amount });
});

// ---------- [A06] moment actualizado + fecha estricta + lista blanca de locales ----------
app.get('/api/transactions/fecha', (req, res) => {
  const { date, locale = 'en' } = req.query;
  if (typeof date !== 'string' || !RE.date.test(date)) return bad(req, res, 'date debe ser YYYY-MM-DD');
  if (typeof locale !== 'string' || !LOCALES.has(locale)) return bad(req, res, 'locale no permitido');
  const m = moment(date, 'YYYY-MM-DD', true).locale(locale);
  if (!m.isValid()) return bad(req, res, 'Fecha inexistente');
  res.json({ formatted: m.format('LL'), moment_version: moment.version });
});

// ---------- [A08] Comprobantes: lista blanca, magic bytes, nombre aleatorio, descarga forzada ----------
const upload = multer({
  storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).slice(1).toLowerCase().replace('jpeg', 'jpg');
    if (!MIME[ext] || file.mimetype !== MIME[ext]) { const e = new Error('tipo no permitido'); e.status = 400; return cb(e); }
    cb(null, true);
  },
});
app.post('/api/receipts', auth, upload.single('file'), (req, res) => {
  if (!req.file) return bad(req, res, 'Falta archivo (campo "file")');
  const ext = path.extname(req.file.originalname).slice(1).toLowerCase().replace('jpeg', 'jpg');
  const magic = MAGIC[ext];
  if (!magic.every((b, i) => req.file.buffer[i] === b)) { audit('UPLOAD_REJECTED', req, { ext }); return bad(req, res, 'Contenido no coincide con el tipo'); }
  const name = crypto.randomUUID() + '.' + ext;
  fs.writeFileSync(path.join(UPLOADS, name), req.file.buffer, { mode: 0o640 });
  db.prepare('INSERT INTO receipts VALUES(?,?,?)').run(name, req.user.id, Date.now());
  res.status(201).json({ message: 'Comprobante subido', id: name });
});
app.get('/api/receipts/:name', auth, (req, res) => {
  if (!RE.file.test(req.params.name)) return bad(req, res, 'Nombre inválido');
  const r = db.prepare('SELECT * FROM receipts WHERE name = ?').get(req.params.name);
  if (!r || (r.user_id !== req.user.id && req.user.role !== 'admin')) return res.status(404).json({ error: 'No existe' });
  res.set({ 'Content-Type': MIME[req.params.name.split('.')[1]], 'Content-Disposition': 'attachment', 'X-Content-Type-Options': 'nosniff' });
  res.sendFile(path.join(UPLOADS, r.name));
});

// ---------- [A10] SSRF: https + lista blanca de hosts + bloqueo de IPs internas ----------
function isPrivate(ip) {
  if (ip.startsWith('::ffff:')) ip = ip.slice(7);
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
           (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const l = ip.toLowerCase();
  return l === '::1' || l === '::' || /^(fc|fd|fe[89ab])/.test(l);
}
app.put('/api/profile', auth, async (req, res, next) => {
  try {
    const raw = req.query.avatar_url;
    if (typeof raw !== 'string' || raw.length > 200) return bad(req, res, 'avatar_url inválida');
    let u;
    try { u = new URL(raw); } catch { return bad(req, res, 'avatar_url inválida'); }
    if (u.protocol !== 'https:' || u.username || u.password || (u.port && u.port !== '443') || !AVATAR_HOSTS.has(u.hostname)) {
      audit('SSRF_BLOCKED', req, { host: u.hostname });
      return bad(req, res, 'URL no permitida');
    }
    const addrs = await dns.lookup(u.hostname, { all: true }).catch(() => []);
    if (!addrs.length || addrs.some((a) => isPrivate(a.address))) {
      audit('SSRF_BLOCKED', req, { host: u.hostname, reason: 'ip_interna' });
      return bad(req, res, 'URL no permitida');
    }
    const r = await fetch(u.href, { redirect: 'manual', signal: AbortSignal.timeout(3000) });
    const type = r.headers.get('content-type') || '';
    if (r.status !== 200 || !type.startsWith('image/')) return bad(req, res, 'El recurso no es una imagen válida');
    db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(u.href, req.user.id);
    res.json({ avatar_url: u.href });
  } catch (e) { next(e); }
});

// ---------- [A09] Consulta de logs (solo admin) ----------
app.get('/api/admin/logs', auth, (req, res) => {
  if (req.user.role !== 'admin') { audit('ACCESS_DENIED', req); return res.status(403).json({ error: 'Acceso denegado' }); }
  const lines = fs.existsSync(LOG_FILE) ? fs.readFileSync(LOG_FILE, 'utf8').trim().split('\n').slice(-50) : [];
  res.json(lines.map((l) => JSON.parse(l)));
});

// ---------- [A05] Errores genéricos: nada de stack ni credenciales hacia el cliente ----------
app.use((req, res) => res.status(404).json({ error: 'Recurso no encontrado' }));
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large' || err instanceof multer.MulterError || err.status === 400) {
    audit('BAD_REQUEST', req, { reason: err.code || err.type || 'invalid' });
    return res.status(err.type === 'entity.too.large' ? 413 : 400).json({ error: 'Solicitud inválida' });
  }
  const id = crypto.randomUUID();
  console.error(`[${id}]`, err.stack);
  audit('SERVER_ERROR', req, { error_id: id });
  res.status(500).json({ error: 'Error interno', error_id: id });
});

module.exports = app;
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`[SEGURA] FinTech en http://0.0.0.0:${PORT}`));
}
