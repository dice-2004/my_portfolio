package handler

import (
	"net/http"
	"github.com/gin-gonic/gin"

	"github.com/dice/portfolio/internal/repository"
	"fmt"
)

func GetAllTimeline(c *gin.Context){

	timeline ,err := repository.GetAllTimeline()
	if err != nil{
		fmt.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error":"Failed to fetch timeline data"})
		return
	}
	c.JSON(http.StatusOK, timeline)

}
