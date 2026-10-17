package handler

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/dice/portfolio/internal/ai"
)

// Chat は POST /api/chat。Gemini の無料枠を超えないよう、1 日の合計と IP ごとの回数を制限する。
type Chat struct {
	Gemini *ai.Gemini
	Index  *ai.Index
	Limit  *Limiter
}

const (
	maxQuestionChars = 500
	maxHistoryTurns  = 6
	maxTurnChars     = 1200
)

type chatRequest struct {
	Question string    `json:"question"`
	History  []ai.Turn `json:"history"`
}

func (h *Chat) Status(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"enabled":   h.Gemini.Enabled(),
		"ready":     h.Gemini.Enabled() && h.Index.Len() > 0,
		"model":     h.Gemini.ChatModel,
		"remaining": h.Limit.Remaining(),
		"problem":   h.Index.Problem(),
	})
}

// accept は質問を受け付けられるかを確かめ、回数を 1 回分使う。だめなときはエラーを返して false。
func (h *Chat) accept(c *gin.Context) (string, []ai.Turn, bool) {
	if !h.Gemini.Enabled() {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "AI での回答はまだ準備中です。"})
		return "", nil, false
	}
	if h.Index.Len() == 0 {
		msg := "回答に使う資料を準備しています。少し待ってからもう一度試してください。"
		if p := h.Index.Problem(); p != "" {
			msg = "AI の準備ができていません（" + p + "）。"
		}
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": msg})
		return "", nil, false
	}

	var req chatRequest
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 32<<10)
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "リクエストの形式が正しくありません。"})
		return "", nil, false
	}
	q := strings.TrimSpace(req.Question)
	if q == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "質問が空です。"})
		return "", nil, false
	}
	if len([]rune(q)) > maxQuestionChars {
		c.JSON(http.StatusBadRequest, gin.H{"error": "質問は 500 文字以内にしてください。"})
		return "", nil, false
	}

	if msg := h.Limit.Take(clientIP(c)); msg != "" {
		c.JSON(http.StatusTooManyRequests, gin.H{"error": msg})
		return "", nil, false
	}
	return q, cleanHistory(req.History), true
}

// answerError は Gemini のエラーを訪問者向けの文と HTTP ステータスにする。
func answerError(err error) (int, string) {
	log.Printf("AI チャットのエラー: %v", err)
	var apiErr *ai.APIError
	if errors.As(err, &apiErr) && apiErr.Status == http.StatusTooManyRequests {
		return http.StatusTooManyRequests, "AI の無料枠の上限に達しました。時間をおいて試してください。"
	}
	return http.StatusBadGateway, "AI からの回答を取得できませんでした。もう一度試してください。"
}

func (h *Chat) Post(c *gin.Context) {
	q, history, ok := h.accept(c)
	if !ok {
		return
	}
	ctx, cancel := context.WithTimeout(c.Request.Context(), 45*time.Second)
	defer cancel()
	answer, sources, err := ai.Answer(ctx, h.Gemini, h.Index, q, history)
	if err != nil {
		status, msg := answerError(err)
		c.JSON(status, gin.H{"error": msg})
		return
	}
	c.JSON(http.StatusOK, gin.H{"answer": answer, "sources": sources})
}

// Stream は POST /api/chat/stream。Post と同じ回答を Server-Sent Events で少しずつ返す。
// 回数の数え方は Post と同じ（質問 1 回につき 1 回）。訪問者が止めると Gemini への通信も切る。
//
//	event: delta  data: {"text": "…"}            届いた分の文章
//	event: done   data: {"answer": "…", "sources": […]}  整えた全文と出典
//	event: error  data: {"error": "…"}           途中で失敗した
//
// 最初の文章が届く前に失敗したときは、Post と同じく JSON とステータスコードで返す。
func (h *Chat) Stream(c *gin.Context) {
	q, history, ok := h.accept(c)
	if !ok {
		return
	}
	ctx, cancel := context.WithTimeout(c.Request.Context(), 45*time.Second)
	defer cancel()

	started := false
	send := func(event string, data any) {
		if !started {
			started = true
			hd := c.Writer.Header()
			hd.Set("Content-Type", "text/event-stream; charset=utf-8")
			hd.Set("Cache-Control", "no-cache, no-transform")
			hd.Set("X-Accel-Buffering", "no")
			c.Status(http.StatusOK)
		}
		b, _ := json.Marshal(data)
		fmt.Fprintf(c.Writer, "event: %s\ndata: %s\n\n", event, b)
		c.Writer.Flush()
	}

	answer, sources, err := ai.AnswerStream(ctx, h.Gemini, h.Index, q, history, func(t string) {
		send("delta", gin.H{"text": t})
	})
	if err != nil {
		if c.Request.Context().Err() != nil {
			return // 訪問者が止めた
		}
		status, msg := answerError(err)
		if !started {
			c.JSON(status, gin.H{"error": msg})
			return
		}
		send("error", gin.H{"error": msg})
		return
	}
	if sources == nil {
		sources = []ai.Source{}
	}
	send("done", gin.H{"answer": answer, "sources": sources})
}

