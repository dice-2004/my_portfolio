package main

import (
	"context"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/dice/portfolio/internal/ai"
	"github.com/dice/portfolio/internal/repository"
)

// collectChunks は AI チャットの材料を集める。
//   - サイトに載っている作品・自己紹介・経歴・スキル
//   - seeds/knowledge/ の Markdown（サイトには出さないが、チャットに答えさせたい補足）
//   - OBSIDIAN_VAULT の Markdown（obsidianignore に書かれたパスを除く）
func collectChunks() ([]ai.Chunk, error) {
	works, err := repository.GetAllWorks()
	if err != nil {
		return nil, err
	}
	about, _ := repository.GetAbout()
	timeline, err := repository.GetAllTimeline()
	if err != nil {
		return nil, err
	}
	skills, err := repository.GetAllSkills()
	if err != nil {
		return nil, err
	}
	chunks := ai.FromPortfolio(works, about, timeline, skills)

	if dir := filepath.Join("seeds", "knowledge"); isDir(dir) {
		k, err := ai.FromMarkdownDir(dir, "knowledge", nil)
		if err != nil {
			return nil, err
		}
		chunks = append(chunks, k...)
	}

	if vault := os.Getenv("OBSIDIAN_VAULT"); vault != "" {
		ig, err := loadObsidianIgnore(vault)
		if err != nil {
			// 除外リストが読めないまま Vault 全体を取り込むと非公開のノートまで入るので、読まない
			log.Printf("obsidianignore を読めないため Obsidian のノートは使いません: %v", err)
		} else {
			o, err := ai.FromMarkdownDir(vault, "obsidian", ig)
			if err != nil {
				return nil, err
			}
			chunks = append(chunks, o...)
		}
	}
	return chunks, nil
}

// OBSIDIAN_IGNORE_FILE が無ければ Vault の assets/obsidianignore、次に Vault 直下の obsidianignore を探す。
// Obsidian でノートとして書けるよう、それぞれ .md 付きでもよい。
// 除外リストのノート自体は AI の材料にしない。
func loadObsidianIgnore(vault string) (*ai.Ignore, error) {
	var paths []string
	for _, dir := range []string{filepath.Join(vault, "assets"), vault} {
		paths = append(paths, filepath.Join(dir, "obsidianignore"), filepath.Join(dir, "obsidianignore.md"))
	}
	if p := os.Getenv("OBSIDIAN_IGNORE_FILE"); p != "" {
		paths = []string{p}
	}
	var err error
	for _, p := range paths {
		var ig *ai.Ignore
		if ig, err = ai.LoadIgnore(p); err == nil {
			if rel, relErr := filepath.Rel(vault, p); relErr == nil && !strings.HasPrefix(rel, "..") {
				ig.Add("/" + filepath.ToSlash(rel))
			}
			return ig, nil
		}
	}
	return nil, err
}

func isDir(p string) bool {
	st, err := os.Stat(p)
	return err == nil && st.IsDir()
}

// watchIndex は interval ごとに材料を集め直し、足りない埋め込みを少しずつ作る。
func watchIndex(ix *ai.Index, interval time.Duration) {
	go func() {
		for {
			ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
			if _, err := ix.Refresh(ctx); err != nil {
				log.Printf("AI 用の資料の更新に失敗しました: %v", err)
			}
			cancel()
			time.Sleep(interval)
		}
	}()
}
