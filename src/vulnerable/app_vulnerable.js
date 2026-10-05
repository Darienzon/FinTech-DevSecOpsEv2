/**
 * FinFlow API — VERSIÓN VULNERABLE (Fase 1)
 * ⚠ SOLO PARA LABORATORIO. Contiene fallos intencionales (OWASP Top 10).
 * No exponer a Internet ni reutilizar este código.
 */
const express = require('express');
const Database = require('better-sqlite3');
const multer = require('multer');
const moment = require('moment-old'); // [A06] moment 2.29.1 (< 2.29.2, vulnerable)
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const UPLOADS = path.join(ROOT, 'uploads', 'vulnerable');
fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
fs.mkdirSync(UPLOADS, { recursive: true });

// [A05] Credenciales de BD en claro y luego filtradas por el errorHandler
const DB_CONFIG = {
  file: path.join(ROOT, 'data', 'vulnerable.db'),
  user: 'fintech_admin',
  password: 'Fin#Tech2024!',
};

const db = new Database(DB_CONFIG.file);
db.exec(`
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE,
  password TEXT,            -- [A02] contraseña en texto plano
  token TEXT,               -- [A02] token de sesión en texto plano
  role TEXT, balance REAL, email TEXT, avatar_url TEXT);
CREATE TABLE IF NOT EXISTS tx(
  id INTEGER PRIMARY KEY AUTOINCREMENT, from_id INTEGER, to_id INTEGER,
  amount REAL, date TEXT, note TEXT);
`);
if (!db.prepare('SELECT COUNT(*) c FROM users').get().c) {
  const u = db.prepare('INSERT INTO users(username,password,token,role,balance,email) VALUES(?,?,?,?,?,?)');
  u.run('alice', 'alice123', '1234', 'user', 1000, 'alice@fintech.test'); // [A07] token "1234"
  u.run('bob', 'bob123', '5678', 'user', 500, 'bob@fintech.test');
  u.run('admin', 'admin123', '0001', 'admin', 0, 'admin@fintech.test');
  const t = db.prepare('INSERT INTO tx(from_id,to_id,amount,date,note) VALUES(?,?,?,?,?)');
  t.run(1, 2, 50, '2026-09-01', 'Pago almuerzo');
  t.run(2, 1, 20, '2026-09-02', 'Devolución');
  t.run(2, 3, 5, '2026-09-03', 'Comisión');
}

const app = express();
app.use(express.json());

// [A09] Sin ningún tipo de logging: ni accesos fallidos ni transferencias anómalas.

const getCookie = (req, name) => {
  const m = new RegExp('(?:^|;\\s*)' + name + '=([^;]*)').exec(req.headers.cookie || '');
  return m ? m[1] : null;
};

function auth(req, res, next) {
  const t = getCookie(req, 'session');
  const u = t && db.prepare('SELECT * FROM users WHERE token = ?').get(t);
  if (!u) return res.status(401).json({ error: 'No autenticado' });
  req.user = u;
  next();
}

app.get('/api/health', (req, res) => res.json({ status: 'ok', mode: 'vulnerable' }));

// [A07] Token de 4 dígitos, cookie sin HttpOnly/Secure/SameSite, sin límite de intentos
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const u = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
  if (!u) return res.status(401).json({ error: 'Credenciales inválidas' });
  const token = String(Math.floor(1000 + Math.random() * 9000));
  db.prepare('UPDATE users SET token = ? WHERE id = ?').run(token, u.id);
  res.cookie('session', token);
  res.json({ message: 'ok', user_id: u.id, token });
});

// [A01] IDOR: no valida sesión ni propiedad. [A02] devuelve password y token.
app.get('/api/accounts/:user_id', (req, res) => {
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.user_id);
  u ? res.json(u) : res.status(404).json({ error: 'No existe' });
});
app.put('/api/accounts/:user_id', (req, res) => {
  db.prepare('UPDATE users SET email = ? WHERE id = ?').run(req.body.email, req.params.user_id);
  res.json({ message: 'Cuenta actualizada' });
});

// [A03] Concatenación directa de SQL
app.get('/api/transactions/search', (req, res) => {
  const rows = db.prepare('SELECT * FROM tx WHERE id = ' + req.query.id).all();
  res.json(rows);
});

// [A04] Confía en que el cliente envía montos válidos: sin límites, saldo ni signo
app.post('/api/transfer', auth, (req, res) => {
  const { to_user_id, amount, note } = req.body;
  db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(amount, req.user.id);
  db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(amount, to_user_id);
  db.prepare('INSERT INTO tx(from_id,to_id,amount,date,note) VALUES(?,?,?,?,?)')
    .run(req.user.id, to_user_id, amount, new Date().toISOString().slice(0, 10), note || '');
  res.json({ message: 'Transferencia realizada' });
});
app.post('/api/loans', auth, (req, res) => {
  db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(req.body.amount, req.user.id);
  res.json({ message: 'Crédito aprobado', amount: req.body.amount });
});

// [A06] Librería obsoleta; se expone la versión para la evidencia
app.get('/api/transactions/fecha', (req, res) => {
  if (req.query.locale) moment.locale(req.query.locale);
  const m = moment(req.query.date);
  res.json({ formatted: m.format('LLLL'), moment_version: moment.version });
});

// [A08] Sube cualquier archivo (.html/.js) con su nombre original y lo sirve ejecutable
const upload = multer({ storage: multer.diskStorage({
  destination: UPLOADS,
  filename: (req, file, cb) => cb(null, file.originalname),
}) });
app.post('/api/receipts', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Falta archivo (campo "file")' });
  res.json({ message: 'Comprobante subido', url: '/uploads/' + req.file.originalname });
});
app.use('/uploads', express.static(UPLOADS));

// [A10] SSRF: realiza peticiones a cualquier URL (red interna, IMDS de AWS, localhost)
app.put('/api/profile', auth, async (req, res, next) => {
  try {
    const url = req.query.avatar_url;
    const r = await fetch(url);
    const body = await r.text();
    db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(url, req.user.id);
    res.json({ avatar_url: url, fetch_status: r.status, preview: body.slice(0, 500) });
  } catch (e) { next(e); }
});

// [A05] Modo desarrollo activo: stack trace completo + credenciales de BD
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message, stack: err.stack, db: DB_CONFIG });
};
app.use(errorHandler);

module.exports = app;
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`[VULNERABLE] FinTech en http://0.0.0.0:${PORT}`));
}
