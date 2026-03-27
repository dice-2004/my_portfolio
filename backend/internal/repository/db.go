package repository

import (
	"database/sql"
	"log"
	"os"

	// Goの慣習：外部のドライバを読み込むが、コード上でその関数名を直接使わない場合は
	// インポート名の前に「 _ (アンダースコア)」を置きます。（これを「ブランクインポート」と呼びます）
	// これにより、裏側で勝手に `database/sql` にドライバが登録されます。
	_ "modernc.org/sqlite" // ★穴埋め1: 先ほどインストールしたSQLiteドライバのパッケージパスを入れます
	"path/filepath"
)

// 全体からアクセスできるデータベース変数
var DB *sql.DB

// InitDB は main.go から呼び出される初期化関数です
func InitDB(dsn string) {
	var err error

	if err := os.MkdirAll(filepath.Dir(dsn), 0755); err != nil {
		log.Fatalf("DBディレクトリの作成に失敗しました: %v", err)
	}

	// ★穴埋め2: `database/sql` パッケージの機能で、データベースを「開く（接続する）」関数は何でしょうか？
	// 第1引数にドライバ名("sqlite")、第2引数にDSN（ファイルパス）を入れます。
	DB, err = sql.Open("sqlite", dsn)

	if err != nil {
		log.Fatalf("DB接続エラー: %v", err)
	}

	// 実際にファイルにアクセスできるか（疎通）テストします
	if err = DB.Ping(); err != nil {
		log.Fatalf("DB疎通エラー: %v", err)
	}

	log.Println("データベースへの接続に成功しました！")
}

func RunMigrations() {
	bytes, err := os.ReadFile("migrations/001_init.sql")
	if err != nil {
		log.Fatalf("マイグレーションファイルの読み込みエラー: %v", err)
	}
	query := string(bytes)

	if _,err := DB.Exec(query); err != nil {
		log.Fatalf("マイグレーションの実行エラー: %v", err)
	}
	log.Println("マイグレーションの実行に成功しました！")
}
