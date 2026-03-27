# 作業ログ (CHANGELOG)

## Phase 1: 基盤構築 (Week 1)

### [2026-03-21] Docker環境とプロジェクトの初期化
* **ステータス**: 完了
* **作業内容**:
  - `docker/` ディレクトリ and `Dockerfile.backend`, `Dockerfile.frontend`, `docker-compose.yml` の雛形作成完了。
  - バックエンド（Go）の `go mod init` および `gin-gonic/gin` のインストール完了。
  - フロントエンド（Next.js）の `npx create-next-app` インストール完了（Tailwind, TypeScript, App Router構成）。
  - `docker compose` によるコンテナ群のバックグラウンド起動と、バックエンドAPIのヘルスチェック（`/api/health`）の疎通確認が完了。
  - CGO無効環境におけるPure GoなSQLiteドライバ（`modernc.org/sqlite`）の採用と、 `backend/internal/repository/` でDB接続ロジックを管理するアーキテクチャへの理解・確認が完了。
  - `backend/internal/repository/db.go` を作成し、`database/sql` における `sql.Open` と `Ping`（遅延接続の仕組み）の学習と実装が完了。
  - SQLiteの `unable to open database file` エラーに対して、ユーザー自身が `os.ReadDir` と `os.Mkdir` を用いてディレクトリの安全な自動生成ロジックを独自実装し、クラッシュを解決（非常に優秀なアプローチ。後にベストプラクティスへリファクタリング済み）。
  - テーブル設計書（`backend/migrations/001_init.sql`）を作成し、SQLite用の `CREATE TABLE` の定義を実装。
  - `os.ReadFile` および `DB.Exec` を用いて、Goの起動時に独自のマイグレーション関数（`RunMigrations`）を自動実行する仕組みを完成させた。
  - **API実装（Model & Repository層）**: `backend/internal/model/works.go` で構造体（JSONタグ）を定義し、`backend/internal/repository/work.go` にてC言語のポインタ（`&`）の概念を用いた `rows.Scan` によるDBレコード取得処理を実装完了。
  - **API実装（Handler層 & Routing）**: `backend/internal/handler/work.go` を作成し、Ginを使ったJSONレスポンス(`c.JSON`)を実装。`main.go` に `GET /api/works` のルーティングを追加完了。
  - **Seedデータ投入**: `001_init.sql` に `INSERT OR IGNORE` 構文で初期データを挿入し、コンテナ起動時にマイグレーションとして実行。`curl` によるAPIの結合テスト（JSON返却）が完璧に貫通した。
  - **自力でのAPI拡張（最終試験）**: ノーヒントで `skills` テーブルのマイグレーションからルーティングまでの全5層をユーザー自身で追加完了し、`/api/skills` のエンドツーエンド開通に成功。
  - **QueryRowの学習**: 配列ではなく単一のオブジェクト（プロフィール情報）を返すための `database/sql` の機構 `DB.QueryRow` と `?`(プリペアドステートメント)を用いた安全な抽出処理を学習・実装し、`/api/about` を開通。
  - **Phase 1 完全修了**: `/api/timeline` も自力で実装・エラー解消まで完遂し、仕様書に定義されていた4つの主要API（works, skills, about, timeline）が全て稼働状態となった。
  - ユーザーから「Goにおける `if` ステートメント内の変数スコープ」と「関数のコールバック渡し（ルーティング）」についての高度な質問があり、その理解度の深さを確認した。

---

### Phase 2: フロントエンド基盤 & UI実装 の進捗
  - **Docker内部ネットワークの連携**: `NEXT.js` の `app/page.tsx` (Server Component) から `http://backend:8080` をフルパス指定でFetchし、Goで作ったJSONデータをブラウザ上に描画することに成功（フロントエンドとバックエンドの邂逅）。
  - **Glassmorphismの適用**: `globals.css` にバックグラウンドのグラデーションを設定し、Tailwind CSSを用いて `bg-white/10 backdrop-blur-md` などのすりガラス効果をカードとテキストに実装し、初期状態の可視化に成功した。
  - **Reactコンポーネントの基礎**: 複雑で長いデザイン（HTML/CSS）の塊を、`Props`（プロパティ）を受け取れる再利用可能な部品 `<GlassCard>` (src/components/GlassCard.tsx) に切り出し、全く異なるAPIレスポンス(`skills`)へも流用（再利用）することに成功。
  - **方針変更**: フロントエンドのレイアウト・CSS装飾といった「本来の学習の核（Next.jsの強力な機能）ではない部分」の記述をAIへ委任し、開発速度とデザイン品質をブーストする「高効率化フェーズ」へ移行。
  - **軌道修正**: ユーザーの的確な指摘により、DESIGN.mdで未着手だったTask（GitHub Actionsバックアップ、共通ヘッダー/フッター、ページ分割等）を補完する作業に回帰。
  - **Phase 2 完全修了**: AIを活用した効率化開発により、`/works`, `/about`, `/contact`, さらにカスタムエラーページ `not-found.tsx (404)` の作成を完了し、モダンなルーティングと要件を全てクリアした。

---

*※ これにより、「Phase 2: フロントエンド基盤 & UI実装」の全タスクが完全コンプリートとなりました。*

