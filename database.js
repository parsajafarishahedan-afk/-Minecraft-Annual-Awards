const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'awards.db'));
db.pragma('journal_mode = WAL');

function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tournaments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER UNIQUE NOT NULL,
      name TEXT,
      theme TEXT,
      prize_pool REAL NOT NULL,
      status TEXT DEFAULT 'open',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
      rank INTEGER NOT NULL,
      cash_prize REAL NOT NULL,
      digital_reward TEXT,
      exclusive_item TEXT
    );
    CREATE TABLE IF NOT EXISTS winners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
      player_name TEXT NOT NULL,
      discord_id TEXT,
      rank INTEGER NOT NULL,
      claimed INTEGER DEFAULT 0,
      claimed_at TEXT
    );
    CREATE TABLE IF NOT EXISTS badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_name TEXT NOT NULL,
      badge_name TEXT,
      year INTEGER,
      icon_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
      player_name TEXT NOT NULL,
      discord_id TEXT,
      email TEXT,
      minecraft_username TEXT,
      registered_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      correct_answer TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
      player_id INTEGER REFERENCES registrations(id) ON DELETE CASCADE,
      score INTEGER DEFAULT 0,
      total_questions INTEGER,
      is_winner INTEGER DEFAULT 0,
      started_at TEXT DEFAULT CURRENT_TIMESTAMP,
      finished_at TEXT,
      duration_seconds INTEGER
    );
    CREATE TABLE IF NOT EXISTS quiz_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      attempt_id INTEGER REFERENCES quiz_attempts(id) ON DELETE CASCADE,
      question_id INTEGER REFERENCES questions(id),
      selected_answer TEXT,
      is_correct INTEGER DEFAULT 0,
      answered_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('OK Tables ready');

  ensureDefaultTournament();
  seedDefaultQuestions();
}

function ensureDefaultTournament() {
  const currentYear = new Date().getFullYear();
  const existing = db.prepare('SELECT * FROM tournaments WHERE year=?').get(currentYear);
  if (existing) return;

  db.prepare('INSERT INTO tournaments (year, name, theme, prize_pool, status) VALUES (?, ?, ?, ?, ?)')
    .run(currentYear, 'Minecraft Cup ' + currentYear, 'Standard Edition', 10000000, 'open');

  const t = db.prepare('SELECT * FROM tournaments WHERE year=?').get(currentYear);
  const percentages = [0.5, 0.25, 0.1, 0.05, 0.03, 0.02, 0.01, 0.01, 0.01, 0.01];
  const stmt = db.prepare('INSERT INTO rewards (tournament_id, rank, cash_prize, digital_reward, exclusive_item) VALUES (?, ?, ?, ?, ?)');
  percentages.forEach((p, i) => {
    stmt.run(t.id, i + 1, Math.floor(10000000 * p), 'Rank-' + (i + 1) + '-Digital', i === 0 ? 'Champion Crown' : null);
  });
  console.log('OK Default tournament created');
}

