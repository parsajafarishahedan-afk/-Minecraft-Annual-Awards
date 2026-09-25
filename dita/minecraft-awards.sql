-- ============================================================
-- Minecraft Annual Awards - FULL Database with History
-- by parsa.ps
-- ============================================================

USE master;
GO
IF EXISTS (SELECT * FROM sys.databases WHERE name = 'MinecraftAwards')
BEGIN
    ALTER DATABASE MinecraftAwards SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE MinecraftAwards;
END
GO

CREATE DATABASE MinecraftAwards;
GO
USE MinecraftAwards;
GO

-- ============================================================
-- جدول مسابقات
-- ============================================================
CREATE TABLE tournaments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    year INT NOT NULL UNIQUE,
    name NVARCHAR(200),
    theme NVARCHAR(200),
    prize_pool DECIMAL(18,0) NOT NULL,
    status NVARCHAR(20) DEFAULT 'open',
    winner_name NVARCHAR(200),
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- ============================================================
-- جدول جوایز
-- ============================================================
CREATE TABLE rewards (
    id INT IDENTITY(1,1) PRIMARY KEY,
    tournament_id INT NOT NULL,
    rank INT NOT NULL,
    cash_prize DECIMAL(18,0) NOT NULL,
    digital_reward NVARCHAR(200),
    exclusive_item NVARCHAR(200),
    CONSTRAINT FK_rewards_tournament FOREIGN KEY (tournament_id) 
        REFERENCES tournaments(id) ON DELETE CASCADE
);
GO

-- ============================================================
-- جدول برندگان
-- ============================================================
CREATE TABLE winners (
    id INT IDENTITY(1,1) PRIMARY KEY,
    tournament_id INT NOT NULL,
    player_name NVARCHAR(200) NOT NULL,
    discord_id NVARCHAR(100),
    rank INT NOT NULL,
    score INT,
    claimed BIT DEFAULT 0,
    claimed_at DATETIME,
    CONSTRAINT FK_winners_tournament FOREIGN KEY (tournament_id) 
        REFERENCES tournaments(id) ON DELETE CASCADE
);
GO

-- ============================================================
-- جدول بازیکنان
-- ============================================================
CREATE TABLE players (
    id INT IDENTITY(1,1) PRIMARY KEY,
    player_name NVARCHAR(200) NOT NULL UNIQUE,
    minecraft_username NVARCHAR(100),
    discord_id NVARCHAR(100),
    email NVARCHAR(200),
    total_wins INT DEFAULT 0,
    total_attempts INT DEFAULT 0,
    best_score INT DEFAULT 0,
    total_prize DECIMAL(18,0) DEFAULT 0,
    first_seen DATETIME DEFAULT GETDATE(),
    last_seen DATETIME DEFAULT GETDATE()
);
GO

-- ============================================================
-- جدول نشان‌ها
-- ============================================================
CREATE TABLE badges (
    id INT IDENTITY(1,1) PRIMARY KEY,
    player_name NVARCHAR(200) NOT NULL,
    badge_name NVARCHAR(100),
    year INT,
    icon_url NVARCHAR(500),
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- ============================================================
-- جدول ثبت‌نام‌ها
-- ============================================================
CREATE TABLE registrations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    tournament_id INT NOT NULL,
    player_name NVARCHAR(200) NOT NULL,
    discord_id NVARCHAR(100),
    email NVARCHAR(200),
    minecraft_username NVARCHAR(100),
    registered_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_registrations_tournament FOREIGN KEY (tournament_id) 
        REFERENCES tournaments(id) ON DELETE CASCADE
);
GO

-- ============================================================
-- جدول سوالات
-- ============================================================
CREATE TABLE questions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    question NVARCHAR(500) NOT NULL,
    option_a NVARCHAR(300) NOT NULL,
    option_b NVARCHAR(300) NOT NULL,
    option_c NVARCHAR(300) NOT NULL,
    option_d NVARCHAR(300) NOT NULL,
    correct_answer NVARCHAR(1) NOT NULL
);
GO

