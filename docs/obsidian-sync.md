# Obsidian のノートを AI チャットに使う

ノートはノート PC の Obsidian から、Self-hosted LiveSync で private-appserver（10.10.10.51）の CouchDB（`/opt/docker/obsidian`）に同期されている。
CouchDB の中のノートは細かく分けて保存され、E2EE で暗号化もされているので、そのままでは読めない。
そこで private-appserver で一度 Markdown のフォルダに書き出し、`obsidianignore` で除外されていないノートだけを public-appserver（10.10.10.52）へ rsync で送る。

```
ノート PC ──(Self-hosted LiveSync)──> private-appserver の CouchDB（/opt/docker/obsidian）
                                         │ ① livesync-bridge が暗号を解いて書き出す（CouchDB の変更は数秒で反映）
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

**進み具合（2026-10-16）:** 手順はすべてクラウド環境で動作を確かめた。サーバーではまだ何もしていない。

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

### アプリの設定（書き出しの準備ができてから）

この設定は、手順 2 で public-appserver にノートが届くようになってから行う。
`/opt/docker/my_portfolio/.env` に次の 1 行を足し、コンテナを作り直す。`docker-compose.yml` は編集しなくてよい。

```bash
echo 'OBSIDIAN_VAULT_DIR=/srv/portfolio-vault' >> /opt/docker/my_portfolio/.env
cd /opt/docker/my_portfolio && docker compose up -d
```

この 1 行が無いあいだは、バックエンドはノートを読まずに今まで通り動く。やめるときは、この行を消して `docker compose up -d` する。

## 2. private-appserver（送る側）

### 鍵を作る

```bash
apt install -y rsync
ssh-keygen -t ed25519 -N "" -f /root/.ssh/portfolio_sync -C portfolio-sync
cat /root/.ssh/portfolio_sync.pub     # これを手順 1 の authorized_keys に貼る
```

### ① CouchDB から Markdown に書き出す

Self-hosted LiveSync の作者が出している [livesync-bridge](https://github.com/vrtmrz/livesync-bridge) をコンテナで動かし、CouchDB のノートの暗号を解いて `/opt/docker/obsidian-export/vault` に Markdown として書き出す。
コンテナは動かしっぱなしにしておき、ノート PC で書いたノートは数秒でこのフォルダに反映される。ノートの削除も反映される。

**書き出し専用にしてある。** livesync-bridge は本来は双方向に同期するツールだが、下の設定の `"ignore": ["**"]` で、書き出したフォルダ側の変更は CouchDB に一切送らない。
このフォルダの中を書き換えたり消したりしても、Obsidian のノートは変わらない。

2026-10-16 にクラウド環境で次の組み合わせを動かして確かめた（livesync-bridge `fc0e028` / CouchDB 3.3 と 3.5 / Self-hosted LiveSync 1.0.36 の公式 CLI で作った E2EE のデータベース）。

- E2EE・パスの難読化（Obfuscate Properties）・ID キーがすべて有効なノートが、画像も含めて元と同じ中身で書き出される。ID キーの無い古い形式でも書き出される
- ノートの更新・追加・削除が数秒で反映される
- 書き出したフォルダでノートを書き換え・削除・追加してコンテナを再起動しても、CouchDB のドキュメント数も更新番号も変わらない
- 合言葉や ID キーが違うときは、エラーを出して何も書き出さない
- 書き出したフォルダに ② の `sync-obsidian.sh` をかけると、`obsidianignore` に当たるノートと画像が除かれる
- dice さんと同じ `/opt/docker/obsidian/docker-compose.yml`（CouchDB 3.3）で、下の手順どおりにつながる。CouchDB 側で `docker compose down` → `up -d` しても、livesync-bridge は自動でつなぎ直す

#### 1. Obsidian の設定から値を控える

ノート PC の Obsidian で、Self-hosted LiveSync の設定を開いて次を控える。画面の名前は Self-hosted LiveSync 1.0.36 の日本語表示のもの。

| 控えるもの | 場所 |
|---|---|
| ユーザー名・パスワード・データベース名 | リモートの CouchDB の設定。パスワードは表示されないので、クイックセットアップで入れたものを使う |
| 合言葉（Passphrase） | 「E2EE 設定」の「E2EE を設定」ボタンで開く画面 |
| ID キー（recovery code） | 同じ画面の **Show current recovery code**。`sls-id-v1:` で始まる文字列 |

- 「E2EE を設定」の画面が無い、または Show current recovery code が無いときは、ID キーは使っていない。`config.json` の `idDerivationKey` の行を消す
- ID キーが要るのに書いていないと、起動時に `Direct database document IDs do not match the configured ID key.` と出て止まる（何も書き出さない）。そのときに探せばよい
- `obfuscatePassphrase` には合言葉と同じものを書く。Obsidian 側の Obfuscate Properties が無効でも、このままで書き出せることを確かめた

#### 2. CouchDB への接続先

`/opt/docker/obsidian/docker-compose.yml` では CouchDB のサービス名が `couchdb` で、ネットワークの指定が無い。
そのため CouchDB は `obsidian_default` という名前のネットワークに入っている。livesync-bridge のコンテナもこのネットワークに入れて、`http://couchdb:5984` でつなぐ。
CouchDB のポートを外に出したり、`/opt/docker/obsidian` のファイルを書き換えたりする必要はない。

ネットワークの名前は、念のため次のコマンドで確かめる。`obsidian_default` と出ればよい。

```bash
docker network ls --filter name=obsidian
```

#### 3. livesync-bridge を置く

livesync-bridge のイメージは配布されていないので、確かめたバージョン（`fc0e028`）のソースを取ってきて手元でビルドする。

