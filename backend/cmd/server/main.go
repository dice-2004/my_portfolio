package main

import (
	"fmt"
	"github.com/dice/portfolio/internal/ai"
	"github.com/dice/portfolio/internal/handler"
	"github.com/dice/portfolio/internal/repository"
	"github.com/gin-gonic/gin"
	"log"
	"net/http"
	"os"
	"time"
)

func main() {

	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "portfolio.db"
	}

	repository.InitDB(dbPath)
	repository.RunMigrations()
	// seeds/ のファイルを DB に反映し、その後も変更を見張る（git pull だけで反映される）
	repository.SyncContent()
	interval, err := time.ParseDuration(os.Getenv("CONTENT_SYNC_INTERVAL"))
	if err != nil || interval <= 0 {
		interval = 30 * time.Second
	}
	repository.WatchContent(interval)

	gemini := ai.NewGeminiFromEnv()
	if !gemini.Enabled() {
		log.Println("GEMINI_API_KEY が無いので、AI チャットは無効です")
	}
	index := &ai.Index{DB: repository.DB, Gemini: gemini, Collect: collectChunks}
	watchIndex(index, interval)
	chat := &handler.Chat{Gemini: gemini, Index: index, Limit: handler.NewLimiterFromEnv()}

	r := gin.New()
	r.Use(gin.Recovery())

	// カスタムロガーを追加 (メソッド, URL, ステータス, 処理時間などを出力)
	r.Use(gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		return fmt.Sprintf("[%s] %s | %3d | %13v | %15s | %-7s %#v\n",
			param.TimeStamp.Format("2006/01/02 - 15:04:05"),
			param.ClientIP,
			param.StatusCode,
			param.Latency,
			param.Method,
			param.Path,
			param.ErrorMessage,
		)
	}))

	// CORS ミドルウェアは置かない。ブラウザからの API 呼び出しは Next.js の rewrite で同じオリジンになり、
	// 別サイトから読ませる必要もない（以前は Origin の合わない POST が 403 になり、AI チャットが動かなかった）

	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"message": "Dice's Portfolio API is running!",
		})
	})

	r.GET("/api/works", handler.GetWorks)
	r.GET("/api/works/:id", handler.GetWork)
	r.GET("/api/skills", handler.GetSkills)
	r.GET("/api/about", handler.GetAbout)
	r.GET("/api/timeline", handler.GetAllTimeline)
	r.GET("/api/chat/status", chat.Status)
	r.POST("/api/chat", chat.Post)

	// 静的ファイルの配信
	r.Static("/api/uploads", "./uploads")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server is running on http://localhost:%s", port)

	r.Run(":" + port)
}
