package repository

import (
	"strings"

	"github.com/dice/portfolio/internal/model"
)

const workColumns = "id, title, description, COALESCE(image_url, ''), COALESCE(github_url, ''), COALESCE(period, ''), COALESCE(team, ''), COALESCE(tech, ''), display_order, created_at, updated_at, COALESCE(images, ''), COALESCE(video_url, ''), COALESCE(featured, 0)"

type rowScanner interface {
	Scan(dest ...any) error
}

func scanWork(r rowScanner) (model.Work, error) {
	var w model.Work
	var images string
	err := r.Scan(
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
		&images,
		&w.VideoURL,
		&w.Featured,
	)
	// JSON で null ではなく [] を返す
	w.Images = []string{}
	if images != "" {
		w.Images = strings.Split(images, "\n")
	}
	return w, err
}

func GetAllWorks() ([]model.Work, error) {
	rows, err := DB.Query("SELECT " + workColumns + " FROM works ORDER BY display_order ASC, created_at DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var works []model.Work
	for rows.Next() {
		w, err := scanWork(rows)
		if err != nil {
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
	return scanWork(DB.QueryRow("SELECT "+workColumns+" FROM works WHERE id=?", id))
}