```bash
mkdir -p /opt/docker/obsidian-export/vault
cd /opt/docker/obsidian-export
git clone https://github.com/vrtmrz/livesync-bridge.git
git -C livesync-bridge -c advice.detachedHead=false checkout fc0e028d33b3a12ddee1322951375e05107edc55
chown 1993:1993 vault        # コンテナの中の deno ユーザー（UID 1993）が書き込めるようにする
```

#### 4. 設定ファイルを書く

`/opt/docker/obsidian-export/config.json` を作り、1 で控えた値を入れる。

```json
{
  "peers": [
    {
      "type": "couchdb",
      "name": "obsidian-couchdb",
      "url": "http://couchdb:5984",
      "database": "（データベース名）",
      "username": "（ユーザー名）",
      "password": "（パスワード）",
      "passphrase": "（合言葉）",
      "obfuscatePassphrase": "（合言葉と同じもの）",
      "idDerivationKey": "（sls-id-v1: で始まる ID キー。使っていなければこの行ごと消す）",
      "baseDir": "",
      "useRemoteTweaks": true
    },
    {
      "type": "storage",
      "name": "export",
      "baseDir": "./data/vault/",
      "scanOfflineChanges": false,
      "ignore": ["**"]
    }
  ]
}
```

`（…）` の部分は、かっこごと実際の値に置き換える。パスワードと合言葉が入るので、root とコンテナ以外は読めないようにする。

```bash
chown root:1993 /opt/docker/obsidian-export/config.json
chmod 640 /opt/docker/obsidian-export/config.json
```

#### 5. 起動する

`/opt/docker/obsidian-export/docker-compose.yml` を作る。

```yaml
name: obsidian-export
services:
  bridge:
    build: ./livesync-bridge
    image: localhost/livesync-bridge:fc0e028
    volumes:
      - ./config.json:/app/dat/config.json:ro
      - ./vault:/app/data/vault
      - bridge_state:/deno-dir/location_data   # どこまで書き出したかの記録
    networks:
      - obsidian
    restart: unless-stopped
volumes:
  bridge_state:
networks:
  obsidian:
    external: true
    name: obsidian_default   # /opt/docker/obsidian の CouchDB が入っているネットワーク
```

```bash
cd /opt/docker/obsidian-export
docker compose up -d --build
docker compose logs -f bridge     # 「<-- data/vault/〜 saved」が並べば書き出せている（Ctrl+C で抜ける）
find vault -type f | head
```

うまくいかないときのログ:

- `Direct database document IDs do not match the configured ID key.` → ID キーが違う（または要るのに書いていない）
- `decrypt` を含む長いエラー → 合言葉が違う
- `CouchDB connect attempt N failed` が続く → `url`・ユーザー名・パスワード・データベース名のどれかが違う

どの場合も、書き出しも CouchDB への書き込みも行われない。

`/opt/docker/obsidian` で `docker compose down` すると `Network obsidian_default Resource is still in use` と出るが、livesync-bridge が同じネットワークを使っているためで問題ない（CouchDB はちゃんと止まる）。`config.json` を直して `docker compose restart` する。

書き出したフォルダを一度空にして最初から書き出し直したいときは、記録ごと消して起動し直す。

```bash
cd /opt/docker/obsidian-export
docker compose down -v
rm -rf /opt/docker/obsidian-export/vault && mkdir /opt/docker/obsidian-export/vault && chown 1993:1993 /opt/docker/obsidian-export/vault
docker compose up -d
```

### ② 送るスクリプトを置く

このリポジトリは clone せず、スクリプト 1 本だけを置く。

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

## サーバーに増えるものと消し方

この手順で増えるのは次のものだけ。ほかのファイルや、既存の `/opt/docker/obsidian` の CouchDB には手を入れない（livesync-bridge は CouchDB を読むだけ）。

### public-appserver（10.10.10.52）

| 増えるもの | 消し方 |
|---|---|
| `/opt/docker/my_portfolio/.env` の `OBSIDIAN_VAULT_DIR=` の 1 行 | 行を消して `cd /opt/docker/my_portfolio && docker compose up -d` |
| `portfolio-sync` ユーザーと `/home/portfolio-sync`（`authorized_keys` を含む） | `userdel -r portfolio-sync` |
| `/srv/portfolio-vault`（送られてきたノート） | `rm -rf /srv/portfolio-vault` |
| rsync のパッケージ | ほかで使っていなければ `apt remove rsync` |

### private-appserver（10.10.10.51）

| 増えるもの | 消し方 |
|---|---|
| cron の 1 行 | `crontab -e` で `sync-obsidian.sh` の行を消す |
| livesync-bridge のコンテナ・記録用のボリューム・イメージ | `cd /opt/docker/obsidian-export && docker compose down -v --rmi all` |
| `/opt/docker/obsidian-export`（livesync-bridge のソース、`config.json`、`docker-compose.yml`、書き出した `vault`、`sync-obsidian.sh`） | 上のコンテナを消してから `rm -rf /opt/docker/obsidian-export` |
| ビルドの土台に使う Docker イメージ `denoland/deno:2.9.7` | ほかで使っていなければ `docker image rm denoland/deno:2.9.7` |
| 送る用の SSH 鍵 `/root/.ssh/portfolio_sync` と `.pub` | `rm /root/.ssh/portfolio_sync /root/.ssh/portfolio_sync.pub` |
| ログ `/var/log/sync-obsidian.log` | `rm /var/log/sync-obsidian.log` |
| 確認用のコピー `/tmp/vault-preview` | `rm -rf /tmp/vault-preview` |
| rsync のパッケージ | ほかで使っていなければ `apt remove rsync` |

全部消すときは、先に private-appserver の cron の行を消してから、表の上から順に消す。
