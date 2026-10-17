package repository

import (
	"net/url"
	"os"
	"path/filepath"
	"strings"
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

func TestWorkMediaFields(t *testing.T) {
	setupContent(t)
	writeSeed(t, "works_unified.md", `## 1. Alpha (alpha)
- **GitHub**: (未記載・個人演習)
- **画像**: alpha/top.png, 画面 2.png, https://example.com/x.jpg
- **動画**: https://youtu.be/abc
- **代表作**: はい
- **ショート概要**: 一つ目

---

## 2. Beta (beta)
- **GitHub**: https://github.com/example/beta
- **ショート概要**: 二つ目
`)
	SyncContent()

	a, err := GetWorkByID(1)
	if err != nil {
		t.Fatal(err)
	}
	want := []string{"/api/media/alpha/top.png", "/api/media/%E7%94%BB%E9%9D%A2%202.png", "https://example.com/x.jpg"}
	if strings.Join(a.Images, "|") != strings.Join(want, "|") || a.ImageURL != want[0] {
		t.Errorf("images = %q, image_url = %q", a.Images, a.ImageURL)
	}
	if a.VideoURL != "https://youtu.be/abc" || !a.Featured || a.GithubURL != "" {
		t.Errorf("alpha = %+v", a)
	}
	b, _ := GetWorkByID(2)
	if len(b.Images) != 0 || b.Images == nil || b.Featured || b.GithubURL != "https://github.com/example/beta" {
		t.Errorf("beta = %+v", b)
	}
}

// 列が足りない古い DB に列を足し、作品ファイルを読み直させる
func TestAddWorkColumns(t *testing.T) {
	setupContent(t)
	SyncContent()
	for _, c := range []string{"images", "video_url", "featured"} {
		if _, err := DB.Exec("ALTER TABLE works DROP COLUMN " + c); err != nil {
			t.Fatal(err)
		}
	}
	if err := addWorkColumns(); err != nil {
		t.Fatal(err)
	}
	var n int
	DB.QueryRow("SELECT COUNT(*) FROM content_meta WHERE file = 'works_unified.md'").Scan(&n)
	if n != 0 {
		t.Error("works_unified.md の hash が残っている")
	}
	SyncContent()
	if works, err := GetAllWorks(); err != nil || len(works) != 2 {
		t.Fatalf("works = %+v, err = %v", works, err)
	}
	// 2 回目は何もしない
	if err := addWorkColumns(); err != nil {
		t.Fatal(err)
	}
}

// works_unified.md の「画像」「動画」に書いたファイルが seeds/media/ に本当にあるか（書き間違いを CI で見つけるため）
func TestRealSeedMediaExists(t *testing.T) {
	data, err := os.ReadFile(filepath.Join("..", "..", "seeds", "works_unified.md"))
	if err != nil {
		t.Fatal(err)
	}
	for _, p := range parseUnifiedMD(string(data)) {
		for _, u := range append(append([]string{}, p.images...), p.videoURL) {
			if !strings.HasPrefix(u, mediaURLPrefix) {
				continue
			}
			name, err := url.PathUnescape(strings.TrimPrefix(u, mediaURLPrefix))
			if err != nil {
				t.Fatal(err)
			}
			if _, err := os.Stat(filepath.Join("..", "..", "seeds", "media", name)); err != nil {
				t.Errorf("%s: seeds/media/%s がありません", p.title, name)
			}
		}
	}
}