-- ============================================================
-- جدول شرکت در کوییز
-- ============================================================
CREATE TABLE quiz_attempts (
    id INT IDENTITY(1,1) PRIMARY KEY,
    tournament_id INT NOT NULL,
    player_id INT NOT NULL,
    score INT DEFAULT 0,
    total_questions INT,
    is_winner BIT DEFAULT 0,
    started_at DATETIME DEFAULT GETDATE(),
    finished_at DATETIME,
    duration_seconds INT,
    CONSTRAINT FK_quiz_attempts_tournament FOREIGN KEY (tournament_id) 
        REFERENCES tournaments(id) ON DELETE CASCADE,
    CONSTRAINT FK_quiz_attempts_player FOREIGN KEY (player_id) 
        REFERENCES registrations(id)
);
GO

-- ============================================================
-- جدول پاسخ‌ها
-- ============================================================
CREATE TABLE quiz_answers (
    id INT IDENTITY(1,1) PRIMARY KEY,
    attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_answer NVARCHAR(1),
    is_correct BIT DEFAULT 0,
    answered_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_quiz_answers_attempt FOREIGN KEY (attempt_id) 
        REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    CONSTRAINT FK_quiz_answers_question FOREIGN KEY (question_id) 
        REFERENCES questions(id)
);
GO

-- ============================================================
-- درج مسابقات گذشته (۵ سال)
-- ============================================================
INSERT INTO tournaments (year, name, theme, prize_pool, status, winner_name) VALUES
(2022, N'Minecraft Cup 2022', N'Overworld Edition', 5000000, N'finished', N'Steve'),
(2023, N'Minecraft Cup 2023', N'Nether Edition', 7000000, N'finished', N'Alex'),
(2024, N'Minecraft Cup 2024', N'End Edition', 8000000, N'finished', N'Steve'),
(2025, N'Minecraft Cup 2025', N'Ocean Edition', 9000000, N'finished', N'Herobrine'),
(2026, N'Minecraft Cup 2026', N'Fire Edition', 10000000, N'open', NULL);
GO

-- ============================================================
-- درج بازیکنان (۱۰ نفر)
-- ============================================================
INSERT INTO players (player_name, minecraft_username, discord_id, email, total_wins, total_attempts, best_score, total_prize) VALUES
(N'Steve', N'Steve', N'steve#001', N'steve@example.com', 2, 5, 10, 13000000),
(N'Alex', N'Alex', N'alex#002', N'alex@example.com', 1, 5, 9, 7000000),
(N'Herobrine', N'Herobrine', N'hero#003', N'hero@example.com', 1, 5, 8, 9000000),
(N'Notch', N'Notch', N'notch#004', N'notch@example.com', 0, 4, 7, 0),
(N'Creeper', N'Creeper', N'creeper#005', N'creeper@example.com', 0, 4, 6, 0),
(N'Zombie', N'Zombie', N'zombie#006', N'zombie@example.com', 0, 3, 5, 0),
(N'Skeleton', N'Skeleton', N'skel#007', N'skel@example.com', 0, 3, 5, 0),
(N'Enderman', N'Enderman', N'ender#008', N'ender@example.com', 0, 3, 4, 0),
(N'Piglin', N'Piglin', N'piglin#009', N'piglin@example.com', 0, 2, 4, 0),
(N'Wither', N'Wither', N'wither#010', N'wither@example.com', 0, 2, 3, 0);
GO

-- ============================================================
-- درج برندگان هر سال
-- ============================================================
DECLARE @t2022 INT = (SELECT id FROM tournaments WHERE year = 2022);
DECLARE @t2023 INT = (SELECT id FROM tournaments WHERE year = 2023);
DECLARE @t2024 INT = (SELECT id FROM tournaments WHERE year = 2024);
DECLARE @t2025 INT = (SELECT id FROM tournaments WHERE year = 2025);

-- 2022
INSERT INTO winners (tournament_id, player_name, discord_id, rank, score) VALUES
(@t2022, N'Steve', N'steve#001', 1, 10),
(@t2022, N'Alex', N'alex#002', 2, 9),
(@t2022, N'Herobrine', N'hero#003', 3, 8);
GO

-- 2023
DECLARE @t2023_2 INT = (SELECT id FROM tournaments WHERE year = 2023);
INSERT INTO winners (tournament_id, player_name, discord_id, rank, score) VALUES
(@t2023_2, N'Alex', N'alex#002', 1, 10),
(@t2023_2, N'Herobrine', N'hero#003', 2, 9),
(@t2023_2, N'Steve', N'steve#001', 3, 8);
GO

