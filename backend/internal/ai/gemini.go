// Package ai は AI チャット（Gemini API の無料枠）まわりをまとめる。
// 埋め込みはコンテンツが変わったときだけ作り、質問ごとに使うのは「質問の埋め込み 1 回 + 回答 1 回」。
package ai

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

// ErrNoKey は GEMINI_API_KEY が設定されていないときに返る。
var ErrNoKey = errors.New("GEMINI_API_KEY が設定されていません")

type Gemini struct {
	APIKey     string
	BaseURL    string
	ChatModel  string
	EmbedModel string
	EmbedDims  int
	HTTP       *http.Client
}

func env(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

// NewGeminiFromEnv は環境変数から設定を読む。キーはバックエンドだけが持つ。
func NewGeminiFromEnv() *Gemini {
	return &Gemini{
		APIKey:     os.Getenv("GEMINI_API_KEY"),
		BaseURL:    env("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta"),
		ChatModel:  env("GEMINI_CHAT_MODEL", "gemini-flash-lite-latest"),
		EmbedModel: env("GEMINI_EMBED_MODEL", "gemini-embedding-001"),
		EmbedDims:  768,
		HTTP:       &http.Client{Timeout: 60 * time.Second},
	}
}

func (g *Gemini) Enabled() bool { return g != nil && g.APIKey != "" }

// APIError は Gemini が 2xx 以外を返したときのエラー。429 は無料枠の上限。
type APIError struct {
	Status int
	Body   string
}

func (e *APIError) Error() string { return fmt.Sprintf("gemini: HTTP %d: %s", e.Status, e.Body) }

func apiError(status int, b []byte) *APIError {
	var e struct {
		Error struct {
			Message string `json:"message"`
		} `json:"error"`
	}
	msg := string(b)
	if json.Unmarshal(b, &e) == nil && e.Error.Message != "" {
		msg = e.Error.Message
	}
	if r := []rune(msg); len(r) > 300 {
		msg = string(r[:300])
	}
	return &APIError{Status: status, Body: msg}
}

func (g *Gemini) post(ctx context.Context, path string, in, out any) error {
	if !g.Enabled() {
		return ErrNoKey
	}
	body, err := json.Marshal(in)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, g.BaseURL+path, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-goog-api-key", g.APIKey)
	res, err := g.HTTP.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	b, err := io.ReadAll(io.LimitReader(res.Body, 4<<20))
	if err != nil {
		return err
	}
	if res.StatusCode/100 != 2 {
		return apiError(res.StatusCode, b)
	}
	return json.Unmarshal(b, out)
}

type part struct {
	Text string `json:"text"`
}

type content struct {
	Role  string `json:"role,omitempty"`
	Parts []part `json:"parts"`
}

type embedRequest struct {
	Model                string  `json:"model"`
	Content              content `json:"content"`
	TaskType             string  `json:"taskType"`
	Title                string  `json:"title,omitempty"`
	OutputDimensionality int     `json:"outputDimensionality,omitempty"`
}

// EmbedDocuments は資料をまとめて埋め込む（1 リクエスト最大 100 件）。
func (g *Gemini) EmbedDocuments(ctx context.Context, docs []Chunk) ([][]float32, error) {
	reqs := make([]embedRequest, len(docs))
	for i, d := range docs {
		reqs[i] = embedRequest{
			Model:                "models/" + g.EmbedModel,
			Content:              content{Parts: []part{{Text: d.Body}}},
			TaskType:             "RETRIEVAL_DOCUMENT",
			Title:                d.Title,
			OutputDimensionality: g.EmbedDims,
		}
	}
	var out struct {
		Embeddings []struct {
			Values []float32 `json:"values"`
		} `json:"embeddings"`
	}
	if err := g.post(ctx, "/models/"+g.EmbedModel+":batchEmbedContents", map[string]any{"requests": reqs}, &out); err != nil {
		return nil, err
	}
	if len(out.Embeddings) != len(docs) {
		return nil, fmt.Errorf("gemini: 埋め込みの件数が合いません (%d / %d)", len(out.Embeddings), len(docs))
	}
	vecs := make([][]float32, len(docs))
	for i, e := range out.Embeddings {
		vecs[i] = e.Values
	}
	return vecs, nil
}

// EmbedQuery は質問文を埋め込む。
func (g *Gemini) EmbedQuery(ctx context.Context, q string) ([]float32, error) {
	in := embedRequest{
		Model:                "models/" + g.EmbedModel,
		Content:              content{Parts: []part{{Text: q}}},
		TaskType:             "RETRIEVAL_QUERY",
		OutputDimensionality: g.EmbedDims,
	}
	var out struct {
		Embedding struct {
			Values []float32 `json:"values"`
		} `json:"embedding"`
	}
	if err := g.post(ctx, "/models/"+g.EmbedModel+":embedContent", in, &out); err != nil {
		return nil, err
	}
	return out.Embedding.Values, nil
}

func generateRequest(system string, turns []Turn) map[string]any {
	contents := make([]content, len(turns))
	for i, t := range turns {
		role := "user"
		if t.Role == "assistant" {
			role = "model"
		}
		contents[i] = content{Role: role, Parts: []part{{Text: t.Text}}}
	}
	return map[string]any{
		"systemInstruction": content{Parts: []part{{Text: system}}},
		"contents":          contents,
		"generationConfig":  map[string]any{"temperature": 0.3, "maxOutputTokens": 800},
	}
}

type generateResponse struct {
	Candidates []struct {
		Content content `json:"content"`
	} `json:"candidates"`
}

func (r generateResponse) text() string {
	if len(r.Candidates) == 0 {
		return ""
	}
	var text string
	for _, p := range r.Candidates[0].Content.Parts {
		text += p.Text
	}
	return text
}

// Generate は system と会話履歴から回答を 1 つ作る。
func (g *Gemini) Generate(ctx context.Context, system string, turns []Turn) (string, error) {
	var out generateResponse
	if err := g.post(ctx, "/models/"+g.ChatModel+":generateContent", generateRequest(system, turns), &out); err != nil {
		return "", err
	}
	if len(out.Candidates) == 0 {
		return "", errors.New("gemini: 回答が空でした")
	}
	return out.text(), nil
}

// GenerateStream は Generate と同じ回答を、届いた分から onText に渡しながら作る（streamGenerateContent の SSE）。
// Gemini が 2xx 以外を返したときは onText を 1 度も呼ばずに APIError を返す。
func (g *Gemini) GenerateStream(ctx context.Context, system string, turns []Turn, onText func(string)) (string, error) {
	if !g.Enabled() {
		return "", ErrNoKey
	}
	body, err := json.Marshal(generateRequest(system, turns))
	if err != nil {
		return "", err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, g.BaseURL+"/models/"+g.ChatModel+":streamGenerateContent?alt=sse", bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-goog-api-key", g.APIKey)
	res, err := g.HTTP.Do(req)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()
	if res.StatusCode/100 != 2 {
		b, _ := io.ReadAll(io.LimitReader(res.Body, 64<<10))
		return "", apiError(res.StatusCode, b)
	}

	var text strings.Builder
	sc := bufio.NewScanner(res.Body)
	sc.Buffer(make([]byte, 64<<10), 4<<20)
	for sc.Scan() {
		data, ok := strings.CutPrefix(sc.Text(), "data:")
		if !ok {
			continue
		}
		var chunk generateResponse
		if err := json.Unmarshal([]byte(strings.TrimSpace(data)), &chunk); err != nil {
			return text.String(), fmt.Errorf("gemini: ストリームを読めません: %w", err)
		}
		if t := chunk.text(); t != "" {
			text.WriteString(t)
			onText(t)
		}
	}
	if err := sc.Err(); err != nil {
		return text.String(), err
	}
	if text.Len() == 0 {
		return "", errors.New("gemini: 回答が空でした")
	}
	return text.String(), nil
}
