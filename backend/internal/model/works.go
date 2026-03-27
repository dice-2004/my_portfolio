package model

import "time"

type Work struct {
	ID int64 `json:"id"`

	Title string `json:"title"`
	Description string `json:"description"`
	ImageURL string `json:"image_url"`
	GithubURL string `json:"github_url"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

}
