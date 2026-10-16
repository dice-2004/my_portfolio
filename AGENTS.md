# AGENTS.md

AIエージェント（Claude Code など）と人間の開発者向けの、このリポジトリの作業ガイドです。

## 構成

| パス | 内容 |
|------|------|
| `frontend/` | Next.js 16 (App Router) + React 19 + Tailwind CSS 4。`frontend/AGENTS.md` も読むこと（Next.js 16 の注意点） |
| `backend/` | Go (Gin) の読み取り専用 REST API。SQLite (`modernc.org/sqlite`, CGO 不要) |
| `backend/migrations/` | 起動時に実行される SQL |
| `backend/seeds/` | 作品・スキル・経歴・自己紹介の正本。起動時と 30 秒ごとに中身を確かめ、変わったファイルだけ DB に反映する（`internal/repository/content.go`） |
| `backend/internal/ai/` | AI チャット。Gemini API クライアント、資料のチャンク分割、埋め込みの保存と検索（SQLite の `chunks`）、回答の生成 |
| `backend/seeds/knowledge/` | （任意）サイトには出さないが AI チャットに答えさせたい補足の Markdown |
| `scripts/sync-obsidian.sh` | private-appserver の Vault から、obsidianignore で除外されていないノートだけを public-appserver へ rsync する（手順は `docs/obsidian-sync.md`） |
| `docker/`, `docker-compose.yml` | 本番（N100 + Cloudflare Tunnel）と同じ構成のコンテナ |
| `docs/archive/` | 初期の設計書。現在の方針とは異なる部分があるので参考程度に |

## コマンド

```bash
# フロントエンド
cd frontend
npm ci
npm run lint          # ESLint（error は CI で落ちる）
npx tsc --noEmit      # 型チェック
npm run build         # 本番ビルド（バックエンドが無くてもビルドは通る）

# バックエンド
cd backend
go vet ./...
go build ./...
go test ./...

# 全体をコンテナで起動
docker compose up -d   # frontend: http://localhost:3031 / backend: http://localhost:8031
```

push 前に上のチェックを通すこと。同じ内容が `.github/workflows/ci.yml` で PR ごとに走ります。

## 方針（2026-10 時点の決定事項）

- **管理画面と認証は持たない。** コンテンツはファイルで管理し、Obsidian や git push で更新する。書き込み系の API を追加しないこと。
- **AI チャット**は Gemini API の無料枠のみを使う（回答: Gemini Flash Lite、埋め込み: Gemini Embedding）。API キーはバックエンドの環境変数だけで持ち、フロントに出さない。
- Obsidian のノートは、Vault 内の `obsidianignore`（`.md` 付きでも可。.gitignore と同じく置いたフォルダから数える）に書かれたパスを除外して取り込む（`OBSIDIAN_VAULT`）。除外リストが読めないときは Vault を読まない。
- 無料枠を守るため、埋め込みはコンテンツが変わったときだけ少しずつ作る。質問 1 回で使うのは埋め込み 1 回と回答 1 回。回答は 1 日 400 回（`CHAT_DAILY_LIMIT`）、IP ごとに 1 分 5 回・1 日 30 回まで。
- デザインは「読みやすい作品・経歴ページ + 右からスライドして出る CLI 風チャットパネル」。
- `main` は常に本番デプロイできる状態を保つ。変更はブランチと PR で行う。

## 書き方

- UI の文言は日本語。飾りだけの英語ラベルや、意味のない 8〜10px の文字は増やさない。
- 文字色は背景とのコントラスト比 4.5:1 以上。
- 秘密情報（API キー、トークン、秘密鍵）をコミットしない。`.env*` は gitignore 済み。
