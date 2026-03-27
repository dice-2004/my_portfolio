package repository

import (

    "crypto/rand"
    "encoding/base64"
    "time"
    "github.com/dice/portfolio/internal/model"
)

func CreateChallenge () (model.ChallengeResponse, error){
	bytes := make([]byte, 32)
	rand.Read(bytes)

	chalStr := base64.StdEncoding.EncodeToString(bytes)

	expiresAt := time.Now().Add(5 * time.Minute)
	_,err := DB.Exec("INSERT INTO auth_challenges (challenge, expires_at) VALUES (?, ?)", chalStr, expiresAt)

	if err != nil {
		return model.ChallengeResponse{}, err
	}

	return model.ChallengeResponse{
		Challenge: chalStr,
		ExpiresAt: expiresAt.Unix(),
	}, nil

}

func VerifyChallenge(challenge, signature string) (bool, error){
	var storedChallenge string
	var expiresAt time.Time

	query := "SELECT challenge, expires_at FROM auth_challenges WHERE challenge = ?"
	err := DB.QueryRow(query, challenge).Scan(&storedChallenge, &expiresAt)
	if err != nil {
		return false, err
	}

	if time.Now().After(expiresAt){
		return false, nil
	}
	_,err= DB.Exec("DELETE FROM auth_challenges WHERE challenge = ?", challenge)
	if err != nil {
		return false, err
	}

	return true, nil


}

func StorePublicKey(publicKey string) error{
	// DESIGN.mdでは users テーブルを使う設計でした
	_,err := DB.Exec("INSERT INTO users (id, name, public_key) VALUES (?, ?, ?)", "admin", "Dice", publicKey)
	return err
}

func GetPublicKey() (string, error){
	var publicKey string
	query := "SELECT public_key FROM users LIMIT 1" // 最初のユーザー(Dice)を特定
	err := DB.QueryRow(query).Scan(&publicKey)
	return publicKey, err
}
