const crypto = require('crypto');

const ADMINS = [
  { username: 'admin1', password: 'admin123', name: 'Main Admin', role: 'superadmin' },
  { username: 'admin2', password: 'admin456', name: 'Second Admin', role: 'admin' },
];

const sessions = new Map();

function login(username, password) {
  const admin = ADMINS.find(a => a.username === username && a.password === password);
  if (!admin) return null;
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { username: admin.username, name: admin.name, role: admin.role });
  return { token, name: admin.name, role: admin.role };
}

function logout(token) { sessions.delete(token); }
function verify(token) { return sessions.get(token) || null; }

function requireAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token = header.replace('Bearer ', '').trim();
  const session = verify(token);
  if (!session) return res.status(401).json({ ok: false, error: 'Access denied' });
  req.admin = session;
  next();
}

module.exports = { login, logout, verify, requireAuth };