// cleanHistory は直近の会話だけを残し、user から始まって交互になるよう整える。
func cleanHistory(in []ai.Turn) []ai.Turn {
	if len(in) > maxHistoryTurns {
		in = in[len(in)-maxHistoryTurns:]
	}
	var out []ai.Turn
	for _, t := range in {
		if t.Role != "user" && t.Role != "assistant" {
			continue
		}
		text := strings.TrimSpace(t.Text)
		if r := []rune(text); len(r) > maxTurnChars {
			text = string(r[:maxTurnChars])
		}
		if text == "" || (len(out) == 0 && t.Role != "user") {
			continue
		}
		if len(out) > 0 && out[len(out)-1].Role == t.Role {
			out[len(out)-1].Text += "\n" + text
			continue
		}
		out = append(out, ai.Turn{Role: t.Role, Text: text})
	}
	// 最後は assistant で終わらせる（このあと新しい質問を user として足すため）
	if len(out) > 0 && out[len(out)-1].Role == "user" {
		out = out[:len(out)-1]
	}
	return out
}

// Cloudflare Tunnel → Next.js の rewrite → バックエンド、と経由するので、
// 訪問者の IP は CF-Connecting-IP か X-Forwarded-For の先頭から取る。
func clientIP(c *gin.Context) string {
	if ip := strings.TrimSpace(c.GetHeader("CF-Connecting-IP")); net.ParseIP(ip) != nil {
		return ip
	}
	if xff := c.GetHeader("X-Forwarded-For"); xff != "" {
		if ip := strings.TrimSpace(strings.Split(xff, ",")[0]); net.ParseIP(ip) != nil {
			return ip
		}
	}
	return c.ClientIP()
}

// Limiter は 1 日の合計回数と、IP ごとの 1 分・1 日の回数を数える。
// 日付は Gemini の無料枠がリセットされる米国太平洋時間で区切る。
type Limiter struct {
	Daily     int
	PerMinute int
	PerIPDay  int
	Now       func() time.Time

	mu    sync.Mutex
	day   string
	total int
	byIP  map[string]*ipCount
}

type ipCount struct {
	day    int
	recent []time.Time
}

var pacific = func() *time.Location {
	if loc, err := time.LoadLocation("America/Los_Angeles"); err == nil {
		return loc
	}
	return time.FixedZone("PST", -8*60*60)
}()

func NewLimiterFromEnv() *Limiter {
	daily := 400
	if v, err := strconv.Atoi(os.Getenv("CHAT_DAILY_LIMIT")); err == nil && v > 0 {
		daily = v
	}
	return &Limiter{Daily: daily, PerMinute: 5, PerIPDay: 30, Now: time.Now}
}

func (l *Limiter) roll(now time.Time) {
	if d := now.In(pacific).Format("2006-01-02"); d != l.day {
		l.day, l.total, l.byIP = d, 0, map[string]*ipCount{}
	}
}

// Take は 1 回分を使う。使えないときは理由を返す。
func (l *Limiter) Take(ip string) string {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := l.Now()
	l.roll(now)

	if l.total >= l.Daily {
		return "今日の AI 回答の回数上限に達しました。明日また試してください。"
	}
	ic := l.byIP[ip]
	if ic == nil {
		ic = &ipCount{}
		l.byIP[ip] = ic
	}
	recent := ic.recent[:0]
	for _, t := range ic.recent {
		if now.Sub(t) < time.Minute {
			recent = append(recent, t)
		}
	}
	ic.recent = recent
	if ic.day >= l.PerIPDay {
		return "今日はこれ以上質問できません。明日また試してください。"
	}
	if len(ic.recent) >= l.PerMinute {
		return "質問が続いています。1 分ほど待ってから試してください。"
	}
	ic.day++
	ic.recent = append(ic.recent, now)
	l.total++
	return ""
}

func (l *Limiter) Remaining() int {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.roll(l.Now())
	return max(0, l.Daily-l.total)
}
