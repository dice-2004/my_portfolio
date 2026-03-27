package handler

import (
	"encoding/base64"
	"net/http"

	"github.com/gin-gonic/gin"

	"crypto/ed25519"
	"github.com/dice/portfolio/internal/model"
	"github.com/golang-jwt/jwt/v5"
	"time"
	"github.com/dice/portfolio/internal/repository"
)

var jwtSecret = []byte("secret-key-for-portfolio") // 安全な鍵は環境変数から本来設定します

func GetChallenge(c *gin.Context){

	challenge ,err := repository.CreateChallenge()


	if err != nil{
		c.JSON(http.StatusInternalServerError, gin.H{"error":"Failed to fetch about data"})
		return
	}
	c.JSON(http.StatusOK, challenge)

}

func VerifySignature(c *gin.Context){
	var req model.ChallengeResponse
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// 1. まず「合言葉」そのものがDBにあり、期限内か（一回きり）をチェック
	valid, err := repository.VerifyChallenge(req.Challenge, req.Signature)
	if !valid || err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Challenge expired or invalid"})
		return
	}

	// 2. Base64デコード
	pubKeyRaw, _ := base64.StdEncoding.DecodeString(req.PublicKey)
	sigRaw,    _ := base64.StdEncoding.DecodeString(req.Signature)
	chalRaw,   _ := base64.StdEncoding.DecodeString(req.Challenge)

	// 3. Ed25519で南京錠(公開鍵)を開けて署名を検証
	if !ed25519.Verify(pubKeyRaw, chalRaw, sigRaw) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid signature"})
		return
	}

	// 4. 検証成功！身分証（JWT）を発行します
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user": "admin",
		"exp":  time.Now().Add(time.Hour).Unix(), // 1時間有効
	})
	tokenString, _ := token.SignedString(jwtSecret)

	c.JSON(http.StatusOK, gin.H{
		"token": tokenString,
		"status": "success",
	})
}

// 初回限定：自身の公開鍵をDBに登録する
func RegisterUser(c *gin.Context){
	var req struct {
		PublicKey string `json:"public_key"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Bad Request"})
		return
	}
	
	err := repository.StorePublicKey(req.PublicKey)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to store public key"})
		return
	}
	c.JSON(200, gin.H{"message": "Registration successful"})
}