-- 2024
DECLARE @t2024_2 INT = (SELECT id FROM tournaments WHERE year = 2024);
INSERT INTO winners (tournament_id, player_name, discord_id, rank, score) VALUES
(@t2024_2, N'Steve', N'steve#001', 1, 10),
(@t2024_2, N'Notch', N'notch#004', 2, 8),
(@t2024_2, N'Alex', N'alex#002', 3, 7);
GO

-- 2025
DECLARE @t2025_2 INT = (SELECT id FROM tournaments WHERE year = 2025);
INSERT INTO winners (tournament_id, player_name, discord_id, rank, score) VALUES
(@t2025_2, N'Herobrine', N'hero#003', 1, 9),
(@t2025_2, N'Creeper', N'creeper#005', 2, 8),
(@t2025_2, N'Steve', N'steve#001', 3, 8);
GO

-- ============================================================
-- درج ۵۰ سوال ماینکرفت
-- ============================================================
INSERT INTO questions (question, option_a, option_b, option_c, option_d, correct_answer) VALUES
(N'کدام آیتم برای ساخت پورتال نِدِر لازم است؟', N'کلنگ الماسی', N'فندک و سنگ چخماق', N'ردستون', N'سیب طلایی', N'b'),
(N'اندِرمن از چه چیزی ساخته شده است؟', N'اُبسیدیَن', N'سنگ اِند و مروارید اِندر', N'پشم سیاه', N'نِدِررَک', N'b'),
(N'کدام موجود در نِدِر زندگی می‌کند؟', N'زامبی', N'بلیز', N'اسکلتون', N'کریپر', N'b'),
(N'پیگلین با چه چیزی معامله می‌کند؟', N'زمرد', N'شمش طلا', N'الماس', N'نِدِرایت', N'b'),
(N'ویتر از چه چیزی ساخته می‌شود؟', N'شن روح و جمجمه ویتر', N'نِدِررَک', N'اُبسیدیَن', N'خاک روح', N'a'),
(N'اندِرمن وقتی به او نگاه کنی چه می‌کند؟', N'فرار می‌کند', N'حمله می‌کند', N'ناپدید می‌شود', N'منفجر می‌شود', N'b'),
(N'برای رفتن به اِند به چه چیزی نیاز داری؟', N'قاب پورتال اِند و چشم اِندر', N'پورتال نِدِر', N'اِلیترا', N'کریستال اِند', N'a'),
(N'اِندر دراگون چند جان دارد؟', N'صد', N'دویست', N'سیصد', N'پانصد', N'b'),
(N'اِلیترا کجا پیدا می‌شود؟', N'شهر اِند', N'قلعه نِدِر', N'بنای اقیانوس', N'عمارت جنگلی', N'a'),
(N'کدام بلوک در نِدِر بیشترین مقاومت را دارد؟', N'اُبسیدیَن', N'آشیانه باستانی', N'بلوک نِدِرایت', N'بِدراک', N'b'),
(N'کریپر وقتی نزدیک می‌شود چه می‌کند؟', N'فرار می‌کند', N'حمله فیزیکی', N'خودش را منفجر می‌کند', N'آتش می‌زند', N'c'),
(N'کدام موجود فقط در روز حمله می‌کند؟', N'زامبی', N'کریپر', N'فانتوم', N'عنکبوت', N'c'),
(N'زامبی در روز چه اتفاقی برایش می‌افتد؟', N'می‌میرد', N'آتش می‌گیرد', N'فرار می‌کند', N'قوی‌تر می‌شود', N'b'),
(N'کدام موجود با نگاه کردن به بازیکن آرام می‌شود؟', N'اندِرمن', N'کریپر', N'عنکبوت', N'اسکلتون', N'a'),
(N'اسکلتون با چه چیزی حمله می‌کند؟', N'شمشیر', N'کمان', N'گرز', N'نیزه', N'b'),
(N'عنکبوت چند چشم دارد؟', N'دو', N'چهار', N'شش', N'هشت', N'd'),
(N'کدام موجود می‌تواند به بازیکن زهر بزند؟', N'زامبی', N'عنکبوت غاری', N'اسکلتون', N'کریپر', N'b'),
(N'کدام موجود می‌تواند پرواز کند؟', N'خفاش', N'بلیز', N'فانتوم', N'همه موارد', N'd'),
(N'کدام موجود تخم می‌گذارد؟', N'مرغ', N'گاو', N'خوک', N'گوسفند', N'a'),
(N'برای ساخت پشم باید کدام موجود را بکشی؟', N'مرغ', N'گاو', N'گوسفند', N'خوک', N'c'),
(N'کدام موجود گوشت خوک می‌دهد؟', N'مرغ', N'گاو', N'خوک', N'گوسفند', N'c'),
(N'اسکلتون ویتر در کجا پیدا می‌شود؟', N'قلعه نِدِر', N'شهر اِند', N'دنیای معمولی', N'اقیانوس', N'a'),
(N'کدام موجود در آب زندگی می‌کند؟', N'ماهی مرکب', N'ماهی', N'دلفین', N'همه موارد', N'd'),
(N'حداکثر ارتفاع ساخت چقدر است؟', N'صد و بیست و هشت', N'دویست و پنجاه و شش', N'سیصد و بیست', N'پانصد و دوازده', N'c'),
(N'کدام بلوک برای میز جادو لازم است؟', N'بلوک الماس', N'اُبسیدیَن', N'بِدراک', N'طلا', N'b'),
(N'برای ساخت بیکن به چه چیزی نیاز داری؟', N'ستاره ویتر', N'الماس', N'مروارید اندر', N'شمش نِدِرایت', N'a'),
(N'مقاوم‌ترین بلوک کدام است؟', N'اُبسیدیَن', N'بِدراک', N'آشیانه باستانی', N'بلوک نِدِرایت', N'b'),
(N'الماس بیشتر در چه ارتفاعی پیدا می‌شود؟', N'ارتفاع پنج', N'ارتفاع دوازده', N'ارتفاع منفی پنجاه و نه', N'ارتفاع سی', N'c'),
(N'بهترین ابزار برای استخراج آشیانه باستانی چیست؟', N'کلنگ آهنی', N'کلنگ الماسی', N'کلنگ نِدِرایتی', N'کلنگ سنگی', N'b'),
(N'برای ساخت جعبه شولکر به چه چیزی نیاز داری؟', N'پوسته شولکر', N'مروارید اندر', N'صندوق', N'شمش آهن', N'a'),
(N'کدام آیتم برای ساخت مشعل لازم است؟', N'زغال و چوب', N'ردستون', N'الماس', N'آهن', N'a'),
(N'برای ساخت میز ساخت و ساز به چه چیزی نیاز داری؟', N'چهار تخته چوبی', N'دو کنده چوبی', N'شمش آهن', N'سنگ', N'a'),
(N'برای ساخت کوره به چه چیزی نیاز داری؟', N'هشت سنگفرش', N'هشت سنگ', N'هشت آهن', N'هشت زغال', N'a'),
(N'برای ساخت کیک به چه چیزی نیاز داری؟', N'گندم و شکر و تخم مرغ و شیر', N'آرد و شکر و تخم مرغ', N'نان و شکر و شیر', N'عسل و تخم مرغ', N'a'),
(N'بهترین غذا برای سلامتی کدام است؟', N'نان', N'گوشت پخته', N'سیب طلایی', N'سیب طلایی جادویی', N'd'),
(N'برای ساخت نان به چه چیزی نیاز داری؟', N'سه گندم', N'دو گندم', N'آرد', N'برنج', N'a'),
(N'کدام غذا بازیکن را سریع‌تر می‌کند؟', N'نان', N'مرغ پخته', N'شکر', N'هویج', N'c'),
(N'برای ساخت سیب طلایی به چه چیزی نیاز داری؟', N'سیب و هشت شمش طلا', N'سیب و هشت بلوک طلا', N'سیب و شکر', N'سیب و عسل', N'a'),
(N'کدام جادو برای بیل مفید است؟', N'لمس ابریشمی', N'کارایی', N'ثروت', N'همه موارد', N'b'),
(N'لمس ابریشمی چه کار می‌کند؟', N'سرعت را زیاد می‌کند', N'بلوک را دست‌نخورده می‌دهد', N'بازدهی را زیاد می‌کند', N'آتش می‌زند', N'b'),
(N'جادوی ثروت روی کلنگ چه می‌کند؟', N'سرعت بیشتر', N'شانس بیشتر افتادن آیتم', N'آتش', N'شکستن', N'b'),
(N'جادوی تیزی روی شمشیر چه می‌کند؟', N'سرعت بیشتر', N'آسیب بیشتر', N'دفاع', N'دوام', N'b'),
(N'جادوی نشکن روی ابزار چه می‌کند؟', N'دوام بیشتر', N'سرعت', N'آسیب', N'دفاع', N'a'),
(N'معجون نفس زیر آب چه مدت دوام می‌آورد؟', N'یک دقیقه', N'سه دقیقه', N'هشت دقیقه', N'نامحدود', N'c'),
(N'معجون درمان چه می‌کند؟', N'سلامتی می‌دهد', N'سرعت', N'قدرت', N'دفاع', N'a'),
(N'معجون قدرت چه می‌کند؟', N'سلامتی', N'قدرت بیشتر', N'سرعت', N'دفاع', N'b'),
(N'معجون سرعت چه می‌کند؟', N'سلامتی', N'قدرت', N'سرعت بیشتر', N'دفاع', N'c'),
(N'معجون دید در شب چه می‌کند؟', N'در تاریکی می‌بینی', N'سلامتی', N'سرعت', N'قدرت', N'a'),
(N'کدام بلوک برای ساخت پورتال نِدِر لازم است؟', N'اُبسیدیَن', N'بِدراک', N'نِدِررَک', N'سنگ اِند', N'a'),
(N'کدام آیتم برای کشتن اِندر دراگون لازم است؟', N'کمان و تیر', N'شمشیر الماسی', N'کریستال اِند', N'TNT', N'a');
GO

