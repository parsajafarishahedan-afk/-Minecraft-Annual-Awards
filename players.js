const crypto = require('crypto');
const { db } = require('./database');

const playerSessions = new Map();

const Player = {
  login(minecraftUsername) {
    const reg = db.prepare(`
      SELECT r.*, t.year, t.name as tournament_name, t.theme, t.status
      FROM registrations r
      JOIN tournaments t ON t.id = r.tournament_id
      WHERE r.minecraft_username = ?
      ORDER BY r.registered_at DESC LIMIT 1
    `).get(minecraftUsername);
    if (!reg) return null;

    const token = crypto.randomBytes(24).toString('hex');
    playerSessions.set(token, { playerId: reg.id, playerName: reg.player_name, minecraftUsername: reg.minecraft_username });
    return { token, player: reg };
  },
  getProfile(playerId) {
    const reg = db.prepare(`
      SELECT r.*, t.year, t.name as tournament_name, t.theme, t.status, t.prize_pool
      FROM registrations r
      JOIN tournaments t ON t.id = r.tournament_id
      WHERE r.id = ?
    `).get(playerId);
    if (!reg) return null;

    const winnings = db.prepare(`
      SELECT w.rank, w.claimed, w.claimed_at, rw.cash_prize, rw.digital_reward, rw.exclusive_item
      FROM winners w
      JOIN rewards rw ON rw.tournament_id = w.tournament_id AND rw.rank = w.rank
      WHERE w.player_name = ? AND w.tournament_id = ?
    `).get(reg.player_name, reg.tournament_id);

    const badges = db.prepare('SELECT * FROM badges WHERE player_name=? ORDER BY year DESC').all(reg.player_name);
    return { registration: reg, winnings: winnings || null, badges };
  },
  logout(token) { playerSessions.delete(token); },
  verify(token) { return playerSessions.get(token) || null; },
};

function requirePlayer(req, res, next) {
  const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  const session = playerSessions.get(token);
  if (!session) return res.status(401).json({ ok: false, error: 'Please login first' });
  req.player = session;
  next();
}

module.exports = { Player, requirePlayer };