package main

import (
	"log"
	"net/http"
	"os"
	"github.com/gin-gonic/gin"
	"fmt"
	"github.com/gin-contrib/cors"
	"github.com/dice/portfolio/internal/repository"
	"github.com/dice/portfolio/internal/handler"
)

func main(){

	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "portfolio.db"
	}

	repository.InitDB(dbPath)
	repository.RunMigrations()
	repository.SeedData()

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

	// CORS（クロスオリジンリソース共有）を許可するミドルウェアを追加
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3001", "http://localhost:3000", "https://portfolio.dice-ke.tech"},
		AllowMethods:     []string{"GET", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
			"message": "Dice's Portfolio API is running!",
		})
	})

	r.GET("/api/works",handler.GetWorks)
	r.GET("/api/works/:id",handler.GetWork)
	r.GET("/api/skills",handler.GetSkills)
	r.GET("/api/about",handler.GetAbout)
	r.GET("/api/timeline",handler.GetAllTimeline)

	// 静的ファイルの配信
	r.Static("/api/uploads", "./uploads")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server is running on http://localhost:%s", port)


	r.Run(":" + port)
}
