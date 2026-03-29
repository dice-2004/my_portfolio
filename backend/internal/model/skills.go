package model

import "time"

type Skill struct {
	ID int64 `json:"id"`

	Name string `json:"name"`
	Category string `json:"category"`
	Proficiency int `json:"proficiency"`
	DisplayOrder int `json:"display_order"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

}
