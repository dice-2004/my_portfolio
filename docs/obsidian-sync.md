# Obsidian のノートを AI チャットに使う

ノートはノート PC の Obsidian から、Self-hosted LiveSync で private-appserver（10.10.10.51）の CouchDB（`/opt/docker/obsidian`）に同期されている。
CouchDB の中のノートは細かく分けて保存され、E2EE で暗号化もされているので、そのままでは読めない。
そこで private-appserver で一度 Markdown のフォルダに書き出し、`obsidianignore` で除外されていないノートだけを public-appserver（10.10.10.52）へ rsync で送る。

```
ノート PC ──(Self-hosted LiveSync)──> private-appserver の CouchDB（/opt/docker/obsidian）
                                         │ ① 書き出し（準備中）
                                         ▼
                           private-appserver の /opt/docker/obsidian-export/vault（Markdown）
                                         │ ② sync-obsidian.sh（cron で 10 分ごと）
                                         │   obsidianignore に当たるパスと .obsidian などは送らない
                                         ▼
                           public-appserver の /srv/portfolio-vault
                                         │ docker compose で /vault に読み取り専用でマウント
                                         ▼
                           バックエンドが 30 秒ごとに読み、変わったノートだけ埋め込みを作る
```

どちらのサーバーも Ubuntu 24.04 で、作業はすべて root で行う。下のコマンドもそのまま root で実行する。
`portfolio-sync` ユーザーには root の権限を与えない。

## 1. public-appserver（受け取る側）

送られてくるだけの専用ユーザーを作り、そのユーザーは `/srv/portfolio-vault` への rsync しかできないようにする。

```bash
useradd --system --create-home --shell /bin/sh portfolio-sync
mkdir -p /srv/portfolio-vault
chown portfolio-sync: /srv/portfolio-vault
apt install -y rsync          # rrsync も一緒に入る
```

手順 2 で作る公開鍵を、`portfolio-sync` の `authorized_keys` に 1 行で書く。
`command=` と `restrict` で、この鍵ではシェルも転送もできず、決めたフォルダへの rsync だけになる。

```
command="rrsync /srv/portfolio-vault",restrict ssh-ed25519 AAAA...（手順 2 で表示される公開鍵） portfolio-sync
```

ファイルの持ち主は `portfolio-sync` にして、本人以外が書き換えられないようにする（SSH はそうでないと鍵を使わない）。

```bash
runuser -u portfolio-sync -- mkdir -p -m 700 /home/portfolio-sync/.ssh
runuser -u portfolio-sync -- nano /home/portfolio-sync/.ssh/authorized_keys   # 上の 1 行を貼る
chmod 600 /home/portfolio-sync/.ssh/authorized_keys
```

`/opt/docker/my_portfolio/.env` に追記して、`/opt/docker/my_portfolio/docker-compose.yml` の backend の volumes にある Vault の行のコメントを外す。

```bash
# .env
OBSIDIAN_VAULT_IN_CONTAINER=/vault
```

```yaml
# docker-compose.yml（backend の volumes）
      - /srv/portfolio-vault:/vault:ro
```

`/srv/portfolio-vault` が空のうち（除外リストがまだ届いていないうち）は、バックエンドはノートを読まずに今まで通り動く。

## 2. private-appserver（送る側）

### 鍵を作る

```bash
apt install -y rsync
ssh-keygen -t ed25519 -N "" -f /root/.ssh/portfolio_sync -C portfolio-sync
cat /root/.ssh/portfolio_sync.pub     # これを手順 1 の authorized_keys に貼る
```

### ① CouchDB から Markdown に書き出す（準備中）

この手順はまだ動作を確かめていないので、書いていない。書き出し先は `/opt/docker/obsidian-export/vault` にする予定。

### ② 送るスクリプトを置く

リポジトリは clone せず、スクリプト 1 本だけを置く（main にスクリプトが入ってから。それまでは URL の `main` を `claude/project-thread-wqqjji` にする）。

