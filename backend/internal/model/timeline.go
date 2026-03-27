package model


type Timeline struct {
	ID int64 `json:"id"`

	Title string `json:"title"`
	Description string `json:"description"`
	EventDate string `json:"event_date"`
	Category string `json:"category"`
	DisplayOrder int64 `json:"display_order"`
}
