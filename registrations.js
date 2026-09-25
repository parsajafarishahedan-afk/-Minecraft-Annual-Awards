const { db } = require('./database');

const Registration = {
  create(tid, data) {
    const info = db.prepare('INSERT INTO registrations (tournament_id, player_name, discord_id, email, minecraft_username) VALUES (?, ?, ?, ?, ?)')
      .run(tid, data.playerName, data.discordId || null, data.email || null, data.minecraftUsername || null);
    return db.prepare('SELECT * FROM registrations WHERE id=?').get(info.lastInsertRowid);
  },
  listByTournament(tid) { return db.prepare('SELECT * FROM registrations WHERE tournament_id=? ORDER BY registered_at ASC').all(tid); },
  remove(id) { db.prepare('DELETE FROM registrations WHERE id=?').run(id); },
  count(tid) { return db.prepare('SELECT COUNT(*) AS c FROM registrations WHERE tournament_id=?').get(tid).c; },
};

module.exports = { Registration };