```bash
mkdir -p /opt/docker/obsidian-export
curl -fsSL -o /opt/docker/obsidian-export/sync-obsidian.sh \
  https://raw.githubusercontent.com/dice-2004/my_portfolio/main/scripts/sync-obsidian.sh
chmod +x /opt/docker/obsidian-export/sync-obsidian.sh
```

まずは送り先を手元のフォルダにして、何が送られるかを確かめる。

```bash
VAULT=/opt/docker/obsidian-export/vault DEST=/tmp/vault-preview /opt/docker/obsidian-export/sync-obsidian.sh
find /tmp/vault-preview -type f | less    # 非公開のノートが入っていないこと
```

問題なければ public-appserver へ送る。rrsync を使うので、送り先のパスは `:` だけでよい。

```bash
VAULT=/opt/docker/obsidian-export/vault DEST=portfolio-sync@10.10.10.52: \
RSYNC_SSH="ssh -i /root/.ssh/portfolio_sync" /opt/docker/obsidian-export/sync-obsidian.sh
```

cron に登録する（`crontab -e`）。

```
*/10 * * * * VAULT=/opt/docker/obsidian-export/vault DEST=portfolio-sync@10.10.10.52: RSYNC_SSH="ssh -i /root/.ssh/portfolio_sync" /opt/docker/obsidian-export/sync-obsidian.sh >>/var/log/sync-obsidian.log 2>&1
```

## 除外リストの書き方

`.gitignore` と同じく、Vault 内のどのフォルダにも `obsidianignore` を置ける。Obsidian でノートとして作った `obsidianignore.md` でもよい。書いたパスは、そのファイルを置いたフォルダから数える。

例: `assets/obsidianignore.md`

```
# 説明やメモは # で始める（Obsidian の見出しもそのまま使える）
/音声文字起こし
/templates
```

これで `assets/音声文字起こし` と `assets/templates` が除外される。`assets` の外（例えば Vault 直下の `daily_note`）を除外したいときは、Vault 直下にも `obsidianignore` を置いてそこに書く。

- 先頭の `/` は、そのファイルを置いたフォルダの直下だけ。`/templates` は `assets/templates` に当たり、`assets/x/templates` には当たらない
- 先頭に `/` を付けない名前だけの行（`templates/`）は、そのフォルダの中ならどの階層にあっても当たる
- 途中に `/` を含む行（`a/b`）は、先頭に `/` があるのと同じ扱い
- 末尾の `/` はあっても無くてもよい。`*` `?` `**` が使える（例: `**/private*`）
- `#` で始まらない文章の行や、`- /templates` のような箇条書きはパターンとして読まれ、何にも当たらない。パスは 1 行に 1 つそのまま書く
- 除外リストのノート自体は AI の材料にしない
- 除外リストが Vault に 1 つも無いときは、何も送らず、バックエンドも Vault を読まない

## 送られるもの・送られないもの

- 送る: `.md` ファイルと、除外リスト（`obsidianignore` / `obsidianignore.md`）そのもの
- 送らない: `obsidianignore` に当たるパス、`.obsidian` `.trash` などの `.` で始まるもの、画像などの `.md` 以外
- Vault からノートを消したり、除外リストに足したりすると、次の同期で public 側からも消える（`--delete --delete-excluded`）
- 除外リストが見つからないときは何も送らない。バックエンドも、除外リストが無い Vault は読まない
- `!` で始まる行（除外の取り消し）には対応していない。その行は無視され、除外されたままになる

## うまくいっているかの確かめ方

- public 側: `docker compose logs backend | grep 埋め込み` で「AI 用の埋め込みを N 件作りました」が出る
- 無料枠を守るため、埋め込みは 30 秒ごとに約 1.2 万文字ずつ作る。ノートが多いと、全部そろうまで時間がかかる（例: 100 万文字なら約 40 分）
- パネルでノートの内容について質問する。Obsidian のノートは非公開なので、回答の下の参照リンクには出ない
