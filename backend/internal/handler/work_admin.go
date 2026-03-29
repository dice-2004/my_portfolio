package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/dice/portfolio/internal/repository"
)

// POST /api/admin/works — 作品の新規作成
func CreateWork(c *gin.Context) {
	// JSONリクエストボディを一時的な無名構造体で直接受け取る
	var input struct {
		Title       string `json:"title"       binding:"required"`
		Description string `json:"description" binding:"required"`
		ImageURL    string `json:"image_url"`
		GithubURL   string `json:"github_url"`
		Period      string `json:"period"`
		Team        string `json:"team"`
		Tech        string `json:"tech"`
	}

	// binding:"required" があるフィールドが空ならGinが自動で400を返す
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := repository.CreateWork(input.Title, input.Description, input.ImageURL, input.GithubURL, input.Period, input.Team, input.Tech)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create work"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Work created successfully"})
}

// PUT /api/admin/works/:id — 作品の更新
func UpdateWork(c *gin.Context) {
	// URLの ":id" 部分を取り出してintに変換する
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var input struct {
		Title       string `json:"title"       binding:"required"`
		Description string `json:"description" binding:"required"`
		ImageURL    string `json:"image_url"`
		GithubURL   string `json:"github_url"`
		Period      string `json:"period"`
		Team        string `json:"team"`
		Tech        string `json:"tech"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = repository.UpdateWork(id, input.Title, input.Description, input.ImageURL, input.GithubURL, input.Period, input.Team, input.Tech, time.Now())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update work"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Work updated successfully"})
}

// DELETE /api/admin/works/:id — 作品の削除
func DeleteWork(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	err = repository.DeleteWork(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete work"})
		return
	}
	// 削除成功は「内容なし（204 No Content）」で返すのが REST の慣例
	c.Status(http.StatusNoContent)
}
func UpdateWorksOrder(c *gin.Context) {
	var input []struct {
		ID    int64 `json:"id"`
		Order int   `json:"order"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	for _, item := range input {
		if err := repository.UpdateWorkSortOrder(item.ID, item.Order); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update work order"})
			return
		}
	}
	c.JSON(http.StatusOK, gin.H{"message": "Work order updated"})
}
