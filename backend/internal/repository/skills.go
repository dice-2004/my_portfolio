package repository

import (
	"github.com/dice/portfolio/internal/model"
)

func GetAllSkills() ([]model.Skill, error) {

	query := "SELECT id,name,category,proficiency,created_at,updated_at FROM skills ORDER BY created_at DESC"

	rows ,err := DB.Query(query)
	if err != nil {
		return nil,err
	}
	defer rows.Close()

	var skills []model.Skill

	for rows.Next(){
		var s model.Skill

		if err := rows.Scan(
			&s.ID,
			&s.Name,
			&s.Category,
			&s.Proficiency,
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

func CreateSkill(name, category string, proficiency int) error {
	_, err := DB.Exec(
		"INSERT INTO skills (name, category, proficiency) VALUES (?, ?, ?)",
		name, category, proficiency,
	)
	return err
}

func UpdateSkill(id int64, name, category string, proficiency int) error {
	_, err := DB.Exec(
		"UPDATE skills SET name=?, category=?, proficiency=? WHERE id=?",
		name, category, proficiency, id,
	)
	return err
}

func DeleteSkill(id int64) error {
	_, err := DB.Exec("DELETE FROM skills WHERE id=?", id)
	return err
}
