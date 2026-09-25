const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const auth = require('./auth');
const { createAnnualTournament, registerWinners } = require('./rewardEngine');
const { distributeAll } = require('./distribution');
const { getAllChampions, getYearChampions, getStats } = require('./hallOfFame');
const { Reward, Tournament } = require('./models');
const { Registration } = require('./registrations');
const { Player, requirePlayer } = require('./players');
const { Quiz } = require('./quiz');
const { db } = require('./database');

const router = express.Router();

router.use(cors());
router.use(express.json());

// ============================================================
// Admin Authentication
// ============================================================
router.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  const result = auth.login(username, password);
  if (!result) {
    return res.status(401).json({ ok: false, error: 'Invalid username or password' });
  }
  res.json({ ok: true, ...result });
});

router.post('/auth/logout', auth.requireAuth, (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  auth.logout(token);
  res.json({ ok: true });
});

router.get('/auth/me', auth.requireAuth, (req, res) => {
  res.json({ ok: true, admin: req.admin });
});

// ============================================================
// Tournaments
// ============================================================
router.get('/tournament/active', (req, res) => {
  try {
    const t = db.prepare(
      "SELECT * FROM tournaments WHERE status IN ('open', 'running') ORDER BY year DESC LIMIT 1"
    ).get();

    if (!t) {
      return res.status(404).json({ ok: false, error: 'No active match' });
    }
    res.json({ ok: true, tournament: t });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.get('/tournaments', (req, res) => {
  try {
    const rows = Tournament.listAll();
    res.json({ ok: true, tournaments: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.post('/tournament', auth.requireAuth, async (req, res) => {
  try {
    const { year, name, theme, prizePool } = req.body;
    if (!year) {
      return res.status(400).json({ ok: false, error: 'Year is required' });
    }
    const t = await createAnnualTournament(Number(year), name, theme, prizePool);
    res.json({ ok: true, tournament: t });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ============================================================
// Rewards
// ============================================================
router.get('/rewards/:year', (req, res) => {
  const t = Tournament.findByYear(Number(req.params.year));
  if (!t) {
    return res.status(404).json({ ok: false, error: 'Not found' });
  }
  const rewards = Reward.listByTournament(t.id);
  res.json({ ok: true, rewards });
});

// ============================================================
// Public Registration
// ============================================================
router.post('/register', (req, res) => {
  try {
    const { year, playerName, discordId, email, minecraftUsername } = req.body;

    let t;
    if (year) t = Tournament.findByYear(Number(year));
    if (!t) t = Tournament.findActive();
    if (!t) {
      return res.status(404).json({ ok: false, error: 'No active match' });
    }
    if (t.status === 'finished') {
      return res.status(400).json({ ok: false, error: 'This match is finished' });
    }
    if (!playerName) {
      return res.status(400).json({ ok: false, error: 'Name is required' });
    }

    const reg = Registration.create(t.id, {
      playerName,
      discordId,
      email,
      minecraftUsername,
    });
    res.json({ ok: true, registration: reg, tournament: t });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ============================================================
// Registration List (Admin)
// ============================================================
router.get('/registrations/:year', auth.requireAuth, (req, res) => {
  const t = Tournament.findByYear(Number(req.params.year));
  if (!t) {
    return res.status(404).json({ ok: false, error: 'Not found' });
  }
  const list = Registration.listByTournament(t.id);
  res.json({ ok: true, registrations: list });
});

router.delete('/registrations/:id', auth.requireAuth, (req, res) => {
  Registration.remove(Number(req.params.id));
  res.json({ ok: true });
});

// ============================================================
// Winners (manual registration)
// ============================================================
router.post('/winners/:year', auth.requireAuth, async (req, res) => {
  try {
    await registerWinners(Number(req.params.year), req.body.winners);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ============================================================
// List Winners (for start.html display)
// ============================================================
router.get('/winners/:year', (req, res) => {
  try {
    const t = Tournament.findByYear(Number(req.params.year));
    if (!t) return res.status(404).json({ ok: false, error: 'Match not found' });

    const winners = db.prepare(`
      SELECT * FROM winners
      WHERE tournament_id = ?
      ORDER BY rank ASC
    `).all(t.id);

    res.json({ ok: true, winners: winners });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ============================================================
// Distribute Rewards
// ============================================================
router.post('/distribute/:year', auth.requireAuth, async (req, res) => {
  try {
    const result = await distributeAll(Number(req.params.year));
    res.json({ ok: true, distributed: result });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ============================================================
// Hall of Fame
// ============================================================
router.get('/hall-of-fame', (req, res) => {
  res.json({ ok: true, data: getAllChampions() });
});

router.get('/hall-of-fame/:year', (req, res) => {
  res.json({ ok: true, data: getYearChampions(Number(req.params.year)) });
});

router.get('/stats', (req, res) => {
  res.json({ ok: true, data: getStats() });
});

// ============================================================
// Player Login
// ============================================================
router.post('/player/login', (req, res) => {
  const { minecraftUsername } = req.body;
  if (!minecraftUsername) {
    return res.status(400).json({ ok: false, error: 'Minecraft username is required' });
  }

  const result = Player.login(minecraftUsername.trim());
  if (!result) {
    return res.status(404).json({ ok: false, error: 'Username not registered' });
  }

  res.json({
    ok: true,
    token: result.token,
    playerName: result.player.player_name,
    tournament: {
      year: result.player.year,
      name: result.player.tournament_name,
      theme: result.player.theme,
    },
  });
});

router.post('/player/logout', requirePlayer, (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  Player.logout(token);
  res.json({ ok: true });
});

router.get('/player/me', requirePlayer, (req, res) => {
  const profile = Player.getProfile(req.player.playerId);
  if (!profile) {
    return res.status(404).json({ ok: false, error: 'Profile not found' });
  }
  res.json({ ok: true, profile });
});

// ============================================================
// Match Control (Admin)
// ============================================================
router.post('/admin/start-tournament/:year', auth.requireAuth, (req, res) => {
  try {
    const t = Tournament.findByYear(Number(req.params.year));
    if (!t) {
      return res.status(404).json({ ok: false, error: 'Match not found' });
    }

    Tournament.updateStatus(t.year, 'running');
    res.json({ ok: true, message: '🏁 Match ' + t.year + ' started!' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.post('/admin/stop-tournament/:year', auth.requireAuth, (req, res) => {
  try {
    const t = Tournament.findByYear(Number(req.params.year));
    if (!t) {
      return res.status(404).json({ ok: false, error: 'Match not found' });
    }

    Tournament.updateStatus(t.year, 'finished');
    res.json({ ok: true, message: '✅ Match ' + t.year + ' finished' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ============================================================
// Reset Match (Admin)
// ============================================================
router.post('/admin/reset-tournament/:year', auth.requireAuth, (req, res) => {
  try {
    const t = Tournament.findByYear(Number(req.params.year));
    if (!t) {
      return res.status(404).json({ ok: false, error: 'Match not found' });
    }

    Tournament.updateStatus(t.year, 'open');

    db.prepare('DELETE FROM quiz_answers WHERE attempt_id IN (SELECT id FROM quiz_attempts WHERE tournament_id=?)').run(t.id);
    db.prepare('DELETE FROM quiz_attempts WHERE tournament_id=?').run(t.id);
    db.prepare('DELETE FROM winners WHERE tournament_id=?').run(t.id);
    db.prepare('DELETE FROM badges WHERE year=?').run(t.year);

    res.json({ ok: true, message: '🔄 Match ' + t.year + ' reset' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ============================================================
// Quiz (Player)
// ============================================================
router.post('/quiz/start', requirePlayer, (req, res) => {
  try {
    const session = req.player;
    const profile = Player.getProfile(session.playerId);
    if (!profile) {
      return res.status(404).json({ ok: false, error: 'Profile not found' });
    }

    const t = profile.registration;
    const result = Quiz.start(session.playerId, t.tournament_id, 10);
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

router.post('/quiz/answer', requirePlayer, (req, res) => {
  try {
    const { attemptId, questionId, selectedAnswer } = req.body;
    const result = Quiz.answer(Number(attemptId), Number(questionId), selectedAnswer);
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

router.post('/quiz/finish', requirePlayer, (req, res) => {
  try {
    const { attemptId } = req.body;
    const result = Quiz.finish(Number(attemptId));
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

router.get('/quiz/my-history', requirePlayer, (req, res) => {
  try {
    const session = req.player;
    const profile = Player.getProfile(session.playerId);
    if (!profile) {
      return res.json({ ok: true, hasAttempt: false });
    }

    const attempt = db.prepare(`
      SELECT * FROM quiz_attempts
      WHERE player_id=? AND tournament_id=? AND finished_at IS NOT NULL
      ORDER BY id DESC LIMIT 1
    `).get(session.playerId, profile.registration.tournament_id);

    if (!attempt) {
      return res.json({ ok: true, hasAttempt: false });
    }
    res.json({ ok: true, hasAttempt: true, attempt });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ============================================================
// Quiz Leaderboard
// ============================================================
router.get('/quiz/leaderboard/:year', (req, res) => {
  try {
    const t = Tournament.findByYear(Number(req.params.year));
    if (!t) {
      return res.status(404).json({ ok: false, error: 'Match not found' });
    }
    const list = Quiz.leaderboard(t.id);
    res.json({ ok: true, leaderboard: list });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ============================================================
// Current Winner (Rank 1)
// ============================================================
router.get('/quiz/winner/:year', (req, res) => {
  try {
    const t = Tournament.findByYear(Number(req.params.year));
    if (!t) {
      return res.status(404).json({ ok: false, error: 'Match not found' });
    }

    const winner = db.prepare(`
      SELECT qa.id, qa.score, qa.total_questions, qa.duration_seconds, r.player_name
      FROM quiz_attempts qa
      JOIN registrations r ON r.id = qa.player_id
      WHERE qa.tournament_id = ? AND qa.is_winner = 1
      LIMIT 1
    `).get(t.id);

    res.json({ ok: true, winner: winner || null });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ============================================================
// ⭐ Select Winner (Rank 1, 2 or 3)
// ============================================================
router.post('/admin/select-winner/:year', auth.requireAuth, (req, res) => {
  try {
    const { attemptId, rank } = req.body;
    const playerRank = Number(rank) || 1;

    if (!attemptId) {
      return res.status(400).json({ ok: false, error: 'Participant ID required' });
    }
    if (playerRank < 1 || playerRank > 3) {
      return res.status(400).json({ ok: false, error: 'Rank must be 1, 2 or 3' });
    }

    const t = Tournament.findByYear(Number(req.params.year));
    if (!t) {
      return res.status(404).json({ ok: false, error: 'Match not found' });
    }

    const attempt = db.prepare(`
      SELECT qa.*, r.player_name, r.minecraft_username
      FROM quiz_attempts qa
      JOIN registrations r ON r.id = qa.player_id
      WHERE qa.id = ? AND qa.tournament_id = ?
    `).get(Number(attemptId), t.id);

    if (!attempt) {
      return res.status(404).json({ ok: false, error: 'Participant not found' });
    }

    // Remove existing winner for this rank
    db.prepare('DELETE FROM winners WHERE tournament_id = ? AND rank = ?').run(t.id, playerRank);

    // Remove old badge for this rank
    const badgeNames = { 1: 'Champion', 2: 'Runner-Up', 3: 'Third Place' };
    db.prepare('DELETE FROM badges WHERE year = ? AND badge_name = ?').run(t.year, badgeNames[playerRank]);

    // Insert new winner
    db.prepare(`
      INSERT INTO winners (tournament_id, player_name, discord_id, rank)
      VALUES (?, ?, ?, ?)
    `).run(t.id, attempt.player_name, attempt.minecraft_username, playerRank);

    // Add badge
    db.prepare(`
      INSERT INTO badges (player_name, badge_name, year, icon_url)
      VALUES (?, ?, ?, ?)
    `).run(attempt.player_name, badgeNames[playerRank], t.year, 'rank_' + playerRank);

    // Mark as champion only if rank 1
    if (playerRank === 1) {
      db.prepare('UPDATE quiz_attempts SET is_winner = 1 WHERE id = ?').run(attempt.id);
    } else {
      db.prepare('UPDATE quiz_attempts SET is_winner = 0 WHERE id = ?').run(attempt.id);
    }

    const rankNames = { 1: '🥇 First Place', 2: '🥈 Second Place', 3: '🥉 Third Place' };
    res.json({
      ok: true,
      message: '🏆 ' + attempt.player_name + ' selected as ' + rankNames[playerRank],
      winner: attempt,
      rank: playerRank,
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ============================================================
// Skin Download (Rank 1, 2, 3)
// ============================================================
router.get('/skin/:year/:rank', (req, res) => {
  try {
    const year = Number(req.params.year);
    const rank = Number(req.params.rank);

    if (rank < 1 || rank > 3) {
      return res.status(400).json({ ok: false, error: 'Rank must be 1, 2 or 3' });
    }

    const t = Tournament.findByYear(year);
    if (!t) {
      return res.status(404).json({ ok: false, error: 'Match not found' });
    }

    const skinFile = rank === 1 ? 'champion' : rank === 2 ? 'runner_up' : 'third';
    const fileName = skinFile + '_' + year + '.png';
    const skinPath = path.join(__dirname, 'public', 'skins', fileName);

    if (!fs.existsSync(skinPath)) {
      return res.status(404).json({ ok: false, error: 'Skin file not found: ' + fileName });
    }

    res.json({
      ok: true,
      skin_url: '/skins/' + fileName,
      download_url: '/skins/' + fileName,
      rank: rank,
      year: year,
      file_name: fileName,
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ============================================================
// Reward Info (with skin URLs)
// ============================================================
router.get('/reward-info/:year', (req, res) => {
  try {
    const t = Tournament.findByYear(Number(req.params.year));
    if (!t) {
      return res.status(404).json({ ok: false, error: 'Match not found' });
    }

    const rewards = db.prepare(`
      SELECT * FROM rewards WHERE tournament_id = ? ORDER BY rank ASC
    `).all(t.id);

    const result = rewards.map(r => {
      const skinFile = r.rank === 1 ? 'champion' : r.rank === 2 ? 'runner_up' : r.rank === 3 ? 'third' : null;
      return {
        rank: r.rank,
        cash_prize: r.cash_prize,
        skin_url: skinFile ? `/skins/${skinFile}_${t.year}.png` : null,
        exclusive_item: r.exclusive_item,
      };
    });

    res.json({ ok: true, rewards: result });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ============================================================
// Fallback
// ============================================================
router.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: 'API route not found',
    path: req.path,
    method: req.method,
  });
});

module.exports = router;