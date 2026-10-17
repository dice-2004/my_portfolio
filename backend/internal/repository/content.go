package repository

import (
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
	"time"
)

// seeds/ のファイルが作品・自己紹介・スキル・経歴の正本。
// 起動時と一定間隔でファイルの中身を確かめ、変わっていればそのテーブルを丸ごと入れ替える。
// 変わったかどうかはファイルの SHA-256 を content_meta に覚えておいて比べる。

type contentFile struct {
	name  string
	table string
	load  func(tx *sql.Tx, data []byte) (int, error)
}

var contentFiles = []contentFile{
	{"works_unified.md", "works", loadWorks},
	{"about.json", "about", loadAbout},
	{"skills.json", "skills", loadSkills},
	{"timeline.json", "timeline", loadTimeline},
}

// 反映できなかったときのファイルの hash。同じ中身のまま 30 秒ごとに同じエラーをログに出さないために覚えておく。
var failedHash = map[string]string{}

// SyncContent は変更のあったファイルだけを DB に反映する。
// ファイルが無い・読めない・中身が空のときは、そのテーブルには手を付けない。
func SyncContent() {
	for _, f := range contentFiles {
		hash, err := syncFile(f)
		if err != nil {
			if prev, seen := failedHash[f.name]; !seen || prev != hash {
				log.Printf("コンテンツ同期エラー (%s): %v", f.name, err)
			}
			failedHash[f.name] = hash
			continue
		}
		delete(failedHash, f.name)
	}
}

// WatchContent は interval ごとに SyncContent を呼ぶ。git pull や Obsidian での編集を再起動なしで反映するため。
func WatchContent(interval time.Duration) {
	go func() {
		t := time.NewTicker(interval)
		defer t.Stop()
		for range t.C {
			SyncContent()
		}
	}()
}

func syncFile(f contentFile) (hash string, err error) {
	path := findSeedFile(f.name)
	if path == "" {
		return "", fmt.Errorf("seeds/%s が見つかりません", f.name)
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	sum := sha256.Sum256(data)
	hash = hex.EncodeToString(sum[:])

	var stored string
	err = DB.QueryRow("SELECT hash FROM content_meta WHERE file = ?", f.name).Scan(&stored)
	if err != nil && err != sql.ErrNoRows {
		return hash, err
	}
	if stored == hash {
		return hash, nil
	}

	tx, err := DB.Begin()
	if err != nil {
		return hash, err
	}
	defer tx.Rollback()

	if _, err := tx.Exec("DELETE FROM " + f.table); err != nil {
		return hash, err
	}
	n, err := f.load(tx, data)
	if err != nil {
		return hash, err
	}
	if n == 0 {
		return hash, fmt.Errorf("項目が 0 件だったので反映しませんでした")
	}
	if _, err := tx.Exec(
		"INSERT INTO content_meta (file, hash) VALUES (?, ?) ON CONFLICT(file) DO UPDATE SET hash = excluded.hash",
		f.name, hash,
	); err != nil {
		return hash, err
	}
	if err := tx.Commit(); err != nil {
		return hash, err
	}
	log.Printf("%s を反映しました（%d 件）", f.name, n)
	return hash, nil
}

// 作品の ID はファイル内の順番（1 始まり）。/works/1 のような URL がこの番号を使う。
func loadWorks(tx *sql.Tx, data []byte) (int, error) {
	projects := parseUnifiedMD(string(data))
	for i, p := range projects {
		cover := ""
		if len(p.images) > 0 {
			cover = p.images[0]
		}
		if _, err := tx.Exec(`
			INSERT INTO works (id, title, description, image_url, github_url, period, team, tech, display_order, images, video_url, featured)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`, i+1, p.title, p.description, cover, p.githubURL, p.period, p.team, p.tech, i+1,
			strings.Join(p.images, "\n"), p.videoURL, p.featured); err != nil {
			return 0, fmt.Errorf("%s: %w", p.title, err)
		}
	}
	return len(projects), nil
}

func loadAbout(tx *sql.Tx, data []byte) (int, error) {
	var about struct {
		Content string `json:"content"`
	}
	if err := json.Unmarshal(data, &about); err != nil {
		return 0, err
	}
	if about.Content == "" {
		return 0, nil
	}
	if _, err := tx.Exec("INSERT INTO about (id, content) VALUES (1, ?)", about.Content); err != nil {
		return 0, err
	}
	return 1, nil
}

func loadSkills(tx *sql.Tx, data []byte) (int, error) {
	var skills []struct {
		Name         string `json:"name"`
		Category     string `json:"category"`
		Proficiency  int    `json:"proficiency"`
		DisplayOrder int    `json:"display_order"`
	}
	if err := json.Unmarshal(data, &skills); err != nil {
		return 0, err
	}
	for _, s := range skills {
		if _, err := tx.Exec(
			"INSERT INTO skills (name, category, proficiency, display_order) VALUES (?, ?, ?, ?)",
			s.Name, s.Category, s.Proficiency, s.DisplayOrder,
		); err != nil {
			return 0, fmt.Errorf("%s: %w", s.Name, err)
		}
	}
	return len(skills), nil
}

func loadTimeline(tx *sql.Tx, data []byte) (int, error) {
	var items []struct {
		Title        string `json:"title"`
		Description  string `json:"description"`
		EventDate    string `json:"event_date"`
		Category     string `json:"category"`
		DisplayOrder int    `json:"display_order"`
	}
	if err := json.Unmarshal(data, &items); err != nil {
		return 0, err
	}
	for _, t := range items {
		if _, err := tx.Exec(
			"INSERT INTO timeline (title, description, event_date, category, display_order) VALUES (?, ?, ?, ?, ?)",
			t.Title, t.Description, t.EventDate, t.Category, t.DisplayOrder,
		); err != nil {
			return 0, fmt.Errorf("%s: %w", t.Title, err)
		}
	}
	return len(items), nil
}
