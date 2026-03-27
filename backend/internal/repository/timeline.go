package repository

import (
	"github.com/dice/portfolio/internal/model"
)

func GetAllTimeline() ([]model.Timeline, error) {

	query := "SELECT id,title,description,event_date,category,display_order FROM timeline ORDER BY display_order ASC"

	rows ,err := DB.Query(query)
	if err != nil {
		return nil,err
	}
	defer rows.Close()

	var timeline []model.Timeline

	for rows.Next(){
		var s model.Timeline

		if err := rows.Scan(
			&s.ID,
			&s.Title,
			&s.Description,
			&s.EventDate,
			&s.Category,
			&s.DisplayOrder,
		); err != nil {
			return nil, err
		}

		timeline = append(timeline, s)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}
	return timeline, nil
}

func CreateTimeline(title, description, eventDate, category string, displayOrder int64) error {
	_, err := DB.Exec(
		"INSERT INTO timeline (title, description, event_date, category, display_order) VALUES (?, ?, ?, ?, ?)",
		title, description, eventDate, category, displayOrder,
	)
	return err
}

func UpdateTimeline(id int64, title, description, eventDate, category string, displayOrder int64) error {
	_, err := DB.Exec(
		"UPDATE timeline SET title=?, description=?, event_date=?, category=?, display_order=? WHERE id=?",
		title, description, eventDate, category, displayOrder, id,
	)
	return err
}

func DeleteTimeline(id int64) error {
	_, err := DB.Exec("DELETE FROM timeline WHERE id=?", id)
	return err
}
