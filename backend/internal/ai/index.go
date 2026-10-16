package ai

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/binary"
	"encoding/hex"
	"errors"
	"log"
	"math"
	"sort"
	"sync"
)

// 1 回の Refresh で埋め込む文字数の上限。30 秒ごとに呼ぶと 1 分あたり約 2.4 万文字で、
// 無料枠の 3 万トークン/分に収まる。残りは次の Refresh に回す。
const embedCharsPerRefresh = 12000

type entry struct {
	Chunk
	vec  []float32
	norm float64
}

// Index はチャンクの埋め込みを SQLite（chunks テーブル）に保存し、検索用にメモリにも持つ。
type Index struct {
	DB      *sql.DB
	Gemini  *Gemini
	Collect func() ([]Chunk, error)

	mu      sync.RWMutex
	entries []entry
	loaded  string // メモリに載っている集合のハッシュ。変わったときだけ読み直す
	lastErr string
	problem string // 画面に出す、埋め込みが作れない理由
}

func (ix *Index) hashOf(c Chunk) string {
	sum := sha256.Sum256([]byte(ix.Gemini.EmbedModel + "\x00" + c.Source + "\x00" + c.Title + "\x00" + c.URL + "\x00" + c.Body))
	return hex.EncodeToString(sum[:])
}

func (ix *Index) logOnce(msg string) {
	if msg != ix.lastErr && msg != "" {
		log.Print(msg)
	}
	ix.lastErr = msg
}

// Refresh は材料を集め直し、まだ埋め込みが無いチャンクを予算の範囲で埋め込み、消えたチャンクを削除する。
// 戻り値は埋め込み待ちのチャンク数。
func (ix *Index) Refresh(ctx context.Context) (pending int, err error) {
	chunks, err := ix.Collect()
	if err != nil {
		return 0, err
	}

	want := map[string]Chunk{}
	var order []string
	for _, c := range chunks {
		h := ix.hashOf(c)
		if _, dup := want[h]; !dup {
			want[h] = c
			order = append(order, h)
		}
	}

	have := map[string]bool{}
	rows, err := ix.DB.QueryContext(ctx, "SELECT hash FROM chunks")
	if err != nil {
		return 0, err
	}
	for rows.Next() {
		var h string
		if err := rows.Scan(&h); err != nil {
			rows.Close()
			return 0, err
		}
		have[h] = true
	}
	rows.Close()

	var missing []string
	for _, h := range order {
		if !have[h] {
			missing = append(missing, h)
		}
	}

	// 予算内で埋め込む
	if len(missing) > 0 && ix.Gemini.Enabled() {
		var batch []string
		chars := 0
		for _, h := range missing {
			n := len([]rune(want[h].Body))
			if len(batch) > 0 && (chars+n > embedCharsPerRefresh || len(batch) == 100) {
				break
			}
			batch = append(batch, h)
			chars += n
		}
		docs := make([]Chunk, len(batch))
		for i, h := range batch {
			docs[i] = want[h]
		}
		vecs, err := ix.Gemini.EmbedDocuments(ctx, docs)
		if err != nil {
			ix.logOnce("埋め込みの作成に失敗しました（次回また試します）: " + err.Error())
			ix.setProblem(describe(err))
		} else {
			ix.logOnce("")
			ix.setProblem("")
			tx, err := ix.DB.BeginTx(ctx, nil)
			if err != nil {
				return 0, err
			}
			for i, h := range batch {
				c := want[h]
				if _, err := tx.Exec(
					"INSERT OR REPLACE INTO chunks (hash, source, title, url, body, embedding) VALUES (?, ?, ?, ?, ?, ?)",
					h, c.Source, c.Title, c.URL, c.Body, encodeVec(vecs[i]),
				); err != nil {
					tx.Rollback()
					return 0, err
				}
				have[h] = true
			}
			if err := tx.Commit(); err != nil {
				return 0, err
			}
			log.Printf("AI 用の埋め込みを %d 件作りました", len(batch))
		}
	}

	// 材料から消えたチャンクを削除する
	for h := range have {
		if _, ok := want[h]; !ok {
			if _, err := ix.DB.ExecContext(ctx, "DELETE FROM chunks WHERE hash = ?", h); err != nil {
				return 0, err
			}
			delete(have, h)
		}
	}

	pending = 0
	setSum := sha256.New()
	for _, h := range order {
		if have[h] {
			setSum.Write([]byte(h))
		} else {
			pending++
		}
	}
	if set := hex.EncodeToString(setSum.Sum(nil)); set != ix.loaded {
		if err := ix.load(ctx); err != nil {
			return pending, err
		}
		ix.loaded = set
	}
	return pending, nil
}

