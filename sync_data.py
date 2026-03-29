import sqlite3
import os
import re

# Correct paths for the environment
db_path = "backend/data/portfolio.db"
blashup_path = "blashup data.md"
data_md_path = "data.md"

def parse_blashup(path):
    if not os.path.exists(path):
        print(f"❌ File not found: {path}")
        return []
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    projects = []
    # 複数行のタイトル（JPHACKS～ 改行 技育博...）に対応するため、正規表現を調整
    items = re.split(r'### \d+\. ', content)[1:]
    
    for i, item in enumerate(items):
        lines = item.strip().split('\n')
        # 改行を含むタイトルを結合
        title_lines = []
        for line in lines:
            if line.startswith('**【'): break
            title_lines.append(line.strip())
        
        full_title = " ".join(title_lines)
        clean_title = full_title.split('（')[0].split(' (')[0].strip()
        
        dev_period = re.search(r'\* \*\*開発時期:\*\* (.*)', item)
        team = re.search(r'\* \*\*体制:\*\* (.*)', item)
        tech = re.search(r'\* \*\*技術:\*\* (.*)', item)
        intro = re.search(r'\* \*\*一言概要:\*\* (.*)', item)
        
        detail_match = re.search(r'\*\*【詳細ページ向け】\*\*\n(.*?)(?=\n---|###|$)', item, re.DOTALL)
        detail_text = detail_match.group(1).strip() if detail_match else ""

        projects.append({
            "title": clean_title,
            "period": dev_period.group(1) if dev_period else "",
            "team": team.group(1) if team else "",
            "tech": tech.group(1) if tech else "",
            "intro": intro.group(1) if intro else "",
            "detail_raw": detail_text,
            "display_order": i
        })
    return projects

def parse_data_md(path):
    if not os.path.exists(path):
        print(f"❌ File not found: {path}")
        return {}
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    projects = {}
    items = re.split(r'## \d+\. ', content)[1:]
    for item in items:
        lines = item.strip().split('\n')
        if not lines: continue
        title_raw = lines[0].strip()
        github = re.search(r'- \*\*GitHub\*\*: (.*)', item)
        award = re.search(r'- \*\*受賞\*\*: (.*)', item)
        
        projects[title_raw.lower()] = {
            "github": github.group(1) if github else "",
            "award": award.group(1) if award else ""
        }
    return projects

def update_db():
    print("🚀 Starting Data Synchronization...")
    blashup_projects = parse_blashup(blashup_path)
    old_data = parse_data_md(data_md_path)
    
    target_db = db_path
    if not os.path.exists(target_db):
        # Fallback to local path if running from root without full subdir context
        alt_db_path = "portfolio.db"
        if os.path.exists(alt_db_path): 
            target_db = alt_db_path
        else:
            print(f"❌ DB not found at {db_path} or {alt_db_path}")
            return

    print(f"📂 using database: {target_db}")
    conn = sqlite3.connect(target_db)
    cursor = conn.cursor()
    
    # 0. Migration Support: Ensure display_order exists
    for table in ["works", "skills"]:
        cursor.execute(f"PRAGMA table_info({table})")
        columns = [row[1] for row in cursor.fetchall()]
        if "display_order" not in columns:
            print(f"🛠️ Adding display_order to {table}...")
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN display_order INTEGER DEFAULT 0")
        
        # Works table extra columns
        if table == "works":
            for col in ["period", "team", "tech"]:
                if col not in columns:
                    print(f"🛠️ Adding {col} to works...")
                    cursor.execute(f"ALTER TABLE works ADD COLUMN {col} TEXT")

    # 1. Update About (Only if empty or user wants reset)
    cursor.execute("SELECT count(*) FROM about")
    if cursor.fetchone()[0] == 0:
        print("📝 Initializing About content...")
        new_about = "Welcome to my portfolio archive."
        cursor.execute("INSERT INTO about (content) VALUES (?)", (new_about,))
    
    # 2. Re-sync Works
    print(f"📦 Found {len(blashup_projects)} projects. Syncing...")
    cursor.execute("DELETE FROM works")
    
    all_techs = set()

    for p in blashup_projects:
        match_key = p["title"].lower()
        github = ""
        award = ""
        for ok, val in old_data.items():
            if match_key in ok or ok in match_key:
                github = val["github"]
                award = val["award"]
                break
        
        # Extract tech for Skills sync
        if p["tech"]:
            techs = [t.strip() for t in re.split(r'[,/]', p["tech"])]
            all_techs.update(techs)

        award_str = f"🏆 **AWARD:** {award}\n\n" if award else ""
        full_description = f"{award_str}### Concept\n{p['intro']}\n\n### Laboratory Notes\n{p['detail_raw']}\n"
        
        cursor.execute("""
            INSERT INTO works (title, description, image_url, github_url, period, team, tech, display_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (p["title"], full_description, "/no-image.png", github, p["period"], p["team"], p["tech"], p["display_order"]))
    
    # 3. Re-sync Skills based on extracted Tech
    print(f"🔧 Extracted {len(all_techs)} unique technologies. Syncing Skills...")
    # Keep existing proficiency if possible, otherwise 80
    cursor.execute("SELECT name, proficiency FROM skills")
    existing_skills = {row[0]: row[1] for row in cursor.fetchall()}
    cursor.execute("DELETE FROM skills")
    
    for i, tech in enumerate(sorted(list(all_techs))):
        prof = existing_skills.get(tech, 80)
        cat = "Language" if tech in ["Python", "Go", "TypeScript", "C", "C++", "Java"] else "Tool"
        cursor.execute("""
            INSERT INTO skills (name, category, proficiency, display_order)
            VALUES (?, ?, ?, ?)
        """, (tech, cat, prof, i))

    conn.commit()
    conn.close()
    print("✅ Synchronization Complete.")

if __name__ == "__main__":
    update_db()
