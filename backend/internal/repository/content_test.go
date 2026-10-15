package repository

import (
	"os"
	"path/filepath"
	"testing"
)

const testWorks = `## 1. Alpha (alpha)
- **GitHub**: https://github.com/example/alpha
- **開発時期**: 2025年1月
- **ショート概要**: 一つ目

---

## 2. Beta (beta)
- **ショート概要**: 二つ目
`

// 一時ディレクトリに seeds/ と DB を作り、そこを作業ディレクトリにする。
func setupContent(t *testing.T) string {
	t.Helper()
	schema, err := os.ReadFile(filepath.Join("..", "..", "migrations", "001_init.sql"))
	if err != nil {
		t.Fatal(err)
	}
	dir := t.TempDir()
	if err := os.Mkdir(filepath.Join(dir, "seeds"), 0o755); err != nil {
		t.Fatal(err)
	}
	t.Chdir(dir)
	failedHash = map[string]string{}

	InitDB(filepath.Join(dir, "test.db"))
	t.Cleanup(func() { DB.Close() })
	if _, err := DB.Exec(string(schema)); err != nil {
		t.Fatal(err)
	}

	writeSeed(t, "works_unified.md", testWorks)
	writeSeed(t, "about.json", `{"content": "こんにちは"}`)
	writeSeed(t, "skills.json", `[{"name": "Go", "category": "言語", "proficiency": 3, "display_order": 1}]`)
	writeSeed(t, "timeline.json", `[{"title": "入学", "description": "", "event_date": "2023.04", "category": "学歴", "display_order": 1}]`)
	return dir
}

func writeSeed(t *testing.T, name, body string) {
	t.Helper()
	if err := os.WriteFile(filepath.Join("seeds", name), []byte(body), 0o644); err != nil {
		t.Fatal(err)
	}
}

func TestSyncContentLoadsAndUpdates(t *testing.T) {
	setupContent(t)
	SyncContent()

	works, err := GetAllWorks()
	if err != nil {
		t.Fatal(err)
	}
	if len(works) != 2 || works[0].ID != 1 || works[0].Title != "Alpha" || works[1].Title != "Beta" {
		t.Fatalf("works = %+v", works)
	}
	about, err := GetAbout()
	if err != nil || about.Content != "こんにちは" {
		t.Fatalf("about = %+v, err = %v", about, err)
	}

	// ファイルを書き換えると、次の同期で入れ替わる
	writeSeed(t, "works_unified.md", "## 1. Gamma (gamma)\n- **ショート概要**: 新しい\n")
	writeSeed(t, "about.json", `{"content": "更新しました"}`)
	SyncContent()

	works, _ = GetAllWorks()
	if len(works) != 1 || works[0].ID != 1 || works[0].Title != "Gamma" {
		t.Fatalf("works after update = %+v", works)
	}
	about, _ = GetAbout()
	if about.Content != "更新しました" {
		t.Fatalf("about after update = %q", about.Content)
	}
	skills, _ := GetAllSkills()
	if len(skills) != 1 {
		t.Fatalf("skills should be untouched, got %+v", skills)
	}
}

func TestSyncContentKeepsDataOnBadFile(t *testing.T) {
	setupContent(t)
	SyncContent()

	// 壊れた JSON や空のファイルでは、今のデータを消さない
	writeSeed(t, "skills.json", `[{"name": `)
	writeSeed(t, "works_unified.md", "")
	SyncContent()

	skills, _ := GetAllSkills()
	if len(skills) != 1 {
		t.Fatalf("skills = %+v", skills)
	}
	works, _ := GetAllWorks()
	if len(works) != 2 {
		t.Fatalf("works = %+v", works)
	}

	// 直したら反映される
	writeSeed(t, "skills.json", `[{"name": "Go"}, {"name": "TypeScript"}]`)
	SyncContent()
	skills, _ = GetAllSkills()
	if len(skills) != 2 {
		t.Fatalf("skills after fix = %+v", skills)
	}
}

// リポジトリにある本物の seeds/ がすべて読み込めることを確かめる（書き間違いを CI で見つけるため）
func TestRealSeedsLoad(t *testing.T) {
	seeds, err := filepath.Abs(filepath.Join("..", "..", "seeds"))
	if err != nil {
		t.Fatal(err)
	}
	setupContent(t)
	for _, f := range contentFiles {
		data, err := os.ReadFile(filepath.Join(seeds, f.name))
		if err != nil {
			t.Fatal(err)
		}
		writeSeed(t, f.name, string(data))
	}
	DB.Exec("DELETE FROM content_meta")
	SyncContent()

	for _, f := range contentFiles {
		var n int
		if err := DB.QueryRow("SELECT COUNT(*) FROM " + f.table).Scan(&n); err != nil || n == 0 {
			t.Errorf("%s: %d 件 (err = %v)", f.name, n, err)
		}
	}
}
