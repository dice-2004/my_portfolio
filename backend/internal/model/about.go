package model

import "time"

type About struct {
	ID int64 `json:"id"`

	Content string `json:"content"`

	UpdatedAt time.Time `json:"updated_at"`

}
