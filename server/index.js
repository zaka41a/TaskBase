import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const app = express();

// Allow dev frontends on localhost
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json());

// SQLite database file
const db = new Database('taskbase.db');

// --- schema & seed ---
db.exec(`
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS todos(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
`);

// Seed a demo user on first run
const seedEmail = 'demo@taskbase.dev';
const existing = db.prepare('SELECT 1 FROM users WHERE email=?').get(seedEmail);
if (!existing) {
  const hash = bcrypt.hashSync('demo123', 10);
  const info = db.prepare('INSERT INTO users(email, password_hash) VALUES(?,?)').run(seedEmail, hash);
  db.prepare('INSERT INTO todos(user_id, title) VALUES(?,?)').run(info.lastInsertRowid, 'Welcome to TaskBase 🎉');
}

// Helpers
const sign = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
const auth = (req, res, next) => {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Health route (handy in dev)
app.get('/', (_req, res) => res.send('TaskBase API OK'));

// --- Auth ---
app.post('/api/auth/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email & password are required' });
  try {
    const hash = bcrypt.hashSync(password, 10);
    const info = db.prepare('INSERT INTO users(email, password_hash) VALUES(?,?)').run(email, hash);
    return res.json({ token: sign({ id: info.lastInsertRowid, email }) });
  } catch (e) {
    return String(e).includes('UNIQUE')
      ? res.status(409).json({ error: 'Email already in use' })
      : res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const u = db.prepare('SELECT * FROM users WHERE email=?').get(email);
  if (!u) return res.status(401).json({ error: 'Invalid credentials' });
  if (!bcrypt.compareSync(password, u.password_hash)) return res.status(401).json({ error: 'Invalid credentials' });
  return res.json({ token: sign({ id: u.id, email: u.email }) });
});

// --- Todos ---
app.get('/api/todos', auth, (req, res) => {
  const rows = db.prepare('SELECT * FROM todos WHERE user_id=? ORDER BY id DESC').all(req.user.id);
  res.json(rows);
});

app.post('/api/todos', auth, (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  const info = db.prepare('INSERT INTO todos(user_id, title) VALUES(?,?)').run(req.user.id, title);
  const row = db.prepare('SELECT * FROM todos WHERE id=?').get(info.lastInsertRowid);
  res.status(201).json(row);
});

app.put('/api/todos/:id', auth, (req, res) => {
  const { id } = req.params;
  const { title, done } = req.body;
  const todo = db.prepare('SELECT * FROM todos WHERE id=? AND user_id=?').get(id, req.user.id);
  if (!todo) return res.status(404).json({ error: 'Todo not found' });
  db.prepare('UPDATE todos SET title=?, done=? WHERE id=?')
    .run(title ?? todo.title, Number(!!done), id);
  const updated = db.prepare('SELECT * FROM todos WHERE id=?').get(id);
  res.json(updated);
});

app.delete('/api/todos/:id', auth, (req, res) => {
  db.prepare('DELETE FROM todos WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.status(204).end();
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API ready on http://localhost:${port}`));
