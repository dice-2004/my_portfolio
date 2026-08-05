package repository

import (
	"database/sql"
	"encoding/json"
	"log"
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
	log.Println("マイグレーションの実行に成功しました！")
}

const adminPublicKey = "YLmCdCV5G5zlPw4GFpiFcOshAoqgN4hW4GmW5GAHXew="

type project struct {
	title       string
	description string
	githubURL   string
	imageURL    string
	period      string
	team        string
	tech        string
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

		github := matchVal(reGitHub, item)
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
			imageURL:    "/no-image.png",
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

func SeedData() {
	// 1. Users Data (users.json)
	var userCount int
	err := DB.QueryRow("SELECT COUNT(*) FROM users").Scan(&userCount)
	if err == nil && userCount == 0 {
		userSeedPath := findSeedFile("users.json")
		if userSeedPath != "" {
			b, err := os.ReadFile(userSeedPath)
			if err == nil {
				var users []struct {
					ID        string `json:"id"`
					Name      string `json:"name"`
					PublicKey string `json:"public_key"`
				}
				if err := json.Unmarshal(b, &users); err == nil {
					for _, u := range users {
						_, err := DB.Exec("INSERT INTO users (id, name, public_key) VALUES (?, ?, ?)", u.ID, u.Name, u.PublicKey)
						if err != nil {
							log.Printf("ユーザー初期化エラー (%s): %v", u.ID, err)
						}
					}
					log.Println("管理者ユーザーデータを初期化しました。")
				}
			}
		}
	}

	// 2. Works Data (works_unified.md)
	var worksCount int
	err = DB.QueryRow("SELECT COUNT(*) FROM works").Scan(&worksCount)
	if err == nil && worksCount == 0 {
		worksSeedPath := findSeedFile("works_unified.md")
		if worksSeedPath != "" {
			content, err := os.ReadFile(worksSeedPath)
			if err == nil && len(content) > 0 {
				projects := parseUnifiedMD(string(content))
				for idx, p := range projects {
					_, err := DB.Exec(`
						INSERT INTO works (title, description, image_url, github_url, period, team, tech, display_order)
						VALUES (?, ?, ?, ?, ?, ?, ?, ?)
					`, p.title, p.description, p.imageURL, p.githubURL, p.period, p.team, p.tech, idx+1)
					if err != nil {
						log.Printf("作品データ挿入エラー (%s): %v", p.title, err)
					}
				}
				log.Printf("%d 件の作品データを同期しました！", len(projects))
			}
		} else {
			log.Println("Warning: seeds/works_unified.md が見つからないため作品データのシードをスキップしました。")
		}
	}

	// 3. About Data (about.json)
	var aboutCount int
	err = DB.QueryRow("SELECT COUNT(*) FROM about").Scan(&aboutCount)
	if err == nil && aboutCount == 0 {
		aboutSeedPath := findSeedFile("about.json")
		if aboutSeedPath != "" {
			b, err := os.ReadFile(aboutSeedPath)
			if err == nil {
				var aboutData struct {
					Content string `json:"content"`
				}
				if err := json.Unmarshal(b, &aboutData); err == nil {
					_, err = DB.Exec("INSERT INTO about (content) VALUES (?)", aboutData.Content)
					if err != nil {
						log.Printf("Aboutデータの初期挿入エラー: %v", err)
					} else {
						log.Println("Aboutデータを初期化しました。")
					}
				}
			}
		}
	}

	// 4. Skills Data (skills.json)
	var skillsCount int
	err = DB.QueryRow("SELECT COUNT(*) FROM skills").Scan(&skillsCount)
	if err == nil && skillsCount == 0 {
		skillsSeedPath := findSeedFile("skills.json")
		if skillsSeedPath != "" {
			b, err := os.ReadFile(skillsSeedPath)
			if err == nil {
				var skills []struct {
					Name         string `json:"name"`
					Category     string `json:"category"`
					Proficiency  int    `json:"proficiency"`
					DisplayOrder int    `json:"display_order"`
				}
				if err := json.Unmarshal(b, &skills); err == nil {
					for _, s := range skills {
						_, err = DB.Exec("INSERT INTO skills (name, category, proficiency, display_order) VALUES (?, ?, ?, ?)",
							s.Name, s.Category, s.Proficiency, s.DisplayOrder)
						if err != nil {
							log.Printf("Skillデータ挿入エラー (%s): %v", s.Name, err)
						}
					}
					log.Println("Skillsデータを初期化しました。")
				}
			}
		}
	}

	// 5. Timeline Data (timeline.json)
	var timelineCount int
	err = DB.QueryRow("SELECT COUNT(*) FROM timeline").Scan(&timelineCount)
	if err == nil && timelineCount == 0 {
		timelineSeedPath := findSeedFile("timeline.json")
		if timelineSeedPath != "" {
			b, err := os.ReadFile(timelineSeedPath)
			if err == nil {
				var timelines []struct {
					Title        string `json:"title"`
					Description  string `json:"description"`
					EventDate    string `json:"event_date"`
					Category     string `json:"category"`
					DisplayOrder int    `json:"display_order"`
				}
				if err := json.Unmarshal(b, &timelines); err == nil {
					for _, t := range timelines {
						_, err = DB.Exec("INSERT INTO timeline (title, description, event_date, category, display_order) VALUES (?, ?, ?, ?, ?)",
							t.Title, t.Description, t.EventDate, t.Category, t.DisplayOrder)
						if err != nil {
							log.Printf("Timelineデータ挿入エラー (%s): %v", t.Title, err)
						}
					}
					log.Printf("%d 件のTimeline（経歴）データを初期化しました！", len(timelines))
				}
			}
		}
	}
}
