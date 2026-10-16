package main

import (
	"context"
	"fmt"
	"io/fs"
	"log"
	"os"
	"path"
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

// loadObsidianIgnore は Vault 内の obsidianignore（Obsidian で作った obsidianignore.md でもよい）をすべて読む。
// .gitignore と同じく、どのフォルダに置いてもよく、書いたパスはそのフォルダから数える。
// 1 つも無ければエラーを返す。除外リストのノート自体は AI の材料にしない。
func loadObsidianIgnore(vault string) (*ai.Ignore, error) {
	ig := &ai.Ignore{}
	found := 0
	err := filepath.WalkDir(vault, func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if p != vault && strings.HasPrefix(d.Name(), ".") {
			if d.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		if d.IsDir() || (d.Name() != "obsidianignore" && d.Name() != "obsidianignore.md") {
			return nil
		}
		rel, err := filepath.Rel(vault, p)
		if err != nil {
			return err
		}
		rel = filepath.ToSlash(rel)
		base := path.Dir(rel)
		if base == "." {
			base = ""
		}
		if err := ig.Load(p, base); err != nil {
			return err
		}
		ig.Add("/" + rel)
		found++
		return nil
	})
	if err != nil {
		return nil, err
	}
	if found == 0 {
		return nil, fmt.Errorf("%s に obsidianignore（または obsidianignore.md）がありません", vault)
	}
	return ig, nil
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
