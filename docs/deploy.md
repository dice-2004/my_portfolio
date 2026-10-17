# 本番の起動と更新

public-appserver（10.10.10.52）の `/opt/docker/my_portfolio` で、root で動かす前提です。
Cloudflare Tunnel はこれまでどおり frontend の 3031 番につなぎます（ポートは変わっていません）。

## 2 つの compose ファイル

| ファイル | 使う場所 | 中身 |
|------|------|------|
| `docker-compose.yml` | 本番（public-appserver） | イメージを作るときに 1 回だけ `next build` と `go build` をして、起動時はビルド済みのものを動かす |
| `docker-compose.dev.yml` | 手元での開発 | ソースをマウントして、保存するたびに自動で作り直す（`npm run dev` と air） |

以前は本番でも、frontend がコンテナを起動するたびに `npm install && npm run build` をしていて、backend は開発用の air で動いていました。

## 更新のしかた

```bash
cd /opt/docker/my_portfolio
git pull
docker compose up -d --build
```

- 作品・経歴・スキル・自己紹介（`backend/seeds/`）だけの変更なら、`git pull` だけで 30 秒以内に反映されます。`--build` は要りません。
- コード（`frontend/`、`backend/` の Go、`docker/`）が変わったときは `docker compose up -d --build` で作り直します。N100 では初回は数分かかり、2 回目からは変わった部分だけを作り直します。
- 作り直しのあいだも古いコンテナは動き続け、入れ替えは数秒です。
- `restart: unless-stopped` を付けたので、サーバーを再起動してもコンテナは自動で上がります。

## データの置き場所

- DB は `backend/data/portfolio.db`（以前と同じ場所）。AI チャット用の埋め込みもここに入っているので、消すと作り直しで Gemini の無料枠を使います。
- Obsidian のノートは今までどおり `.env` の `OBSIDIAN_VAULT_DIR`（手順は [obsidian-sync.md](obsidian-sync.md)）。

## 開発用で動かすとき（手元のマシン）

```bash
docker compose -f docker-compose.dev.yml up
```

frontend: http://localhost:3031 / backend: http://localhost:8031。本番用とコンテナ名が同じなので、同じマシンで両方を同時には動かせません。

## 困ったとき

- 古いコードに戻す: `git checkout <コミット>` してから `docker compose up -d --build`。
- 使わなくなった古いイメージを消す: `docker image prune`（動いているコンテナのイメージは消えません）。
