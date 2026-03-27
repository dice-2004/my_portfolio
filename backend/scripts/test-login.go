package main
import (
	"bytes"
	"crypto/ed25519"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func main() {
    // 最初のスペースを削除して修正
    const privateKeyStr = "ztgTC/SCJjvirWJAbc8ihg5O1KYMrOo5JI5aqCFdr/tguYJ0JXkbnOU/DgYWmIVw6yECiqA3iFbgaZbkYAdd7A=="
    const publicKeyStr  = "YLmCdCV5G5zlPw4GFpiFcOshAoqgN4hW4GmW5GAHXew="

    // 1. サーバーからチャレンジ（合言葉）を取得
    res, err := http.Get("http://localhost:8080/api/auth/challenge")
    if err != nil { panic(err) }
    
    var chalObj struct { Challenge string `json:"challenge"` }
    json.NewDecoder(res.Body).Decode(&chalObj)
    challenge := chalObj.Challenge
    fmt.Println("Got Challenge:", challenge)

    // 2. 秘密鍵でチャレンジに署名する
    privBytes, _ := base64.StdEncoding.DecodeString(privateKeyStr)
    chalBytes, _ := base64.StdEncoding.DecodeString(challenge)
    signature := ed25519.Sign(privBytes, chalBytes)
    sigStr := base64.StdEncoding.EncodeToString(signature)

    // 3. サーバーへ検証リクエストを送る
    payload, _ := json.Marshal(map[string]string{
        "challenge":  challenge,
        "signature":  sigStr,
        "public_key": publicKeyStr,
    })
    resVerify, _ := http.Post("http://localhost:8080/api/auth/verify", "application/json", bytes.NewBuffer(payload))
    body, _ := io.ReadAll(resVerify.Body)
    fmt.Println("Result:", string(body))
}
