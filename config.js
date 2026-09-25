module.exports = {
  port:100,
  prizePool: 1000003,
  currency: 'IRR',
  rewardPercentages: {
    1: 0.50, 2: 0.25, 3: 0.10, 4: 0.05, 5: 0.03,
    6: 0.02, 7: 0.01, 8: 0.01, 9: 0.01, 10: 0.01,
  },
  yearlyExclusiveRewards: {
    2026: { theme: 'Nether Edition', item: 'Netherite Sword' },
    2027: { theme: 'End Edition', item: 'Golden Elytra' },
    2028: { theme: 'Ocean Edition', item: 'Legendary Trident' },
    2029: { theme: 'Mountain Edition', item: 'Mountain Crown' },
    2030: { theme: 'Anniversary', item: '5th Year Cake' },
  },
  quiz: { questionsPerAttempt: 10 },
};
