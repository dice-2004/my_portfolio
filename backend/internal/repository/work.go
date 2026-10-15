package repository

import (
	"github.com/dice/portfolio/internal/model"
)

func GetAllWorks() ([]model.Work, error) {
	query := "SELECT id, title, description, COALESCE(image_url, ''), COALESCE(github_url, ''), COALESCE(period, ''), COALESCE(team, ''), COALESCE(tech, ''), display_order, created_at, updated_at FROM works ORDER BY display_order ASC, created_at DESC"
	rows, err := DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var works []model.Work
	for rows.Next() {
		var w model.Work
		if err := rows.Scan(
			&w.ID,
			&w.Title,
			&w.Description,
			&w.ImageURL,
			&w.GithubURL,
			&w.Period,
			&w.Team,
			&w.Tech,
			&w.DisplayOrder,
			&w.CreatedAt,
			&w.UpdatedAt,
		); err != nil {
			return nil, err
		}
		works = append(works, w)
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}
	return works, nil
}

func GetWorkByID(id int64) (model.Work, error) {
	var w model.Work
	query := "SELECT id, title, description, COALESCE(image_url, ''), COALESCE(github_url, ''), COALESCE(period, ''), COALESCE(team, ''), COALESCE(tech, ''), display_order, created_at, updated_at FROM works WHERE id=?"
	err := DB.QueryRow(query, id).Scan(
		&w.ID,
		&w.Title,
		&w.Description,
		&w.ImageURL,
		&w.GithubURL,
		&w.Period,
		&w.Team,
		&w.Tech,
		&w.DisplayOrder,
		&w.CreatedAt,
		&w.UpdatedAt,
	)
	if err != nil {
		return w, err
	}
	return w, nil
}