### Phase 3: 認証・編集機能 の進捗
  - **Ed25519公開鍵暗号の導入**: バックエンドに `backend/scripts/generate-keys.go` を作成し、`crypto/ed25519` パッケージを用いてパスワード不要の認証基盤となる「秘密鍵・公開鍵」ペアの作成を完遂。
  - **署名検証・JWT発行基盤の構築**: `Challenge-Response` 認証API群（`/challenge`, `/verify`, `/register`）をサーバーに実装し、テストスクリプトによりEd25519の署名付与とサーバー側での数学的検証、さらに「1時間の有効期限を保持するJWTトークン（入館証）」の発行に完璧に成功した。
  - **開発方針の最終シフト**: 認証フローという極めて難易度の高い概念の成立を機に、「AIがソースコードを書き、丁寧に概念を解説し、ユーザーがソースと解説を読んで理解（Code Reading）する」というスタイルへの完全移行を決定。これにより開発は全速力（フルスピード）となる。

### Phase 4: コンテンツ管理基盤 ＆ 全体デザイン刷新 の進捗
  - **CRUD基盤の完全実装**: バックエンドに `works`, `skills`, `timeline`, `about` 全ての追加・更新・削除APIを追加し、強力なJWTミドルウェアによる保護を適用した。
  - **管理画面のコンプリート**: フロントエンドに全ての専用管理画面（`/admin/works`, `/admin/skills`, `/admin/timeline`, `/admin/about`）を作成。遅延ロード（dynamic import）を用いた Markdown エディタの搭載や、スライダーUIの適用など、極めてリッチな体験を実現させた。
  - **至高のUIデザイン改修**: **「おしゃれな感じ」** という要件を達成するため、トップページ（`/`）、アバウトページ（`/about`）、作品一覧（`/works`）を全面的に作り直し。最新のガラスエフェクト（Glassmorphism）、光る背景グラデーション、流线型のタイムライン装飾を加え、さらに独自作成の `<MarkdownRenderer />` (react-markdownを使用) コンポーネントを通すことで、**今までテキストのベタ打ちだった自己紹介や作品詳細が、極上のタイポグラフィ（Markdown装飾付き）で美しく描画される** ようにした。

  
* **発生したエラーとユーザーからの指摘・修正履歴**:
  1. **【エラー】Docker Build時のDNSタイムアウト (`i/o timeout` on `10.255.255.254:53`)**
     - **原因**: ユーザー環境（WSL2 / Docker Desktop）において、Alpine Linuxベース（musl libc）内での `go install` (ビルド時) の名前解決が失敗する特有のネットワークバグが発生した。
     - **ユーザーからの指摘**: 他プロジェクト（GitChat）ではAlpineでも動作していた。
     - **AIの分析・気付き**: ユーザーの言う通り、別プロジェクトでは `npm install` 等を `Dockerfile` 内の `RUN` (ビルド時) ではなく `CMD` (コンテナ起動時) に設計していたため、Docker内ネットワーク特有の遮断を回避できていたことが判明した。非常に鋭い洞察！
     - **修正アクション**: 将来の安定性も考慮し、ベースイメージを `golang:1.26.1-alpine` からDebian系の `golang:1.26.1-bookworm` (Node.js側は `bookworm-slim` ) に変更するとともに、`docker-compose.yml` の `build` セクションに `network: host` を追記して回避。無事バックエンドの初期化に成功。

  2. **【エラー】Next.js初期化時のディレクトリ競合とDNSタイムアウト**
     - **原因**: 独自の匿名ボリュームによる `node_modules` フォルダの先行生成と、再びOS層のDNSタイムアウト（`ENOTFOUND registry.npmjs.org`）が発生。
     - **修正アクション**: `docker compose` のビルドフェーズを介さず、ピュアな `docker run` でホストネットワーク（`--network host`）を強制指定して `create-next-app` を実行。これによりNext.jsの全てのソースコードの生成に成功した。

  3. **【改善】docker-compose.yml の配置場所の最適化**
     - **ユーザーからの指摘**: `-f docker/docker-compose.yml` の指定が毎回必要になるのは面倒であるため、直接 `docker compose up` で起動できないか。
     - **修正アクション**: 非常に真っ当で実用的な指摘。開発者体験（DX）向上のため、`docker-compose.yml` を `docker/` ディレクトリからプロジェクトのルート (`/) に移動させ、内部のビルドコンテキストパス等を修正した。同時に `DESIGN.md` のディレクトリ構成図も更新した。

---

### Phase 5: UI/UX 刷新およびインタラクティブ演出の強化 の進捗
  - **方針転換とクリーンアップ**: ポートフォリオの独自性を追求するため、外部デバイス依存の AR/XR 機能および 3D 表現（Three.js）を廃止。関連するコード (`HeroScene`, `ARButton` 等) を完全に物理削除し、2D ウェイトのリッチな UI 刷新へと舵を切った。
  - **基盤デザインの再構築**: 3D モデルに代わって、CSS による「オーロラグラデーション背景」と「ノイズテクスチャ」をヒーローセクションに導入。3D の奥行き感ではなく、レイヤー構造と透明度による「デジタルな奥行き」を追求。
  - **仕様の再定義**: 3D 実装タスクを除外し、Framer Motion を用いた詳細なマイクロインタラクションの実装を主軸に据えた [UI_REFINEMENT_SPEC.md](file:///home/dice/programs/my_portfolio/docs/UI_REFINEMENT_SPEC.md) を策定。
  - **トップページのリセット**: 3D ロジックへの依存を断ち切り、ピュアな React コンポーネントとして Hero セクションを再構築。次ステップでアニメーションとグラデーションの強化を行う準備を完了。
