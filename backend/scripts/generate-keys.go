package main

import (
	"crypto/rand"
	"crypto/ed25519"
	"encoding/base64"
	"fmt"
)

func main() {
	pub ,priv,_ := ed25519.GenerateKey(rand.Reader)

	fmt.Println("Public Key:", base64.StdEncoding.EncodeToString(pub))
	fmt.Println("Private Key:", base64.StdEncoding.EncodeToString(priv))

}
