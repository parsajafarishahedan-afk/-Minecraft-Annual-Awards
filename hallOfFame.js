const { db } = require('./database');

function getAllChampions() {
  return db.prepare('SELECT t.year, t.theme, w.player_name, w.rank, w.claimed, b.badge_name FROM winners w JOIN tournaments t ON t.id = w.tournament_id LEFT JOIN badges b ON b.player_name = w.player_name AND b.year = t.year ORDER BY t.year DESC, w.rank ASC').all();
}

function getYearChampions(year) {
  return db.prepare('SELECT w.player_name, w.rank, w.claimed, b.badge_name FROM winners w JOIN tournaments t ON t.id = w.tournament_id LEFT JOIN badges b ON b.player_name = w.player_name AND b.year = t.year WHERE t.year = ? ORDER BY w.rank ASC').all(year);
}

function getStats() {
  return db.prepare('SELECT COUNT(DISTINCT t.year) AS total_years, COUNT(DISTINCT w.player_name) AS total_players, COALESCE(SUM(t.prize_pool), 0) AS total_prize_pool FROM tournaments t LEFT JOIN winners w ON w.tournament_id = t.id').get();
}

module.exports = { getAllChampions, getYearChampions, getStats };
