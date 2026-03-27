package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/dice/portfolio/internal/repository"
)

func CreateTimeline(c *gin.Context) {
	var input struct {
		Title        string `json:"title"         binding:"required"`
		Description  string `json:"description"`
		EventDate    string `json:"event_date"    binding:"required"`
		Category     string `json:"category"      binding:"required"`
		DisplayOrder int64  `json:"display_order"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := repository.CreateTimeline(input.Title, input.Description, input.EventDate, input.Category, input.DisplayOrder); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create timeline"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Timeline created"})
}

func UpdateTimeline(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	var input struct {
		Title        string `json:"title"         binding:"required"`
		Description  string `json:"description"`
		EventDate    string `json:"event_date"    binding:"required"`
		Category     string `json:"category"      binding:"required"`
		DisplayOrder int64  `json:"display_order"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := repository.UpdateTimeline(id, input.Title, input.Description, input.EventDate, input.Category, input.DisplayOrder); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update timeline"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Timeline updated"})
}

func DeleteTimeline(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	if err := repository.DeleteTimeline(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete timeline"})
		return
	}
	c.Status(http.StatusNoContent)
}