func (ix *Index) load(ctx context.Context) error {
	rows, err := ix.DB.QueryContext(ctx, "SELECT source, title, url, body, embedding FROM chunks")
	if err != nil {
		return err
	}
	defer rows.Close()
	var entries []entry
	for rows.Next() {
		var e entry
		var blob []byte
		if err := rows.Scan(&e.Source, &e.Title, &e.URL, &e.Body, &blob); err != nil {
			return err
		}
		e.vec = decodeVec(blob)
		e.norm = norm(e.vec)
		entries = append(entries, e)
	}
	if err := rows.Err(); err != nil {
		return err
	}
	ix.mu.Lock()
	ix.entries = entries
	ix.mu.Unlock()
	return nil
}

func (ix *Index) setProblem(p string) {
	ix.mu.Lock()
	ix.problem = p
	ix.mu.Unlock()
}

// Problem は埋め込みが作れていない理由（無ければ空）。
func (ix *Index) Problem() string {
	ix.mu.RLock()
	defer ix.mu.RUnlock()
	return ix.problem
}

// describe は Gemini のエラーを、サイトの持ち主が対処できる言葉にする。
func describe(err error) string {
	var apiErr *APIError
	if errors.As(err, &apiErr) {
		switch apiErr.Status {
		case 400, 401, 403:
			return "Gemini API キーが正しくないか、使えない状態です"
		case 404:
			return "Gemini のモデル名が見つかりません"
		case 429:
			return "Gemini の無料枠の上限に達しています"
		}
	}
	return "Gemini に接続できません"
}

// Len は検索できるチャンクの数。
func (ix *Index) Len() int {
	ix.mu.RLock()
	defer ix.mu.RUnlock()
	return len(ix.entries)
}

type Hit struct {
	Chunk
	Score float64
}

// Search はコサイン類似度の高い順に k 件返す。
func (ix *Index) Search(q []float32, k int) []Hit {
	qn := norm(q)
	ix.mu.RLock()
	defer ix.mu.RUnlock()
	hits := make([]Hit, 0, len(ix.entries))
	for _, e := range ix.entries {
		if len(e.vec) != len(q) || e.norm == 0 || qn == 0 {
			continue
		}
		var dot float64
		for i := range q {
			dot += float64(q[i]) * float64(e.vec[i])
		}
		hits = append(hits, Hit{Chunk: e.Chunk, Score: dot / (qn * e.norm)})
	}
	sort.Slice(hits, func(i, j int) bool { return hits[i].Score > hits[j].Score })
	if len(hits) > k {
		hits = hits[:k]
	}
	return hits
}

func norm(v []float32) float64 {
	var s float64
	for _, x := range v {
		s += float64(x) * float64(x)
	}
	return math.Sqrt(s)
}

func encodeVec(v []float32) []byte {
	b := make([]byte, 4*len(v))
	for i, x := range v {
		binary.LittleEndian.PutUint32(b[4*i:], math.Float32bits(x))
	}
	return b
}

func decodeVec(b []byte) []float32 {
	v := make([]float32, len(b)/4)
	for i := range v {
		v[i] = math.Float32frombits(binary.LittleEndian.Uint32(b[4*i:]))
	}
	return v
}
