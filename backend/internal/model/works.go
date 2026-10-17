package model

import "time"

type Work struct {
	ID int64 `json:"id"`

	Title string `json:"title"`
	Description string `json:"description"`
	ImageURL string `json:"image_url"`
	GithubURL string `json:"github_url"`
	Period string `json:"period"`
	Team string `json:"team"`
	Tech string `json:"tech"`
	DisplayOrder int `json:"display_order"`
	// 画像の URL。先頭が ImageURL と同じ。無ければ空の配列
	Images   []string `json:"images"`
	VideoURL string   `json:"video_url"`
	// 代表作としてトップで大きく見せるか
	Featured bool `json:"featured"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

}