function seedDefaultQuestions() {
  const count = db.prepare('SELECT COUNT(*) as c FROM questions').get().c;
  if (count > 0) return;

  const questions = [
    { q: 'Which item is needed to make a Nether Portal?', a: 'Diamond Pickaxe', b: 'Flint and Steel', c: 'Redstone', d: 'Golden Apple', correct: 'b' },
    { q: 'What is Enderman made of?', a: 'Obsidian', b: 'End Stone and Ender Pearl', c: 'Black Wool', d: 'Netherrack', correct: 'b' },
    { q: 'Which mob lives in the Nether?', a: 'Zombie', b: 'Blaze', c: 'Skeleton', d: 'Creeper', correct: 'b' },
    { q: 'What does Piglin trade with?', a: 'Emerald', b: 'Gold Ingot', c: 'Diamond', d: 'Netherite', correct: 'b' },
    { q: 'What is Wither made of?', a: 'Soul Sand and Wither Skulls', b: 'Netherrack', c: 'Obsidian', d: 'Soul Soil', correct: 'a' },
    { q: 'What does Enderman do when you look at it?', a: 'Runs away', b: 'Attacks', c: 'Disappears', d: 'Explodes', correct: 'b' },
    { q: 'What do you need to go to the End?', a: 'End Portal Frame and Eye of Ender', b: 'Nether Portal', c: 'Elytra', d: 'End Crystal', correct: 'a' },
    { q: 'How many HP does Ender Dragon have?', a: '100', b: '200', c: '300', d: '500', correct: 'b' },
    { q: 'Where can you find Elytra?', a: 'End City', b: 'Nether Fortress', c: 'Ocean Monument', d: 'Woodland Mansion', correct: 'a' },
    { q: 'Which block has the most resistance in the Nether?', a: 'Obsidian', b: 'Ancient Debris', c: 'Netherite Block', d: 'Bedrock', correct: 'b' },
    { q: 'What does Creeper do when it gets close?', a: 'Runs away', b: 'Physical attack', c: 'Explodes itself', d: 'Sets fire', correct: 'c' },
    { q: 'Which mob only attacks during the day?', a: 'Zombie', b: 'Creeper', c: 'Phantom', d: 'Spider', correct: 'c' },
    { q: 'What happens to Zombie during the day?', a: 'Dies', b: 'Catches fire', c: 'Runs away', d: 'Gets stronger', correct: 'b' },
    { q: 'Which mob calms down when you look at it?', a: 'Enderman', b: 'Creeper', c: 'Spider', d: 'Skeleton', correct: 'a' },
    { q: 'What does Skeleton attack with?', a: 'Sword', b: 'Bow', c: 'Mace', d: 'Spear', correct: 'b' },
    { q: 'How many eyes does Spider have?', a: 'Two', b: 'Four', c: 'Six', d: 'Eight', correct: 'd' },
    { q: 'Which mob can poison the player?', a: 'Zombie', b: 'Cave Spider', c: 'Skeleton', d: 'Creeper', correct: 'b' },
    { q: 'Which mob can fly?', a: 'Bat', b: 'Blaze', c: 'Phantom', d: 'All of them', correct: 'd' },
    { q: 'Which mob lays eggs?', a: 'Chicken', b: 'Cow', c: 'Pig', d: 'Sheep', correct: 'a' },
    { q: 'Which mob should you kill to get Wool?', a: 'Chicken', b: 'Cow', c: 'Sheep', d: 'Pig', correct: 'c' },
    { q: 'Which mob gives pork?', a: 'Chicken', b: 'Cow', c: 'Pig', d: 'Sheep', correct: 'c' },
    { q: 'Where can you find Wither Skeleton?', a: 'Nether Fortress', b: 'End City', c: 'Overworld', d: 'Ocean', correct: 'a' },
    { q: 'Which mob lives in water?', a: 'Squid', b: 'Fish', c: 'Dolphin', d: 'All of them', correct: 'd' },
    { q: 'What is the max build height?', a: '128', b: '256', c: '320', d: '512', correct: 'c' },
    { q: 'Which block is needed for Enchantment Table?', a: 'Diamond Block', b: 'Obsidian', c: 'Bedrock', d: 'Gold', correct: 'b' },
    { q: 'What do you need for a Beacon?', a: 'Nether Star', b: 'Diamond', c: 'Ender Pearl', d: 'Netherite Ingot', correct: 'a' },
    { q: 'Which is the strongest block?', a: 'Obsidian', b: 'Bedrock', c: 'Ancient Debris', d: 'Netherite Block', correct: 'b' },
    { q: 'At what height is Diamond most common?', a: 'Y=5', b: 'Y=12', c: 'Y=-59', d: 'Y=30', correct: 'c' },
    { q: 'Best tool for Ancient Debris?', a: 'Iron Pickaxe', b: 'Diamond Pickaxe', c: 'Netherite Pickaxe', d: 'Stone Pickaxe', correct: 'b' },
    { q: 'What do you need for a Shulker Box?', a: 'Shulker Shell', b: 'Ender Pearl', c: 'Chest', d: 'Iron Ingot', correct: 'a' },
    { q: 'Which item is needed for a Torch?', a: 'Coal and Stick', b: 'Redstone', c: 'Diamond', d: 'Iron', correct: 'a' },
    { q: 'What do you need for a Crafting Table?', a: '4 Wood Planks', b: '2 Wood Logs', c: 'Iron Ingot', d: 'Stone', correct: 'a' },
    { q: 'What do you need for a Furnace?', a: '8 Cobblestone', b: '8 Stone', c: '8 Iron', d: '8 Coal', correct: 'a' },
    { q: 'What do you need for a Cake?', a: 'Wheat, Sugar, Egg, Milk', b: 'Flour, Sugar, Egg', c: 'Bread, Sugar, Milk', d: 'Honey, Egg', correct: 'a' },
    { q: 'Best food for health?', a: 'Bread', b: 'Cooked Beef', c: 'Golden Apple', d: 'Enchanted Golden Apple', correct: 'd' },
    { q: 'What do you need for Bread?', a: '3 Wheat', b: '2 Wheat', c: 'Flour', d: 'Rice', correct: 'a' },
    { q: 'Which food makes player faster?', a: 'Bread', b: 'Cooked Chicken', c: 'Sugar', d: 'Carrot', correct: 'c' },
    { q: 'What do you need for a Golden Apple?', a: 'Apple and 8 Gold Ingots', b: 'Apple and 8 Gold Blocks', c: 'Apple and Sugar', d: 'Apple and Honey', correct: 'a' },
    { q: 'Which enchantment is useful for Shovel?', a: 'Silk Touch', b: 'Efficiency', c: 'Fortune', d: 'All of them', correct: 'b' },
    { q: 'What does Silk Touch do?', a: 'Speeds up', b: 'Drops the block intact', c: 'Increases yield', d: 'Sets fire', correct: 'b' },
    { q: 'What does Fortune do on a Pickaxe?', a: 'More speed', b: 'More item drop chance', c: 'Fire', d: 'Breaking', correct: 'b' },
    { q: 'What does Sharpness do on a Sword?', a: 'More speed', b: 'More damage', c: 'Defense', d: 'Durability', correct: 'b' },
    { q: 'What does Unbreaking do?', a: 'More durability', b: 'Speed', c: 'Damage', d: 'Defense', correct: 'a' },
    { q: 'How long does Water Breathing last?', a: '1 minute', b: '3 minutes', c: '8 minutes', d: 'Unlimited', correct: 'c' },
    { q: 'What does Potion of Healing do?', a: 'Gives health', b: 'Speed', c: 'Strength', d: 'Defense', correct: 'a' },
    { q: 'What does Potion of Strength do?', a: 'Health', b: 'More strength', c: 'Speed', d: 'Defense', correct: 'b' },
    { q: 'What does Potion of Swiftness do?', a: 'Health', b: 'Strength', c: 'More speed', d: 'Defense', correct: 'c' },
    { q: 'What does Potion of Night Vision do?', a: 'See in the dark', b: 'Health', c: 'Speed', d: 'Strength', correct: 'a' },
    { q: 'Which block is needed for Nether Portal?', a: 'Obsidian', b: 'Bedrock', c: 'Netherrack', d: 'End Stone', correct: 'a' },
    { q: 'Which item is needed to kill Ender Dragon?', a: 'Bow and Arrow', b: 'Diamond Sword', c: 'End Crystal', d: 'TNT', correct: 'a' },
  ];
  

  const stmt = db.prepare('INSERT INTO questions (question, option_a, option_b, option_c, option_d, correct_answer) VALUES (?, ?, ?, ?, ?, ?)');
  const insertMany = db.transaction((items) => {
    for (const q of items) stmt.run(q.q, q.a, q.b, q.c, q.d, q.correct);
  });
  insertMany(questions);
  console.log('OK ' + questions.length + ' questions inserted');
}

module.exports = { db, initDB };
