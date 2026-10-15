package handler

import (
	"testing"
	"time"

	"github.com/dice/portfolio/internal/ai"
)

func TestLimiter(t *testing.T) {
	now := time.Date(2026, 10, 15, 12, 0, 0, 0, time.UTC)
	l := &Limiter{Daily: 7, PerMinute: 2, PerIPDay: 3, Now: func() time.Time { return now }}

	if l.Take("a") != "" || l.Take("a") != "" {
		t.Fatal("first two should pass")
	}
	if l.Take("a") == "" {
		t.Fatal("third within a minute should be limited")
	}
	now = now.Add(61 * time.Second)
	if l.Take("a") != "" {
		t.Fatal("should pass after a minute")
	}
	if l.Take("a") == "" {
		t.Fatal("per-IP daily limit")
	}
	for _, ip := range []string{"b", "b", "c", "c"} {
		l.Take(ip)
	}
	if l.Remaining() != 0 || l.Take("d") == "" {
		t.Fatalf("daily total limit, remaining=%d", l.Remaining())
	}
	now = now.Add(24 * time.Hour)
	if l.Remaining() != 7 || l.Take("a") != "" {
		t.Fatal("should reset next day")
	}
}

func TestCleanHistory(t *testing.T) {
	in := []ai.Turn{
		{Role: "assistant", Text: "先頭の assistant は捨てる"},
		{Role: "user", Text: "Q1"},
		{Role: "assistant", Text: "A1"},
		{Role: "system", Text: "無視"},
		{Role: "user", Text: "Q2"},
	}
	out := cleanHistory(in)
	if len(out) != 2 || out[0].Text != "Q1" || out[1].Text != "A1" {
		t.Fatalf("out = %+v", out)
	}
}
