package repository

import (
	"database/sql"
	"log"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	_ "modernc.org/sqlite"
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

	if _, err := DB.Exec(query); err != nil {
		log.Fatalf("マイグレーションの実行エラー: %v", err)
	}
	if err := addWorkColumns(); err != nil {
		log.Fatalf("works テーブルの列の追加に失敗しました: %v", err)
	}
	log.Println("マイグレーションの実行に成功しました！")
}

// 001_init.sql の CREATE TABLE IF NOT EXISTS は既存の DB に列を足さないので、後から増えた列はここで足す。
// 足したときは作品ファイルを読み直させる（中身が同じでも新しい列を埋めるため）。
func addWorkColumns() error {
	have := map[string]bool{}
	rows, err := DB.Query("SELECT name FROM pragma_table_info('works')")
	if err != nil {
		return err
	}
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			rows.Close()
			return err
		}
		have[name] = true
	}
	rows.Close()

	added := false
	for _, c := range []struct{ name, def string }{
		{"images", "TEXT"},
		{"video_url", "TEXT"},
		{"featured", "INTEGER DEFAULT 0"},
	} {
		if have[c.name] {
			continue
		}
		if _, err := DB.Exec("ALTER TABLE works ADD COLUMN " + c.name + " " + c.def); err != nil {
			return err
		}
		added = true
	}
	if added {
		_, err = DB.Exec("DELETE FROM content_meta WHERE file = 'works_unified.md'")
	}
	return err
}

type project struct {
	title       string
	description string
	githubURL   string
	images      []string
	videoURL    string
	featured    bool
	period      string
	team        string
	tech        string
}

// 画像を置くフォルダ（seeds/media/）の公開 URL。/api は Next.js の rewrite でバックエンドに届く。
const mediaURLPrefix = "/api/media/"

// 「oton-zzz/1.png」のようなファイル名を /api/media/oton-zzz/1.png にする。http(s):// で始まるものはそのまま。
func mediaURL(v string) string {
	v = strings.TrimSpace(v)
	if v == "" || strings.HasPrefix(v, "http://") || strings.HasPrefix(v, "https://") {
		return v
	}
	parts := strings.Split(strings.TrimPrefix(v, "/"), "/")
	for i, p := range parts {
		parts[i] = url.PathEscape(p)
	}
	return mediaURLPrefix + strings.Join(parts, "/")
}

// 「はい」「yes」「true」「○」などを代表作の印として扱う。
func isYes(v string) bool {
	switch strings.ToLower(strings.TrimSpace(v)) {
	case "はい", "yes", "true", "○", "◯", "1":
		return true
	}
	return false
}

func parseUnifiedMD(content string) []project {
	// \n---\n\n## で分割
	items := regexp.MustCompile(`\n---\n\n## \d+\. `).Split(content, -1)
	if len(items) > 0 {
		items[0] = regexp.MustCompile(`(?s)^.*?## 1\. `).ReplaceAllString(items[0], "")
	}

	var projects []project
	reGitHub := regexp.MustCompile(`- \*\*GitHub\*\*: (.*)`)
	reTech := regexp.MustCompile(`- \*\*技術スタック\*\*: (.*)`)
	rePeriod := regexp.MustCompile(`- \*\*開発時期\*\*: (.*)`)
	reTeam := regexp.MustCompile(`- \*\*体制\*\*: (.*)`)
	reAward := regexp.MustCompile(`- \*\*受賞\*\*: (.*)`)
	reShortIntro := regexp.MustCompile(`- \*\*ショート概要\*\*: (.*)`)
	reBackground := regexp.MustCompile(`- \*\*背景・課題\*\*: (.*)`)
	reSolution := regexp.MustCompile(`- \*\*解決策\*\*: (.*)`)
	reRole := regexp.MustCompile(`- \*\*担当・工夫した点\*\*: (.*)`)
	reNotes := regexp.MustCompile(`- \*\*備考\*\*: (.*)`)
	reImages := regexp.MustCompile(`- \*\*画像\*\*: (.*)`)
	reVideo := regexp.MustCompile(`- \*\*動画\*\*: (.*)`)
	reFeatured := regexp.MustCompile(`- \*\*代表作\*\*: (.*)`)

	matchVal := func(re *regexp.Regexp, text string) string {
		m := re.FindStringSubmatch(text)
		if len(m) > 1 {
			return strings.TrimSpace(m[1])
		}
		return ""
	}

	for _, item := range items {
		lines := strings.Split(item, "\n")
		var cleanLines []string
		for _, l := range lines {
			lTrim := strings.TrimSpace(l)
			if lTrim != "" {
				cleanLines = append(cleanLines, lTrim)
			}
		}
		if len(cleanLines) == 0 {
			continue
		}

		titleLine := cleanLines[0]
		title := strings.TrimSpace(strings.Split(titleLine, " (")[0])

		// 「(未記載・個人演習)」のような URL でない値はリンクにしない
		github := matchVal(reGitHub, item)
		if !strings.HasPrefix(github, "http://") && !strings.HasPrefix(github, "https://") {
			github = ""
		}
		var images []string
		for _, v := range strings.Split(matchVal(reImages, item), ",") {
			if u := mediaURL(v); u != "" {
				images = append(images, u)
			}
		}
		tech := matchVal(reTech, item)
		period := matchVal(rePeriod, item)
		team := matchVal(reTeam, item)
		award := matchVal(reAward, item)
		shortIntro := matchVal(reShortIntro, item)
		background := matchVal(reBackground, item)
		solution := matchVal(reSolution, item)
		role := matchVal(reRole, item)
		notes := matchVal(reNotes, item)

		var descBuilder strings.Builder
		if award != "" {
			descBuilder.WriteString("🏆 **AWARD:** " + award + "\n\n")
		}
		descBuilder.WriteString("### Spec Sheet\n")
		if period != "" {
			descBuilder.WriteString("- **Period:** " + period + "\n")
		}
		if team != "" {
			descBuilder.WriteString("- **Team:** " + team + "\n")
		}
		if tech != "" {
			descBuilder.WriteString("- **Tech Stack:** " + tech + "\n")
		}
		descBuilder.WriteString("\n")

		if shortIntro != "" {
			descBuilder.WriteString("### Concept\n" + shortIntro + "\n\n")
		}
		if background != "" {
			descBuilder.WriteString("### Background & Problem\n" + background + "\n\n")
		}
		if solution != "" {
			descBuilder.WriteString("### Solution\n" + solution + "\n\n")
		}
		if role != "" {
			descBuilder.WriteString("### Laboratory Notes (Role & Effort)\n" + role + "\n\n")
		}
		if notes != "" {
			descBuilder.WriteString("### Remarks\n" + notes + "\n")
		}

		projects = append(projects, project{
			title:       title,
			description: strings.TrimSpace(descBuilder.String()),
			githubURL:   github,
			images:      images,
			videoURL:    mediaURL(matchVal(reVideo, item)),
			featured:    isYes(matchVal(reFeatured, item)),
			period:      period,
			team:        team,
			tech:        tech,
		})
	}
	return projects
}

func findSeedFile(filename string) string {
	paths := []string{
		filepath.Join("seeds", filename),
		filepath.Join("backend", "seeds", filename),
		filepath.Join("/app", "seeds", filename),
	}
	for _, p := range paths {
		if _, err := os.Stat(p); err == nil {
			return p
		}
	}
	return ""
}
