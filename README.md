# Dice's Portfolio

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Go](https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

モダンなデザインと実戦的なセキュリティを兼ね備えた、エンジニア Dice のポートフォリオサイトです。
「魅せる」だけでなく、Go言語や公開鍵暗号を用いた堅牢なバックエンド、自宅サーバーでの運用など、エンジニアリングのこだわりを凝縮しています。

## 🌟 Key Features

### 1. Modern Glassmorphism UI
- **Visual Expression**: 透明感のあるガラスモーフィズムと、流動的なオーロラバックグラウンドを採用。
- **Interactive Experience**: Framer Motion による吸い付くようなアニメーションとスムーズな画面遷移。
- **Bento Grid Layout**: 直感的でスタイリッシュな情報の整理。

### 2. Ed25519 Public Key Authentication
- **Security**: 一般的なパスワード認証ではなく、Ed25519 公開鍵認証による「パスワードレス管理画面」を自前実装。
- **Zero-Storage Access**: 秘密鍵をブラウザに保存せず、ログインのたびに `.pem` ファイルを読み込ませるセキュアなインポート方式を採用。

### 3. Integrated Web Markdown Editor
- **Content Management**: 管理画面に独自の Markdown エディタを搭載。
- **Real-time Preview**: 執筆しながら即座に反映を確認できる左右分割プレビュー。
- **Direct Upload**: 既存の `.md` ファイルを直接アップロードしてコンテンツを更新可能。

### 4. Home Server Deployment (N100 Mini PC)
- **Edge Computing**: 自宅の N100 Mini PC でフルスタック環境を稼働。
- **Cloudflare Tunnel**: グローバルIPやポート開放を必要としない、Cloudflare Tunnel によるセキュアな外部公開。

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Next.js (App Router), React, TypeScript |
| **Styling** | Tailwind CSS, Shadcn UI, Framer Motion |
| **Backend** | Go (Gin), REST API |
| **Database** | SQLite (Pure SQL with Migrations) |
| **Infrastructure** | Docker, Docker Compose, Cloudflare Tunnel |
| **Environment** | N100 Mini PC (Ubuntu) |

## 🚀 Getting Started

Docker を使用して、ローカル環境で瞬時に開発環境を構築できます。

### Prerequisites
- Docker / Docker Compose

### Setup & Run
1. リポジトリをクローン:
   ```bash
   git clone https://github.com/your-username/my_portfolio.git
   cd my_portfolio
   ```

2. コンテナの起動:
   ```bash
   docker compose up -d
   ```

3. アクセス:
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:8080](http://localhost:8080)

## 📖 Development Philosophy

本プロジェクトは、AIアシスタントとの「ペアプログラミング・学習モード」によって開発されています。
単にコードを生成するのではなく、設計思想のベストプラクティスを議論し、一歩一歩レビューを受けながら実装を進めています。その過程（試行錯誤やエラー解決の経緯）は [docs/CHANGELOG.md](./docs/CHANGELOG.md) に事細かに記録されています。

---
Created by Dice.
