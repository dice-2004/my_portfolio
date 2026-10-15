package ai

import (
	"context"
	"database/sql"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"sync/atomic"
	"testing"

	_ "modernc.org/sqlite"
)

func TestIgnore(t *testing.T) {
	ig := &Ignore{}
	for _, l := range []string{"# コメント", "/音声文字起こし", "日記/", "*.secret.md", "private/**/draft.md", "!例外は未対応"} {
		ig.Add(l)
	}
	cases := map[string]bool{
		"音声文字起こし":               true,
		"音声文字起こし/2026-10-01.md": true,
		"sub/音声文字起こし/a.md":      false, // 先頭 / なので Vault 直下だけ
		"日記":                    true,
		"a/日記/b.md":             true,
		"memo.secret.md":        true,
		"a/memo.secret.md":      true,
		"private/x/y/draft.md":  true,
		"private/draft.md":      true,
		"技術メモ/Go.md":            false,
	}
	for p, want := range cases {
		if got := ig.Match(p); got != want {
			t.Errorf("Match(%q) = %v, want %v", p, got, want)
		}
	}
}

func TestFromMarkdownDirSkipsIgnoredAndHidden(t *testing.T) {
	dir := t.TempDir()
	write := func(rel, body string) {
		p := filepath.Join(dir, rel)
		os.MkdirAll(filepath.Dir(p), 0o755)
		os.WriteFile(p, []byte(body), 0o644)
	}
	write("公開/Go.md", "---\ntags: [go]\n---\n# Go\nGo のメモ")
	write("非公開/秘密.md", "見せない")
	write(".obsidian/x.md", "設定")
	write("画像.png", "png")

	ig := &Ignore{}
	ig.Add("/非公開")
	chunks, err := FromMarkdownDir(dir, "obsidian", ig)
	if err != nil {
		t.Fatal(err)
	}
	if len(chunks) != 1 || chunks[0].Source != "obsidian/公開/Go.md" || strings.Contains(chunks[0].Body, "tags") {
		t.Fatalf("chunks = %+v", chunks)
	}
}

func TestSplitTextLimit(t *testing.T) {
	long := strings.Repeat("あ", maxChunkChars*2+10)
	chunks := splitMarkdown("s", "t", "", "# 見出し\n"+long+"\n\n短い段落")
	if len(chunks) < 3 {
		t.Fatalf("len = %d", len(chunks))
	}
	for _, c := range chunks {
		if n := len([]rune(c.Body)); n > maxChunkChars {
			t.Errorf("chunk too long: %d", n)
		}
	}
}

// fakeGemini は文中の「Go」「C言語」の有無で 2 次元のベクトルを返し、回答は固定文にする。
func fakeGemini(t *testing.T, embedCalls *int32) *Gemini {
	vec := func(s string) []float32 {
		v := []float32{0.01, 0.01}
		if strings.Contains(s, "Go") {
			v[0] = 1
		}
		if strings.Contains(s, "C言語") {
			v[1] = 1
		}
		return v
	}
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("x-goog-api-key") != "test-key" {
			http.Error(w, "no key", http.StatusUnauthorized)
			return
		}
		b, _ := io.ReadAll(r.Body)
		switch {
		case strings.HasSuffix(r.URL.Path, ":batchEmbedContents"):
			atomic.AddInt32(embedCalls, 1)
			var in struct {
				Requests []embedRequest `json:"requests"`
			}
			json.Unmarshal(b, &in)
			var out []map[string]any
			for _, rq := range in.Requests {
				out = append(out, map[string]any{"values": vec(rq.Content.Parts[0].Text)})
			}
			json.NewEncoder(w).Encode(map[string]any{"embeddings": out})
		case strings.HasSuffix(r.URL.Path, ":embedContent"):
			var in embedRequest
			json.Unmarshal(b, &in)
			json.NewEncoder(w).Encode(map[string]any{"embedding": map[string]any{"values": vec(in.Content.Parts[0].Text)}})
		case strings.HasSuffix(r.URL.Path, ":generateContent"):
			if !strings.Contains(string(b), "Go の API サーバー") {
				http.Error(w, "資料が渡っていない", http.StatusBadRequest)
				return
			}
			json.NewEncoder(w).Encode(map[string]any{"candidates": []any{map[string]any{"content": map[string]any{"parts": []any{map[string]any{"text": " dice は Go を使います。 "}}}}}})
		default:
			http.NotFound(w, r)
		}
	}))
	t.Cleanup(srv.Close)
	return &Gemini{APIKey: "test-key", BaseURL: srv.URL, ChatModel: "chat", EmbedModel: "embed", HTTP: srv.Client()}
}

func newTestDB(t *testing.T) *sql.DB {
	db, err := sql.Open("sqlite", filepath.Join(t.TempDir(), "t.db"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { db.Close() })
	schema, err := os.ReadFile(filepath.Join("..", "..", "migrations", "001_init.sql"))
	if err != nil {
		t.Fatal(err)
	}
	if _, err := db.Exec(string(schema)); err != nil {
		t.Fatal(err)
	}
	return db
}

func TestIndexRefreshSearchAnswer(t *testing.T) {
	var calls int32
	g := fakeGemini(t, &calls)
	docs := []Chunk{
		{Source: "works/1", Title: "API", URL: "/works/1", Body: "Go の API サーバー"},
		{Source: "works/2", Title: "オセロ", URL: "/works/2", Body: "C言語 のオセロ"},
	}
	ix := &Index{DB: newTestDB(t), Gemini: g, Collect: func() ([]Chunk, error) { return docs, nil }}
	ctx := context.Background()

	if pending, err := ix.Refresh(ctx); err != nil || pending != 0 || ix.Len() != 2 {
		t.Fatalf("pending=%d len=%d err=%v", pending, ix.Len(), err)
	}
	// 変わっていなければ埋め込みを作り直さない
	ix.Refresh(ctx)
	if calls != 1 {
		t.Fatalf("embed calls = %d", calls)
	}

	hits := ix.Search([]float32{1, 0}, 1)
	if len(hits) != 1 || hits[0].URL != "/works/1" {
		t.Fatalf("hits = %+v", hits)
	}

	answer, sources, err := Answer(ctx, g, ix, "Go は使えますか", nil)
	if err != nil || answer != "dice は Go を使います。" || len(sources) == 0 || sources[0].URL != "/works/1" {
		t.Fatalf("answer=%q sources=%+v err=%v", answer, sources, err)
	}

	// 材料から消えたチャンクは削除される
	docs = docs[:1]
	ix.Refresh(ctx)
	if ix.Len() != 1 {
		t.Fatalf("len after removal = %d", ix.Len())
	}
}

func TestIndexWithoutKeyEmbedsNothing(t *testing.T) {
	g := &Gemini{EmbedModel: "embed"}
	ix := &Index{DB: newTestDB(t), Gemini: g, Collect: func() ([]Chunk, error) {
		return []Chunk{{Source: "a", Title: "a", Body: "a"}}, nil
	}}
	pending, err := ix.Refresh(context.Background())
	if err != nil || pending != 1 || ix.Len() != 0 {
		t.Fatalf("pending=%d len=%d err=%v", pending, ix.Len(), err)
	}
}
