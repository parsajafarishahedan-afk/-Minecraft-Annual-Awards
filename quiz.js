const { db } = require('./database');

const Question = {
  findById(id) { return db.prepare('SELECT * FROM questions WHERE id=?').get(id); },
  getRandom(count) { return db.prepare('SELECT * FROM questions ORDER BY RANDOM() LIMIT ?').all(count); },
  count() { return db.prepare('SELECT COUNT(*) as c FROM questions').get().c; },
};

const Quiz = {
  start(playerId, tournamentId, questionCount) {
    questionCount = questionCount || 10;
    const t = db.prepare('SELECT * FROM tournaments WHERE id=?').get(tournamentId);
    if (!t) throw new Error('Ù…Ø³Ø§Ø¨Ù‚Ù‡ ÛŒØ§ÙØª Ù†Ø´Ø¯');
    if (t.status !== 'running') throw new Error('Ù…Ø³Ø§Ø¨Ù‚Ù‡ Ù‡Ù†ÙˆØ² Ø´Ø±ÙˆØ¹ Ù†Ø´Ø¯Ù‡');
    const existing = db.prepare('SELECT * FROM quiz_attempts WHERE player_id=? AND tournament_id=? AND finished_at IS NOT NULL').get(playerId, tournamentId);
    if (existing) throw new Error('Ø´Ù…Ø§ Ù‚Ø¨Ù„Ø§Ù‹ Ø¯Ø± Ø§ÛŒÙ† Ù…Ø³Ø§Ø¨Ù‚Ù‡ Ø´Ø±Ú©Øª Ú©Ø±Ø¯Ù‡â€ŒØ§ÛŒØ¯');
    db.prepare('DELETE FROM quiz_attempts WHERE player_id=? AND tournament_id=? AND finished_at IS NULL').run(playerId, tournamentId);
    const questions = Question.getRandom(questionCount);
    if (questions.length < questionCount) throw new Error('Ø³ÙˆØ§Ù„ Ú©Ø§ÙÛŒ Ù†ÛŒØ³Øª');
    const info = db.prepare('INSERT INTO quiz_attempts (tournament_id, player_id, total_questions) VALUES (?, ?, ?)').run(tournamentId, playerId, questionCount);
    return {
      attemptId: info.lastInsertRowid,
      questions: questions.map(q => ({ id: q.id, question: q.question, a: q.option_a, b: q.option_b, c: q.option_c, d: q.option_d }))
    };
  },
  answer(attemptId, questionId, selectedAnswer) {
    const attempt = db.prepare('SELECT * FROM quiz_attempts WHERE id=?').get(attemptId);
    if (!attempt) throw new Error('Ú©ÙˆÛŒÛŒØ² ÛŒØ§ÙØª Ù†Ø´Ø¯');
    if (attempt.finished_at) throw new Error('Ú©ÙˆÛŒÛŒØ² ØªÙ…Ø§Ù… Ø´Ø¯Ù‡');
    const existing = db.prepare('SELECT * FROM quiz_answers WHERE attempt_id=? AND question_id=?').get(attemptId, questionId);
    if (existing) throw new Error('Ù‚Ø¨Ù„Ø§Ù‹ Ù¾Ø§Ø³Ø® Ø¯Ø§Ø¯Ù‡â€ŒØ§ÛŒØ¯');
    const q = Question.findById(questionId);
    if (!q) throw new Error('Ø³ÙˆØ§Ù„ ÛŒØ§ÙØª Ù†Ø´Ø¯');
    const isCorrect = q.correct_answer === selectedAnswer ? 1 : 0;
    db.prepare('INSERT INTO quiz_answers (attempt_id, question_id, selected_answer, is_correct) VALUES (?, ?, ?, ?)').run(attemptId, questionId, selectedAnswer, isCorrect);
    if (isCorrect) db.prepare('UPDATE quiz_attempts SET score = score + 1 WHERE id=?').run(attemptId);
    return { isCorrect: !!isCorrect, correctAnswer: q.correct_answer };
  },
  finish(attemptId) {
    const attempt = db.prepare('SELECT * FROM quiz_attempts WHERE id=?').get(attemptId);
    if (!attempt) throw new Error('Ú©ÙˆÛŒÛŒØ² ÛŒØ§ÙØª Ù†Ø´Ø¯');
    if (attempt.finished_at) return this.getResult(attemptId);
    const duration = Math.floor((Date.now() - new Date(attempt.started_at).getTime()) / 1000);
    db.prepare('UPDATE quiz_attempts SET finished_at = CURRENT_TIMESTAMP, duration_seconds = ? WHERE id = ?').run(duration, attemptId);
    return this.getResult(attemptId);
  },
  getResult(attemptId) {
    const attempt = db.prepare('SELECT qa.*, r.player_name, r.minecraft_username FROM quiz_attempts qa JOIN registrations r ON r.id = qa.player_id WHERE qa.id = ?').get(attemptId);
    if (!attempt) return null;
    const answers = db.prepare('SELECT ans.*, q.question, q.correct_answer FROM quiz_answers ans JOIN questions q ON q.id = ans.question_id WHERE ans.attempt_id = ? ORDER BY ans.id ASC').all(attemptId);
    return { attempt, answers };
  },
  leaderboard(tournamentId) {
    return db.prepare('SELECT qa.id, qa.score, qa.total_questions, qa.duration_seconds, qa.finished_at, r.player_name, r.minecraft_username FROM quiz_attempts qa JOIN registrations r ON r.id = qa.player_id WHERE qa.tournament_id = ? AND qa.finished_at IS NOT NULL ORDER BY qa.score DESC, qa.duration_seconds ASC').all(tournamentId);
  },
  getWinner(tournamentId) {
    return db.prepare('SELECT qa.id, qa.score, qa.total_questions, qa.duration_seconds, r.player_name, r.minecraft_username FROM quiz_attempts qa JOIN registrations r ON r.id = qa.player_id WHERE qa.tournament_id = ? AND qa.finished_at IS NOT NULL ORDER BY qa.score DESC, qa.duration_seconds ASC LIMIT 1').get(tournamentId);
  },
  declareWinner(tournamentId) {
    const winner = this.getWinner(tournamentId);
    if (!winner) throw new Error('Ù‡ÛŒÚ† Ø´Ø±Ú©Øªâ€ŒÚ©Ù†Ù†Ø¯Ù‡â€ŒØ§ÛŒ Ù†ÛŒØ³Øª');
    db.prepare('UPDATE quiz_attempts SET is_winner = 0 WHERE tournament_id = ?').run(tournamentId);
    db.prepare('UPDATE quiz_attempts SET is_winner = 1 WHERE id = ?').run(winner.id);
    const t = db.prepare('SELECT year FROM tournaments WHERE id=?').get(tournamentId);
    db.prepare('DELETE FROM badges WHERE year = ? AND badge_name = ?').run(t.year, 'Champion');
    db.prepare('INSERT INTO badges (player_name, badge_name, year, icon_url) VALUES (?, ?, ?, ?)').run(winner.player_name, 'Champion', t.year, 'cape');
    db.prepare('DELETE FROM winners WHERE tournament_id = ? AND rank = 1').run(tournamentId);
    db.prepare('INSERT INTO winners (tournament_id, player_name, discord_id, rank) VALUES (?, ?, ?, 1)').run(tournamentId, winner.player_name, winner.minecraft_username);
    return winner;
  },
};

module.exports = { Quiz, Question };
