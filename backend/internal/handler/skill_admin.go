package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/dice/portfolio/internal/repository"
)

func CreateSkill(c *gin.Context) {
	var input struct {
		Name        string `json:"name"        binding:"required"`
		Category    string `json:"category"    binding:"required"`
		Proficiency int    `json:"proficiency" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := repository.CreateSkill(input.Name, input.Category, input.Proficiency); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create skill"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Skill created"})
}

func UpdateSkill(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	var input struct {
		Name        string `json:"name"        binding:"required"`
		Category    string `json:"category"    binding:"required"`
		Proficiency int    `json:"proficiency" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := repository.UpdateSkill(id, input.Name, input.Category, input.Proficiency); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update skill"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Skill updated"})
}

func DeleteSkill(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	if err := repository.DeleteSkill(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete skill"})
		return
	}
	c.Status(http.StatusNoContent)
}
