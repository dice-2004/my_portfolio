package repository

import "github.com/dice/portfolio/internal/model"

func GetAbout() (model.About, error) {
	var a model.About
	err := DB.QueryRow("SELECT id, content, updated_at FROM about WHERE id = ?", 1).Scan(&a.ID, &a.Content, &a.UpdatedAt)
	return a, err
}
