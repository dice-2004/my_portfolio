CREATE TABLE IF NOT EXISTS works (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    github_url TEXT,
    period TEXT,
    team TEXT,
    tech TEXT,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    proficiency INTEGER NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS about (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS timeline (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    event_date TEXT NOT NULL,
    category TEXT NOT NULL,
    display_order INTEGER NOT NULL

);


-- seeds/ の各ファイルの SHA-256。変わったときだけテーブルを入れ替えるために使う
CREATE TABLE IF NOT EXISTS content_meta (
    file TEXT PRIMARY KEY,
    hash TEXT NOT NULL
);

-- 管理画面と一緒に廃止したテーブル
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS auth_challenges;

-- AI チャット用。資料のチャンクと Gemini の埋め込み（float32 のリトルエンディアン）
CREATE TABLE IF NOT EXISTS chunks (
    hash TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    body TEXT NOT NULL,
    embedding BLOB NOT NULL
);
