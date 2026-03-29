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
	"github.com/dice/portfolio/internal/middleware"
)

func main(){

	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "portfolio.db"
	}

	repository.InitDB(dbPath)
	repository.RunMigrations()

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
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
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
	r.GET("/api/auth/challenge",handler.GetChallenge)
	r.POST("/api/auth/verify", handler.VerifySignature)
	r.POST("/api/auth/register", handler.RegisterUser)

	// ===== 管理者専用ルートグループ =====
	// このグループ配下のエンドポイントは全て、middleware.AuthRequired()の
	// JWT検証を通過しないとアクセスできません（401が返ります）
	admin := r.Group("/api/admin", middleware.AuthRequired())
	{
		// 疎通確認用：JWTが正しければ200が返る
		admin.GET("/ping", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "Welcome, admin!"})
		})
		// Works のCRUD
		admin.POST("/works",        handler.CreateWork)
		admin.PUT("/works/:id",    handler.UpdateWork)
		admin.PUT("/works/order",  handler.UpdateWorksOrder)
		admin.DELETE("/works/:id", handler.DeleteWork)
		// Skills のCRUD
		admin.POST("/skills",        handler.CreateSkill)
		admin.PUT("/skills/:id",    handler.UpdateSkill)
		admin.PUT("/skills/order",  handler.UpdateSkillsOrder)
		admin.DELETE("/skills/:id", handler.DeleteSkill)
		// Timeline のCRUD
		admin.POST("/timeline",        handler.CreateTimeline)
		admin.PUT("/timeline/:id",    handler.UpdateTimeline)
		admin.DELETE("/timeline/:id", handler.DeleteTimeline)
		// About は1件固定なので PUT のみ
		admin.PUT("/about", handler.UpdateAbout)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server is running on http://localhost:%s", port)


	r.Run(":" + port)
}
