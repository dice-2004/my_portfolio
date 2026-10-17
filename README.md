# dice のポートフォリオ

https://portfolio.dice-ke.tech/

作品・経歴・スキルを読みやすく並べたページと、右からスライドして出てくる CLI 風のチャットパネルでできたポートフォリオサイトです。自宅の N100 ミニ PC で動かし、Cloudflare Tunnel で公開しています。

## できること

### 作品・経歴のページ
- トップに自己紹介・作品・経歴・スキル・連絡先を 1 ページで並べ、作品ごとに詳細ページがあります。
- 上のメニューから各セクションへなめらかにスクロールします。

### CLI パネル
- 上のメニューの「>_ ask」や自己紹介の下の「>_ dice に質問する」を押すと、Claude Code 風のターミナルが右から出てきます（スマホでは全画面）。
- `/help` `/whoami` `/works` `/open <番号>` `/awards` `/skills` `/clear` `/exit` のスラッシュコマンドは、サーバーに問い合わせずにその場で答えます。`/` を打つと候補が出て、Tab で補完できます。
- パネルの左端をドラッグすると幅を変えられます（PC のみ）。

### AI チャット（Gemini による RAG）
- `/` で始まらない入力は AI への質問になり、サイトの内容と Obsidian のノートをもとに Gemini Flash Lite が答えます。回答の最後に、参照した資料を示します。
- Obsidian のノートは Gemini Embedding でベクトルにして SQLite に保存し、質問に近いものだけを渡します。埋め込みはノートが変わったときだけ作り直します。
- Gemini API の無料枠だけで動かすため、回答は 1 日 400 回、IP ごとに 1 分 5 回・1 日 30 回までにしています。API キーはバックエンドだけが持ち、ブラウザには出しません。
- Vault の `obsidianignore` に書いたフォルダやノートは読み込みません。除外リストが見つからないときは、安全のため Vault 全体を読みません（[docs/obsidian-sync.md](./docs/obsidian-sync.md)）。

### ファイルで管理するコンテンツ
- 作品・経歴・スキル・自己紹介は `backend/seeds/` の Markdown / JSON が正本です。管理画面やログインはありません。
- バックエンドが 30 秒ごとにファイルの変更を確かめて DB に反映するので、`git pull` するだけでサイトが更新されます。
- サイトには出さないが AI に答えさせたい補足は `backend/seeds/knowledge/` に Markdown で置けます。

## 技術スタック

| 分類 | 使っているもの |
|------|----------------|
| フロントエンド | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, react-markdown |
| バックエンド | Go (Gin) の読み取り専用 REST API |
| データベース | SQLite（`modernc.org/sqlite`、CGO 不要） |
| AI | Gemini API（回答: Gemini Flash Lite、埋め込み: Gemini Embedding） |
| インフラ | Docker Compose, Cloudflare Tunnel, N100 ミニ PC（Proxmox の LXC） |

## 手元で動かす

Docker と Docker Compose が必要です。

```bash
git clone https://github.com/dice-2004/my_portfolio.git
cd my_portfolio
cp .env.example .env   # AI チャットを使うときは GEMINI_API_KEY を書く（空ならコマンドだけ動く）
docker compose up -d
```

- フロントエンド: http://localhost:3031
- バックエンド API: http://localhost:8031

コンテナを使わずに確かめるときのコマンド（lint・型チェック・テスト）は [AGENTS.md](./AGENTS.md) にまとめています。

## 本番での更新

本番は LXC `public-appserver` の `/opt/docker/my_portfolio` で動いています。

- コンテンツ（`backend/seeds/`）だけの変更: `git pull` すれば 30 秒以内に反映されます。
- コードの変更: `git pull` のあと `docker compose restart frontend` でフロントエンドを作り直します（バックエンドは air が変更を見て自動で再ビルドします）。Dockerfile や `docker-compose.yml` を変えたときは `docker compose up -d --build` を使います。

## ドキュメント

- [docs/CHANGELOG.md](./docs/CHANGELOG.md): 作業ログと残りのタスク
- [docs/obsidian-sync.md](./docs/obsidian-sync.md): Obsidian のノートを AI チャットに使う手順
- [docs/archive/](./docs/archive/): 初期の設計書（今の方針とは違う部分があります）
