# AGENTS.md

AIエージェント（Claude Code など）と人間の開発者向けの、このリポジトリの作業ガイドです。

## 構成

| パス | 内容 |
|------|------|
| `frontend/` | Next.js 16 (App Router) + React 19 + Tailwind CSS 4。`frontend/AGENTS.md` も読むこと（Next.js 16 の注意点） |
| `backend/` | Go (Gin) の読み取り専用 REST API。SQLite (`modernc.org/sqlite`, CGO 不要) |
| `backend/migrations/` | 起動時に実行される SQL |
| `backend/seeds/` | 作品・スキル・経歴・自己紹介の元データ。DB が空のときに読み込まれる |
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
- Obsidian のノートは、Vault 内の `obsidianignore` に書かれたパスを除外して取り込む。
- デザインは「読みやすい作品・経歴ページ + 右からスライドして出る CLI 風チャットパネル」。
- `main` は常に本番デプロイできる状態を保つ。変更はブランチと PR で行う。

## 書き方

- UI の文言は日本語。飾りだけの英語ラベルや、意味のない 8〜10px の文字は増やさない。
- 文字色は背景とのコントラスト比 4.5:1 以上。
- 秘密情報（API キー、トークン、秘密鍵）をコミットしない。`.env*` は gitignore 済み。
