package model

type ChallengeResponse struct {
	User string `json:"user"`
	PublicKey string `json:"public_key"`
	Signature string `json:"signature"`
	Challenge string `json:"challenge"`
	ExpiresAt int64  `json:"expires_at"`
}
