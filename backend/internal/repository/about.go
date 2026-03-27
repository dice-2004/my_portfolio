package repository

import (
	"time"
	"github.com/dice/portfolio/internal/model"
)

func GetAbout() (model.About, error) {
	var a model.About
	query := "SELECT id, content, updated_at FROM about WHERE id = 1"
	err := DB.QueryRow(query, 1).Scan(&a.ID, &a.Content, &a.UpdatedAt)
	return a, err
}

// Aboutは常に1件のみなので、「入れ替え」ではなく「書き換え（UPDATE）」のみ実装する
func UpdateAbout(content string) error {
	_, err := DB.Exec(
		"UPDATE about SET content=?, updated_at=? WHERE id=1",
		content, time.Now(),
	)
	return err
}
