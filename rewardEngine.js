const config = require('./config');
const { Tournament, Reward, Winner } = require('./models');

function calculateRewards(prizePool) {
  const rewards = [];
  for (const [rank, percent] of Object.entries(config.rewardPercentages)) {
    rewards.push({ rank: Number(rank), cashPrize: Math.floor(prizePool * percent) });
  }
  return rewards;
}

async function createAnnualTournament(year, name, theme, prizePool) {
  const t = Tournament.create(year, name || ('Minecraft Cup ' + year), theme || 'Standard Edition', prizePool || config.prizePool);
  const rewards = calculateRewards(t.prize_pool);
  for (const r of rewards) {
    Reward.create(t.id, r.rank, r.cashPrize, 'Rank-' + r.rank + '-Digital', r.rank === 1 ? 'Champion Crown' : null);
  }
  return t;
}

async function registerWinners(year, winnersList) {
  const t = Tournament.findByYear(year);
  if (!t) throw new Error('Tournament not found');
  for (const w of winnersList) Winner.create(t.id, w.name, w.discordId, w.rank);
}

module.exports = { calculateRewards, createAnnualTournament, registerWinners };
