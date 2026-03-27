import sqlite3
import os
import re

db_path = r"\\wsl.localhost\Ubuntu\home\dice\programs\my_portfolio\backend\data\portfolio.db"
blashup_path = r"\\wsl.localhost\Ubuntu\home\dice\programs\my_portfolio\blashup data.md"
data_md_path = r"\\wsl.localhost\Ubuntu\home\dice\programs\my_portfolio\data.md"

def parse_blashup(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    projects = []
    # Split by ### headers
    items = re.split(r'### \d+\. ', content)[1:]
    for item in items:
        lines = item.strip().split('\n')
        title = lines[0].split('（')[0].split(' (')[0].strip()
        
        # Extract fields
        dev_period = re.search(r'\* \*\*開発時期:\*\* (.*)', item)
        team = re.search(r'\* \*\*体制:\*\* (.*)', item)
        tech = re.search(r'\* \*\*技術:\*\* (.*)', item)
        intro = re.search(r'\* \*\*一言概要:\*\* (.*)', item)
        background = re.search(r'\* \*\*背景・課題:\*\* (.*)', item)
        solution = re.search(r'\* \*\*解決策:\*\* (.*)', item)
        role = re.search(r'\* \*\*担当・工夫した点:\*\* (.*)', item)
        
        # Detail sections
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
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    projects = {}
    items = re.split(r'## \d+\. ', content)[1:]
    for item in items:
        lines = item.strip().split('\n')
        title_raw = lines[0].strip()
        github = re.search(r'- \*\*GitHub\*\*: (.*)', item)
        tech_stack = re.search(r'- \*\*技術スタック\*\*: (.*)', item)
        award = re.search(r'- \*\*受賞\*\*: (.*)', item)
        
        projects[title_raw.lower()] = {
            "github": github.group(1) if github else "",
            "tech_stack": tech_stack.group(1) if tech_stack else "",
            "award": award.group(1) if award else ""
        }
    return projects

def update_db():
    blashup_projects = parse_blashup(blashup_path)
    old_data = parse_data_md(data_md_path)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Clear existing works to start fresh as requested
    cursor.execute("DELETE FROM works")
    
    for p in blashup_projects:
        # Match with old data for GitHub/Award
        match_key = p["title"].lower()
        # Try soft match
        old_info = {"github": "", "award": ""}
        for ok in old_data:
            if p["title"].lower() in ok or ok in p["title"].lower():
                old_info = old_data[ok]
                break
        
        # Build enriched description
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
    print(f"Updated {len(blashup_projects)} projects successfully.")

update_db()
