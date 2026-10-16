#!/usr/bin/env bash
# Obsidian の Vault から、obsidianignore で除外されていない .md だけを
# 公開サーバー（public-appserver）へ rsync で送る。private-appserver の cron で動かす。
#
# 使い方:
#   VAULT=/path/to/vault DEST=portfolio-sync@10.10.10.52:/srv/portfolio-vault ./sync-obsidian.sh
#   （DEST をローカルのパスにすると、送らずに手元へコピーして中身を確かめられる）
#
# 除外リストは Vault の assets/obsidianignore（無ければ Vault 直下の obsidianignore）。
# Obsidian でノートとして書けるよう、どちらも .md 付きでもよい。
# 書き方は .gitignore と同じ（先頭 / は Vault 直下、末尾 / はフォルダ、* ? ** が使える）。
# 否定（! で始まる行）は、バックエンドと同じく無視する（＝除外されたまま。安全側）。
# 除外リストが見つからないときは何も送らずに終わる。
set -euo pipefail

: "${VAULT:?VAULT に Vault のパスを指定してください}"
: "${DEST:?DEST に送り先（例: user@10.10.10.52:/srv/portfolio-vault）を指定してください}"
VAULT="${VAULT%/}"

ignore=""
for f in "$VAULT/assets/obsidianignore" "$VAULT/assets/obsidianignore.md" "$VAULT/obsidianignore" "$VAULT/obsidianignore.md"; do
  if [[ -f "$f" ]]; then ignore="$f"; break; fi
done
if [[ -z "$ignore" ]]; then
  echo "obsidianignore が見つからないので送りません（$VAULT/assets/obsidianignore(.md) か $VAULT/obsidianignore(.md) を置いてください）" >&2
  exit 1
fi

filters="$(mktemp)"
trap 'rm -f "$filters"' EXIT

rel_ignore="${ignore#"$VAULT/"}"
{
  echo '- .*'                    # .obsidian / .trash / 隠しファイル
  # 除外リスト自体も送る（バックエンドはこれが無いと Vault を読まない）
  if [[ "$rel_ignore" == */* ]]; then echo "+ /${rel_ignore%%/*}/"; fi
  echo "+ /$rel_ignore"
} >"$filters"

# obsidianignore を rsync の除外ルールに変換する。
# .gitignore では途中に / を含むパターンも Vault 直下からの位置になるので、先頭に / を付けてそろえる。
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%$'\r'}"
  line="$(sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' <<<"$line")"
  [[ -z "$line" || "$line" == \#* || "$line" == \!* ]] && continue
  body="${line%/}"
  if [[ "$line" != /* && "${body}" == */* ]]; then
    line="/$line"
  fi
  printf -- '- %s\n' "$line"
  # .gitignore の a/**/b は a/b にも当たるが、rsync の ** は 1 階層以上が要るので、0 階層の形も足す
  if [[ "$line" == *'**/'* ]]; then
    printf -- '- %s\n' "${line//\*\*\//}"
  fi
done <"$ignore" >>"$filters"

{
  echo '+ */'
  echo '+ *.md'
  echo '- *'
} >>"$filters"

rsync -a --delete --delete-excluded --prune-empty-dirs \
  --filter="merge $filters" \
  ${RSYNC_SSH:+-e "$RSYNC_SSH"} \
  "$VAULT/" "$DEST/"
