package handler

import (
	"fmt"
	"net/http"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
)

// UploadImageHandler handles image uploads
func UploadImageHandler(c *gin.Context) {
	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No image uploaded"})
		return
	}

	// Basic validation
	ext := filepath.Ext(file.Filename)
	allowedExts := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".gif":  true,
		".webp": true,
	}

	if !allowedExts[ext] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file type. Only JPG, PNG, GIF, and WebP are allowed."})
		return
	}

	// Create unique filename
	filename := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
	savePath := filepath.Join("uploads", filename)

	if err := c.SaveUploadedFile(file, savePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// Return image URL
	// Note: We use relative path here. The frontend will need to prefix it with the backend URL.
	// Or we can return the full path if we know the domain.
	// For simplicity, we return "/api/uploads/" + filename
	imageURL := fmt.Sprintf("/api/uploads/%s", filename)
	c.JSON(http.StatusOK, gin.H{
		"message":   "File uploaded successfully",
		"image_url": imageURL,
	})
}