-- ============================================================
-- 📊 گزارش‌ها
-- ============================================================

-- 1. لیست همه مسابقات
SELECT '🏆 همه مسابقات' AS title;
SELECT 
    id AS [شناسه],
    year AS [سال],
    name AS [نام],
    theme AS [تم],
    prize_pool AS [جایزه],
    status AS [وضعیت],
    winner_name AS [برنده]
FROM tournaments
ORDER BY year DESC;
GO

-- 2. بازیکنان برتر (چند بار برنده شدن)
SELECT '🥇 بازیکنان برتر' AS title;
SELECT TOP 10
    player_name AS [بازیکن],
    minecraft_username AS [Minecraft],
    total_wins AS [تعداد برد],
    total_attempts AS [تعداد شرکت],
    best_score AS [بهترین نمره],
    FORMAT(total_prize, 'N0') AS [مجموع جایزه]
FROM players
ORDER BY total_wins DESC, best_score DESC;
GO

-- 3. برندگان هر سال
SELECT '🏅 برندگان هر سال' AS title;
SELECT 
    t.year AS [سال],
    t.name AS [مسابقه],
    w.player_name AS [برنده],
    w.rank AS [رتبه],
    w.score AS [نمره],
    t.prize_pool AS [جایزه کل]
FROM winners w
JOIN tournaments t ON t.id = w.tournament_id
WHERE w.rank = 1
ORDER BY t.year DESC;
GO

-- 4. تعداد برد هر بازیکن (گروهی)
SELECT '📊 آمار برد هر بازیکن' AS title;
SELECT 
    player_name AS [بازیکن],
    COUNT(*) AS [تعداد برد],
    MIN(year) AS [اولین برد],
    MAX(year) AS [آخرین برد]
FROM winners w
JOIN tournaments t ON t.id = w.tournament_id
WHERE w.rank = 1
GROUP BY player_name
ORDER BY COUNT(*) DESC;
GO

-- 5. خلاصه کل
SELECT '📈 خلاصه کل' AS title;
SELECT 
    (SELECT COUNT(*) FROM tournaments) AS [تعداد مسابقات],
    (SELECT COUNT(*) FROM players) AS [تعداد بازیکنان],
    (SELECT COUNT(*) FROM winners WHERE rank = 1) AS [تعداد برنده],
    (SELECT COUNT(*) FROM questions) AS [تعداد سوالات],
    (SELECT SUM(prize_pool) FROM tournaments) AS [مجموع جوایز];
GO

PRINT '✅ دیتابیس MinecraftAwards کامل ساخته شد!';
GO