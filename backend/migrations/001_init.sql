CREATE TABLE IF NOT EXISTS works (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    github_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO works (id, title, description, image_url, github_url) VALUES (1, 'Dice Portfolio', 'Next.js と Go で構築中のモダンなポートフォリオ', '/no-image.png', 'https://github.com/dice/portfolio');

CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    proficiency INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO skills (id, name, category, proficiency) VALUES (1, 'Go', 'Backend', 80);

CREATE TABLE IF NOT EXISTS about (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO about (id, content) VALUES (1, 'こんにちは、ダイスです。Next.jsとGoで構築中のモダンなポートフォリオです。');

CREATE TABLE IF NOT EXISTS timeline (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    event_date TEXT NOT NULL,
    category TEXT NOT NULL,
    display_order INTEGER NOT NULL

);

INSERT OR IGNORE INTO timeline (id, title, description, event_date, category, display_order) VALUES (1, 'Dice Portfolio', 'Next.js と Go で構築中のモダンなポートフォリオ', '2022-01-01', 'Work', 1);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    public_key TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth_challenges (
    challenge TEXT PRIMARY KEY, -- 挑戦状の文字列自体をIDにすると便利です
    expires_at DATETIME NOT NULL
);
