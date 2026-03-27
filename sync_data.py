import sqlite3
import os
import re

# Correct paths for the environment
db_path = "backend/data/portfolio.db"
blashup_path = "blashup data.md"
data_md_path = "data.md"

def parse_blashup(path):
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return []
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    projects = []
    items = re.split(r'### \d+\. ', content)[1:]
    for item in items:
        lines = item.strip().split('\n')
        title = lines[0].split('（')[0].split(' (')[0].strip()
        
        dev_period = re.search(r'\* \*\*開発時期:\*\* (.*)', item)
        team = re.search(r'\* \*\*体制:\*\* (.*)', item)
        tech = re.search(r'\* \*\*技術:\*\* (.*)', item)
        intro = re.search(r'\* \*\*一言概要:\*\* (.*)', item)
        
        detail_match = re.search(r'\*\*【詳細ページ向け】\*\*\n(.*?)(?=\n---|###|$)', item, re.DOTALL)
        detail_text = detail_match.group(1).strip() if detail_match else ""

        projects.append({
            "title": title,
            "period": dev_period.group(1) if dev_period else "",
            "team": team.group(1) if team else "",
            "tech": tech.group(1) if tech else "",
            "intro": intro.group(1) if intro else "",
            "detail_raw": detail_text
        })
    return projects

def parse_data_md(path):
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return {}
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    projects = {}
    items = re.split(r'## \d+\. ', content)[1:]
    for item in items:
        lines = item.strip().split('\n')
        title_raw = lines[0].strip()
        github = re.search(r'- \*\*GitHub\*\*: (.*)', item)
        award = re.search(r'- \*\*受賞\*\*: (.*)', item)
        
        projects[title_raw.lower()] = {
            "github": github.group(1) if github else "",
            "award": award.group(1) if award else ""
        }
    return projects

def update_db():
    blashup_projects = parse_blashup(blashup_path)
    old_data = parse_data_md(data_md_path)
    
    if not os.path.exists(db_path):
        print(f"DB not found: {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 1. Update About content (remove aaaa and use a professional intro)
    new_about = """## クリエイティブとエンジニアリングの交差点
プログラミングは、論理だけではなく、自分自身を表現するための「筆」のようなものだと考えています。

日々進化し続ける技術の海の中で、新しいツールを実験し、それを自分の血肉としながら、誰かの心に響くプロダクトを創り出すこと。それが私のエンジニアとしての原動力です。

このアーカイブには、そんな試行錯誤の軌跡を記録しています。"""
    cursor.execute("UPDATE about SET content = ? WHERE id = 1", (new_about,))
    
    # 2. Re-sync Works
    cursor.execute("DELETE FROM works")
    for p in blashup_projects:
        match_key = p["title"].lower()
        old_info = {"github": "", "award": ""}
        for ok in old_data:
            if match_key in ok or ok in match_key:
                old_info = old_data[ok]
                break
        
        award_str = f"🏆 **AWARD:** {old_info['award']}\n\n" if old_info['award'] else ""
        full_description = f"{award_str}"
        full_description += f"### Spec Sheet\n"
        full_description += f"- **Period:** {p['period']}\n"
        full_description += f"- **Team:** {p['team']}\n"
        full_description += f"- **Tech Stack:** {p['tech']}\n\n"
        full_description += f"### Concept\n{p['intro']}\n\n"
        full_description += f"### Laboratory Notes\n{p['detail_raw']}\n"
        
        cursor.execute("""
            INSERT INTO works (title, description, image_url, github_url)
            VALUES (?, ?, ?, ?)
        """, (p["title"], full_description, "/no-image.png", old_info["github"]))
    
    conn.commit()
    conn.close()
    print(f"Synced {len(blashup_projects)} projects and updated About content.")

if __name__ == "__main__":
    update_db()
