package handler

import (
	"net/http"
	"strconv"
	"github.com/gin-gonic/gin"

	"github.com/dice/portfolio/internal/repository"
)

func GetWorks(c *gin.Context){
	works ,err := repository.GetAllWorks()
	if err != nil{
		c.JSON(http.StatusInternalServerError, gin.H{"error":"Failed to fetch works data"})
		return
	}
	c.JSON(http.StatusOK, works)
}

func GetWork(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid work ID"})
		return
	}

	work, err := repository.GetWorkByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Work not found"})
		return
	}

	c.JSON(http.StatusOK, work)
}
