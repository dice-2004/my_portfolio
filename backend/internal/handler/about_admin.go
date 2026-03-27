package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/dice/portfolio/internal/repository"
)

// PUT /api/admin/about — Aboutはレコードが1件固定のため、UPDATEのみ
func UpdateAbout(c *gin.Context) {
	var input struct {
		Content string `json:"content" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := repository.UpdateAbout(input.Content); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update about"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "About updated"})
}
