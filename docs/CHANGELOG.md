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

---

### Phase 6: Terminal Mono x Simulation 3D の統合適用 の進捗
  - **方針の定義と確認**: ユーザーの要望である「Glass Dark」「Terminal Mono (ターミナル風美学)」「Simulation 3D (奥行きと透け感)」を組み合わせた新UI仕様書を策定。SVGアイコンデータの修正に伴い、`dice.svg` のページ内統合を含めた改修を実行。
  - **`globals.css` の拡張**: `.glass-panel` クラスを新設。`backdrop-blur-16px` と `box-shadow` を駆使し、深い黒とガラスが重なる特有の「透け感・反射」を共通CSSとして定義した。
  - **トップページの3Dパララックス演出**: `page.tsx` に `framer-motion` の `useScroll` と `useTransform` を導入。スクロールに連動して奥のグリッドや発光球体（Lime Green / Cyan）がゆっくり移動するパララックス（視差）効果を実装し、疑似的な3D空間・奥行きを演出した。
  - **アイコン (dice.svg) の完全統合**:
    1. **Favicon**: `layout.tsx` の `metadata.icons` に追加し、ブラウザタブでサイコロが表示されるよう構成。
    2. **ヘッダー**: `Header.tsx` の左上にあるターミナルアイコンを `dice.svg` に差し替え、ブランドとしての統一感を向上。
    3. **Heroセクション & 自己紹介パネル**: `page.tsx` 内の特大タイトル (DICE ARCHIVE) の直後や、Identificationパネルのアバター箇所にアイコンを配置し、アイデンティティを確立。
  - **制作物タイルのリファイン**: 基本のレイアウトを維持しつつ、親コンテナを先述の `.glass-panel` に変更。ホバー時にライムグリーンに発光し、手前に浮き上がる（Z軸移動）エフェクトを適用し、Glass Dark空間との融合を果たした。

---

### Phase 7: データベース自動復元・シード管理の整備およびクリーンアップ の進捗
* **ステータス**: 完了
* **作業内容**:
  - **DB復元トラブルシュートと原因分析**: データベース喪失時の書き込み権限エラー（Docker root権限問題）およびパス相違（コンテナ内 `/app` 階層ズレ）の原因分析と評価を実施。
  - **Goネイティブでの自動シード機能の実装**: 外部Python環境に依存せず、Goバックエンド起動時に `001_init.sql` によるスキーマ適用とシードデータの全自動投入（`repository.SeedData()`）を行うアーキテクチャへと刷新。
  - **シード用データの `backend/seeds/` ディレクトリ一元管理**:
    - `backend/seeds/` フォルダを新設し、Markdown（`works_unified.md`）と各種JSONデータ（`users.json`, `about.json`, `skills.json`, `timeline.json`）を統合配置。
    - ハードコーディングされていた初期データ（管理者公開鍵・スキル設定等）を排除し、JSONファイル参照へリファクタリング。
  - **経歴（Timeline）データの完全整備**:
    - 学歴、部活動（HxS副部長）、KC3運営、インターン（ゆめみ/Sky）、技育博（サイバーエージェント賞）などの全11項目の経歴情報を `backend/seeds/timeline.json` として構造化し、画面およびDBへの自動初期化を実装完了。
  - **管理者 Ed25519 鍵ペアの更新**: ユーザーが生成した新 Public Key（`tLn/Pjooba3IOnYxkPq6Uz9fX8AS9YMTvmSIZwfL1pA=`）を `users.json` に適用し、DBへの反映を完了。
  - **不要・旧世代ファイルのクリーンアップ**:
    - ルート直下の重複・過去データファイル（`apply_migration_002.py`, `works_unified.md`, `blashup data.md`, `data.md`, `rowdata.md`）および旧Python同期スクリプト群（`sync_unified_works.py` 等）を一括削除し、保守しやすいディレクトリ構造に整理完了。

---

### Phase 8: パフォーマンス最適化 (ISR / SSG化) の進捗
* **ステータス**: 完了
* **作業内容**:
  - **`DYNAMIC_SERVER_USAGE` の解消とISR化**: 
    - `page.tsx`, `works/[id]/page.tsx`, `works/post-detail-placeholder/[id]/page.tsx` において、`cache: 'no-store'`（アクセスのたびに動的SSR描画を強制する設定）を削除。
    - `next: { revalidate: 60 }`（60秒間隔のISRキャッシュ）へと最適化。
  - **表示速度およびサーバー負荷の改善**:
    - これまでアクセスごとに発生していた Node.js のHTML再生成および Go API / SQLite へのリクエストをカットし、静的キャッシュから即座に表示される爆速レスポンスを実現。
    - N100 Mini PC の CPU/メモリリソースの消費量を劇的に削減。
  - **コンテナ起動順序の制御 (Healthcheck)**:
    - 静的ページ生成（`next build`）実行時の API 接続エラー（`ECONNREFUSED`）を防ぐため、`docker-compose.yml` 内の `backend` サービスに `/api/health` を監視する `healthcheck` を追加。
    - `wget` のデフォルト (`--spider` による HEAD リクエスト) が Gin の `GET` 限定ルーティングで 404 となっていた原因を分析し、`GET` リクエスト (`-O /dev/null`) を送信するコマンドへ修正完了。
    - `frontend` の `depends_on` に `condition: service_healthy` を設定し、Go API サーバーが起動完了するまでフロントエンドのビルドを待機させる依存関係を構成。
  - **Air 設定のモダン化**:
    - `backend/.air.toml` 内の非推奨パラメータ `bin` を `entrypoint` 形式へ更新し、起動ログの警告を解消。
  - **経歴（Timeline）の期間表記対応 (A案)**:
    - シードデータ `backend/seeds/timeline.json` の `event_date` を単発年月から期間表記（例: `2023.04 - 2027.03` や `2025.01 - Present`）へ更新。
    - `frontend/src/app/HomeClient.tsx` の日付レンダリング部を直接表示に最適化。
