const { db } = require('./database');

const Tournament = {
  create(year, name, theme, prizePool) {
    const info = db.prepare("INSERT INTO tournaments (year, name, theme, prize_pool, status) VALUES (?, ?, ?, ?, 'open')").run(year, name, theme, prizePool);
    return db.prepare('SELECT * FROM tournaments WHERE id=?').get(info.lastInsertRowid);
  },
  findByYear(year) { return db.prepare('SELECT * FROM tournaments WHERE year=?').get(year); },
  findById(id) { return db.prepare('SELECT * FROM tournaments WHERE id=?').get(id); },
  findActive() { return db.prepare("SELECT * FROM tournaments WHERE status IN ('open', 'running') ORDER BY year DESC LIMIT 1").get(); },
  listAll() { return db.prepare('SELECT * FROM tournaments ORDER BY year DESC').all(); },
  updateStatus(year, status) {
    db.prepare('UPDATE tournaments SET status=? WHERE year=?').run(status, year);
    return this.findByYear(year);
  },
};

const Reward = {
  create(tid, rank, cash, digital, exclusive) {
    const info = db.prepare('INSERT INTO rewards (tournament_id, rank, cash_prize, digital_reward, exclusive_item) VALUES (?, ?, ?, ?, ?)').run(tid, rank, cash, digital, exclusive);
    return db.prepare('SELECT * FROM rewards WHERE id=?').get(info.lastInsertRowid);
  },
  listByTournament(tid) { return db.prepare('SELECT * FROM rewards WHERE tournament_id=? ORDER BY rank ASC').all(tid); },
};

const Winner = {
  create(tid, name, discord, rank) {
    const info = db.prepare('INSERT INTO winners (tournament_id, player_name, discord_id, rank) VALUES (?, ?, ?, ?)').run(tid, name, discord, rank);
    return db.prepare('SELECT * FROM winners WHERE id=?').get(info.lastInsertRowid);
  },
  listByTournament(tid) { return db.prepare('SELECT * FROM winners WHERE tournament_id=? ORDER BY rank ASC').all(tid); },
  markClaimed(id) {
    db.prepare('UPDATE winners SET claimed=1, claimed_at=CURRENT_TIMESTAMP WHERE id=?').run(id);
    return db.prepare('SELECT * FROM winners WHERE id=?').get(id);
  },
};

const Badge = {
  create(name, badgeName, year, icon) {
    const info = db.prepare('INSERT INTO badges (player_name, badge_name, year, icon_url) VALUES (?, ?, ?, ?)').run(name, badgeName, year, icon);
    return db.prepare('SELECT * FROM badges WHERE id=?').get(info.lastInsertRowid);
  },
  listByPlayer(name) { return db.prepare('SELECT * FROM badges WHERE player_name=? ORDER BY year DESC').all(name); },
};

module.exports = { Tournament, Reward, Winner, Badge };
