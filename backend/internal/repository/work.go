package repository

import (
	"time"

	"github.com/dice/portfolio/internal/model"
)

func GetAllWorks() ([]model.Work, error) {
	query := "SELECT id,title,description,image_url,github_url,created_at,updated_at FROM works ORDER BY created_at DESC"
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
	query := "SELECT id,title,description,image_url,github_url,created_at,updated_at FROM works WHERE id=?"
	err := DB.QueryRow(query, id).Scan(
		&w.ID,
		&w.Title,
		&w.Description,
		&w.ImageURL,
		&w.GithubURL,
		&w.CreatedAt,
		&w.UpdatedAt,
	)
	if err != nil {
		return w, err
	}
	return w, nil
}

func CreateWork(title, description, imageURL, githubURL string) error {
	_, err := DB.Exec(
		"INSERT INTO works (title, description, image_url, github_url) VALUES (?, ?, ?, ?)",
		title, description, imageURL, githubURL,
	)
	return err
}

func UpdateWork(id int64, title, description, imageURL, githubURL string, now time.Time) error {
	_, err := DB.Exec(
		"UPDATE works SET title=?, description=?, image_url=?, github_url=?, updated_at=? WHERE id=?",
		title, description, imageURL, githubURL, now, id,
	)
	return err
}

func DeleteWork(id int64) error {
	_, err := DB.Exec("DELETE FROM works WHERE id=?", id)
	return err
}
