# データベース復元仕様書 (Database Recovery Specification)

## 1. 概要
誤って削除・初期化された本番用データベース（SQLite: `backend/data/portfolio.db`）を、プロジェクト内に存在するマイグレーションSQLファイルおよびマークダウン形式のデータ定義ファイル（`works_unified.md`等）から完全に復元するための手順および仕様です。

---

## 2. 対象データソースおよびデータ構造

### 2.1 データベース
- **格納パス**: `backend/data/portfolio.db`
- **データ形式**: SQLite3

### 2.2 スキーマ定義
- `backend/migrations/001_init.sql` に基づくテーブル構成：
  1. `works`: ポートフォリオの実績（タイトル、概要、技術スタック、期間、チーム、GitHub URL、画像URL、表示順など）
  2. `skills`: スキル情報（スキル名、カテゴリ、習熟度、表示順など）
  3. `about`: 自己紹介・概要文
  4. `timeline`: 経歴・タイムライン情報
  5. `users`: 管理者ユーザー（ID, 名前, 公開鍵）
  6. `auth_challenges`: WebAuthn/チャレンジ認証用テンポラリテーブル

### 2.3 データソース
- **Works（実績データ）**: `works_unified.md`
- **管理者ユーザー**: ID: `admin`, Name: `Dice`, Public Key: `YLmCdCV5G5zlPw4GFpiFcOshAoqgN4hW4GmW5GAHXew=`
- **About/Skills/Timeline**: スクリプト内の初期値および参照データ

---

## 3. 復元プロセス仕様 (Recovery Pipeline)

1. **スキーマ作成**:
   - `backend/migrations/001_init.sql` を実行し、全テーブルを作成。
2. **データの抽出および整形・投入**:
   - `works_unified.md` をパースし、全プロジェクトデータ（16件）を `works` テーブルへ投入。
   - `users` テーブルへ管理者ユーザー情報を登録。
   - `about` テーブルおよび `skills` テーブルへ初期データを登録。
3. **整合性検証**:
   - `backend/scripts/inspect_db.py` を実行し、レコード件数および登録データの正当性を確認。

---

## 4. 保守性・再現性の考慮
- 復元スクリプトは独立して再実行可能な冪等性（Idempotency）を持つ設計とします。
- 将来的なデータ追加・更新時にも安全に使用できるよう、リファクタリングを行います。
