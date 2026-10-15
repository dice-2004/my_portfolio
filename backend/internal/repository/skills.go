package repository

import (
	"github.com/dice/portfolio/internal/model"
)

func GetAllSkills() ([]model.Skill, error) {

	query := "SELECT id,name,category,proficiency,display_order,created_at,updated_at FROM skills ORDER BY display_order ASC, created_at DESC"

	rows, err := DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var skills []model.Skill

	for rows.Next() {
		var s model.Skill

		if err := rows.Scan(
			&s.ID,
			&s.Name,
			&s.Category,
			&s.Proficiency,
			&s.DisplayOrder,
			&s.CreatedAt,
			&s.UpdatedAt,
		); err != nil {
			return nil, err
		}

		skills = append(skills, s)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}
	return skills, nil
}
