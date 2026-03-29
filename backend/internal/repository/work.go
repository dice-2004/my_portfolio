package repository

import (
	"time"

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

func CreateWork(title, description, imageURL, githubURL, period, team, tech string) error {
	_, err := DB.Exec(
		"INSERT INTO works (title, description, image_url, github_url, period, team, tech) VALUES (?, ?, ?, ?, ?, ?, ?)",
		title, description, imageURL, githubURL, period, team, tech,
	)
	return err
}

func UpdateWork(id int64, title, description, imageURL, githubURL, period, team, tech string, now time.Time) error {
	_, err := DB.Exec(
		"UPDATE works SET title=?, description=?, image_url=?, github_url=?, period=?, team=?, tech=?, updated_at=? WHERE id=?",
		title, description, imageURL, githubURL, period, team, tech, now, id,
	)
	return err
}

func DeleteWork(id int64) error {
	_, err := DB.Exec("DELETE FROM works WHERE id=?", id)
	return err
}
func UpdateWorkSortOrder(id int64, order int) error {
	_, err := DB.Exec("UPDATE works SET display_order=? WHERE id=?", order, id)
	return err
}
