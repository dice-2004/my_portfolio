package main

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/dice/portfolio/internal/ai"
)

func writeFile(t *testing.T, path, body string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte(body), 0o644); err != nil {
		t.Fatal(err)
	}
}

// Obsidian で作った assets/obsidianignore.md を、見出しつきで書いた場合
func TestLoadObsidianIgnoreMarkdownNote(t *testing.T) {
	t.Setenv("OBSIDIAN_IGNORE_FILE", "")
	vault := t.TempDir()
	writeFile(t, filepath.Join(vault, "assets", "obsidianignore.md"),
		"# obsidianignore\n## This is an ignore file for AI reading agents.\n/assets/音声文字起こし\n/assets/templates\n")
	writeFile(t, filepath.Join(vault, "assets", "templates", "日報.md"), "# テンプレ\n本文")
	writeFile(t, filepath.Join(vault, "assets", "音声文字起こし", "会議.md"), "# 会議\n本文")
	writeFile(t, filepath.Join(vault, "assets", "AI_anser", "回答.md"), "# 回答\n本文")
	writeFile(t, filepath.Join(vault, "研究関連ノート", "メモ.md"), "# メモ\n本文")

	ig, err := loadObsidianIgnore(vault)
	if err != nil {
		t.Fatal(err)
	}
	chunks, err := ai.FromMarkdownDir(vault, "obsidian", ig)
	if err != nil {
		t.Fatal(err)
	}
	got := map[string]bool{}
	for _, c := range chunks {
		got[c.Source] = true
	}
	want := []string{"obsidian/assets/AI_anser/回答.md", "obsidian/研究関連ノート/メモ.md"}
	if len(got) != len(want) {
		t.Fatalf("sources = %v", got)
	}
	for _, w := range want {
		if !got[w] {
			t.Errorf("%s が入っていない: %v", w, got)
		}
	}
}

func TestLoadObsidianIgnoreMissing(t *testing.T) {
	t.Setenv("OBSIDIAN_IGNORE_FILE", "")
	if _, err := loadObsidianIgnore(t.TempDir()); err == nil {
		t.Fatal("除外リストが無いのに読めてしまった")
	}
}
