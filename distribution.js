const { Winner, Badge, Tournament } = require('./models');

async function distributeReward(winnerId) {
  return Winner.markClaimed(winnerId);
}

async function giveBadge(playerName, year, rank) {
  const badgeName = rank === 1 ? 'Champion' : rank <= 3 ? 'Podium' : 'Participant';
  return Badge.create(playerName, badgeName, year, 'badge_' + rank);
}

async function distributeAll(year) {
  const tournament = Tournament.findByYear(year);
  const winners = Winner.listByTournament(tournament.id);
  const results = [];
  for (const w of winners) {
    await distributeReward(w.id);
    await giveBadge(w.player_name, year, w.rank);
    results.push(w.player_name);
  }
  Tournament.updateStatus(year, 'finished');
  return results;
}

module.exports = { distributeReward, giveBadge, distributeAll };
