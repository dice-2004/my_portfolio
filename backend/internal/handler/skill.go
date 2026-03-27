package handler

import (
	"net/http"
	"github.com/gin-gonic/gin"

	"github.com/dice/portfolio/internal/repository"
)

func GetSkills(c *gin.Context){

	skills ,err := repository.GetAllSkills()
	if err != nil{
		c.JSON(http.StatusInternalServerError, gin.H{"error":"Failed to fetch skills data"})
		return
	}
	c.JSON(http.StatusOK, skills)

}
