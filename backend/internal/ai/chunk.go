package ai

import (
	"bufio"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/dice/portfolio/internal/model"
)

// Chunk は検索と回答の材料になる文章のひとかたまり。
type Chunk struct {
	Source string // "works/3" "about" "knowledge/xxx.md" "obsidian/xxx.md" など
	Title  string
	URL    string // サイト内のページがあるときだけ（例: /works/3）
	Body   string
}

// 1 チャンクの最大文字数。日本語はおおむね 1 文字 ≒ 1 トークン。
const maxChunkChars = 900

var mdNoise = strings.NewReplacer("**", "", "__", "", "`", "", "🏆", "")

// FromPortfolio はサイトに載っている作品・自己紹介・経歴・スキルをチャンクにする。
func FromPortfolio(works []model.Work, about model.About, timeline []model.Timeline, skills []model.Skill) []Chunk {
	var out []Chunk
	for _, w := range works {
		var b strings.Builder
		fmt.Fprintf(&b, "作品「%s」\n", w.Title)
		for _, kv := range [][2]string{{"時期", w.Period}, {"体制", w.Team}, {"技術", w.Tech}, {"GitHub", w.GithubURL}} {
			if kv[1] != "" {
				fmt.Fprintf(&b, "%s: %s\n", kv[0], kv[1])
			}
		}
		b.WriteString(mdNoise.Replace(w.Description))
		out = append(out, splitText(fmt.Sprintf("works/%d", w.ID), w.Title, fmt.Sprintf("/works/%d", w.ID), b.String())...)
	}
	if strings.TrimSpace(about.Content) != "" {
		out = append(out, splitMarkdown("about", "自己紹介", "/#about", about.Content)...)
	}
	if len(timeline) > 0 {
		var b strings.Builder
		for _, t := range timeline {
			fmt.Fprintf(&b, "%s %s（%s）%s\n", t.EventDate, t.Title, t.Category, t.Description)
		}
		out = append(out, splitText("timeline", "経歴", "/#about", b.String())...)
	}
	if len(skills) > 0 {
		var b strings.Builder
		for _, s := range skills {
			fmt.Fprintf(&b, "%s（%s）\n", s.Name, s.Category)
		}
		out = append(out, splitText("skills", "スキル", "/#skills", b.String())...)
	}
	return out
}

// FromMarkdownDir は dir 以下の .md をチャンクにする。ignore に当たるパスと隠しフォルダは読まない。
// prefix はチャンクの Source の頭に付ける名前（"knowledge" や "obsidian"）。
func FromMarkdownDir(dir, prefix string, ignore *Ignore) ([]Chunk, error) {
	var out []Chunk
	err := filepath.WalkDir(dir, func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		rel, _ := filepath.Rel(dir, p)
		rel = filepath.ToSlash(rel)
		if rel == "." {
			return nil
		}
		if strings.HasPrefix(d.Name(), ".") || ignore.Match(rel) {
			if d.IsDir() {
				return fs.SkipDir
			}
			return nil
		}
		if d.IsDir() || !strings.EqualFold(filepath.Ext(p), ".md") {
			return nil
		}
		b, err := os.ReadFile(p)
		if err != nil {
			return err
		}
		title := strings.TrimSuffix(d.Name(), filepath.Ext(d.Name()))
		out = append(out, splitMarkdown(prefix+"/"+rel, title, "", stripFrontmatter(string(b)))...)
		return nil
	})
	return out, err
}

var frontmatterRE = regexp.MustCompile(`(?s)\A---\n.*?\n---\n`)

func stripFrontmatter(s string) string {
	return frontmatterRE.ReplaceAllString(strings.ReplaceAll(s, "\r\n", "\n"), "")
}

var headingRE = regexp.MustCompile(`(?m)^#{1,6}\s+(.+)$`)

// splitMarkdown は見出しごとに分け、長い節はさらに段落で分ける。見出しは本文の頭に残す。
func splitMarkdown(source, title, url, md string) []Chunk {
	locs := headingRE.FindAllStringIndex(md, -1)
	if len(locs) == 0 {
		return splitText(source, title, url, md)
	}
	var out []Chunk
	if pre := md[:locs[0][0]]; strings.TrimSpace(pre) != "" {
		out = append(out, splitText(source, title, url, pre)...)
	}
	for i, loc := range locs {
		end := len(md)
		if i+1 < len(locs) {
			end = locs[i+1][0]
		}
		out = append(out, splitText(source, title, url, md[loc[0]:end])...)
	}
	return out
}

// splitText は maxChunkChars を超えないよう段落（空行）単位でまとめる。
func splitText(source, title, url, text string) []Chunk {
	var out []Chunk
	var cur strings.Builder
	flush := func() {
		if s := strings.TrimSpace(cur.String()); s != "" {
			out = append(out, Chunk{Source: source, Title: title, URL: url, Body: s})
		}
		cur.Reset()
	}
	for _, para := range strings.Split(text, "\n\n") {
		for len([]rune(para)) > maxChunkChars {
			r := []rune(para)
			flush()
			cur.WriteString(string(r[:maxChunkChars]))
			flush()
			para = string(r[maxChunkChars:])
		}
		if len([]rune(cur.String()))+len([]rune(para)) > maxChunkChars {
			flush()
		}
		cur.WriteString(para)
		cur.WriteString("\n\n")
	}
	flush()
	return out
}

// Ignore は obsidianignore（.gitignore と同じ書き方）の簡易版。
// 対応: 空行と # のコメント、先頭 / で Vault 直下に固定、末尾 /、* ? **。否定（!）は未対応で無視する。
type Ignore struct {
	res []*regexp.Regexp
}

func LoadIgnore(path string) (*Ignore, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	ig := &Ignore{}
	sc := bufio.NewScanner(f)
	for sc.Scan() {
		ig.Add(sc.Text())
	}
	return ig, sc.Err()
}

func (ig *Ignore) Add(line string) {
	line = strings.TrimSpace(line)
	if line == "" || strings.HasPrefix(line, "#") || strings.HasPrefix(line, "!") {
		return
	}
	line = strings.TrimSuffix(line, "/")
	anchored := strings.HasPrefix(line, "/") || strings.Contains(strings.TrimPrefix(line, "/"), "/")
	line = strings.TrimPrefix(line, "/")

	var b strings.Builder
	for i := 0; i < len(line); i++ {
		switch {
		case strings.HasPrefix(line[i:], "**/"):
			b.WriteString("(.*/)?")
			i += 2
		case strings.HasPrefix(line[i:], "**"):
			b.WriteString(".*")
			i++
		case line[i] == '*':
			b.WriteString("[^/]*")
		case line[i] == '?':
			b.WriteString("[^/]")
		default:
			b.WriteString(regexp.QuoteMeta(line[i : i+1]))
		}
	}
	prefix := "(^|.*/)"
	if anchored {
		prefix = "^"
	}
	ig.res = append(ig.res, regexp.MustCompile(prefix+b.String()+"(/.*)?$"))
}

// Match は Vault からの相対パス（/ 区切り）が除外対象かを返す。
func (ig *Ignore) Match(rel string) bool {
	if ig == nil {
		return false
	}
	for _, re := range ig.res {
		if re.MatchString(rel) {
			return true
		}
	}
	return false
}
