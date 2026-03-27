package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// handler/auth.go と同じ秘密鍵（本番環境では環境変数から読む）
var jwtSecret = []byte("secret-key-for-portfolio")

// AuthRequired は「入館証（JWT）を持っているか」を確認する門番ミドルウェアです。
// Ginのハンドラチェーンの中に組み込むことで、
// 後続のハンドラが呼ばれる前に認証チェックが自動的に走ります。
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		// HTTPヘッダーから "Authorization: Bearer <token>" の形式でトークンを取り出す
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			// トークンがなければ401（認証エラー）を返して処理を止める
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization token required"})
			return
		}

		// "Bearer " の後ろのトークン文字列だけを切り出す
		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")

		// JWTライブラリでトークンの署名と有効期限を検証する
		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			// 偽造・期限切れのトークンは401で弾く
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			return
		}

		// 検証通過！次のハンドラへ進む（ここが通れば本物のadminだと証明される）
		c.Next()
	}
}
