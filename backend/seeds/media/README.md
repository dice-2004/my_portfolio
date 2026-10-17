# 作品の画像・動画

ここに置いたファイルは `/api/media/<ファイル名>` で配信され、`../works_unified.md` の「画像」「動画」の欄から使えます。git pull するだけで反映され、再起動はいりません。

- 作品ごとにフォルダを分けると整理しやすいです（例: `oton-zzz/1.png`）。
- 形式: 画像は PNG / JPEG / WebP、動画は MP4 / WebM。動画は重くなりやすいので、YouTube に上げて URL を書く方がおすすめです。
- 画像は横 1600px 程度、1 枚 500KB 以下を目安に縮めてください（スマホでも読み込みが速くなります）。
- 横長（16:9）だと一覧のサムネイルがきれいに収まります。

書き方の例（works_unified.md）:

```
- **画像**: oton-zzz/1.png, oton-zzz/2.png
- **動画**: https://www.youtube.com/watch?v=XXXXXXXXXXX
```

`go test ./...` で、書いたファイルがここに無いと失敗するので、書き間違いに気づけます。
