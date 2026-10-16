#!/usr/bin/env bash
# Obsidian の Vault から、obsidianignore で除外されていない .md だけを
# 公開サーバー（public-appserver）へ rsync で送る。private-appserver の cron で動かす。
#
# 使い方:
#   VAULT=/path/to/vault DEST=portfolio-sync@10.10.10.52:/srv/portfolio-vault ./sync-obsidian.sh
#   （DEST をローカルのパスにすると、送らずに手元へコピーして中身を確かめられる）
#
# 除外リストは Vault 内の obsidianignore（Obsidian で作った obsidianignore.md でもよい）。
# .gitignore と同じく、どのフォルダに置いてもよく、書いたパスはそのフォルダから数える
# （先頭 / はそのフォルダ直下、末尾 / はフォルダ、* ? ** が使える）。
# 否定（! で始まる行）は、バックエンドと同じく無視する（＝除外されたまま。安全側）。
# 除外リストが 1 つも見つからないときは何も送らずに終わる。
set -euo pipefail

: "${VAULT:?VAULT に Vault のパスを指定してください}"
: "${DEST:?DEST に送り先（例: user@10.10.10.52:/srv/portfolio-vault）を指定してください}"
VAULT="${VAULT%/}"

# . で始まるフォルダ（.obsidian / .trash）の中は見ない。バックエンドと同じ
mapfile -t ignores < <(cd "$VAULT" && find . -name '.?*' -prune -o -type f \( -name obsidianignore -o -name obsidianignore.md \) -print | sed 's|^\./||' | LC_ALL=C sort)
if [[ ${#ignores[@]} -eq 0 ]]; then
  echo "obsidianignore（または obsidianignore.md）が $VAULT に見つからないので送りません" >&2
  exit 1
fi

filters="$(mktemp)"
trap 'rm -f "$filters"' EXIT

emit() {
  printf -- '- %s\n' "$1"
  # .gitignore の a/**/b は a/b にも当たるが、rsync の ** は 1 階層以上が要るので、0 階層の形も足す
  if [[ "$1" == *'**/'* ]]; then
    printf -- '- %s\n' "${1//\*\*\//}"
  fi
}

echo '- .*' >"$filters"   # .obsidian / .trash / 隠しファイル

# 各 obsidianignore を rsync の除外ルールに変換する。パスはそのファイルを置いたフォルダから数える。
# .gitignore では途中に / を含むパターンもそのフォルダ直下からの位置になるので、先頭に / を付けてそろえる。
for rel in "${ignores[@]}"; do
  base="$(dirname "$rel")"
  [[ "$base" == "." ]] && base="" || base="/$base"
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    line="$(sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' <<<"$line")"
    [[ -z "$line" || "$line" == \#* || "$line" == \!* ]] && continue
    body="${line%/}"
    if [[ "$line" == /* || "$body" == */* ]]; then
      emit "$base/${line#/}"
    elif [[ -z "$base" ]]; then
      emit "$line"            # Vault 直下の名前だけの行は、どの階層にも当たる
    else
      emit "$base/$line"      # そのフォルダの中のどの階層にも当たる
      emit "$base/**/$line"
    fi
  done <"$VAULT/$rel"
done >>"$filters"

{
  # 除外リスト自体も送る（バックエンドはこれが無いと Vault を読まない）。除外されたフォルダの中のものは送らない
  for rel in "${ignores[@]}"; do echo "+ /$rel"; done
  echo '+ */'
  echo '+ *.md'
  echo '- *'
} >>"$filters"

rsync -a --delete --delete-excluded --prune-empty-dirs \
  --filter="merge $filters" \
  ${RSYNC_SSH:+-e "$RSYNC_SSH"} \
  "$VAULT/" "$DEST/"
