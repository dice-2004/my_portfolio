package handler

import (
	"net/http"
	"github.com/gin-gonic/gin"

	"github.com/dice/portfolio/internal/repository"
)

func GetAbout(c *gin.Context){

	about ,err := repository.GetAbout()
	if err != nil{
		c.JSON(http.StatusInternalServerError, gin.H{"error":"Failed to fetch about data"})
		return
	}
	c.JSON(http.StatusOK, about)

}
