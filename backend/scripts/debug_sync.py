import sqlite3
import re
import os

# Paths (WSL internal paths)
db_path = '/home/dice/programs/my_portfolio/backend/data/portfolio.db'
data_md_path = '/home/dice/programs/my_portfolio/data.md'

def parse_data_md(path):
    print(f"Reading {path}...")
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split by project separator
    projects = re.split(r'\n---+\n', content)
    print(f"Found {len(projects)} sections (including header).")
    
    # Remove header
    header = projects[0]
    projects = projects[1:] 
    
    refined_data = []
    for i, p in enumerate(projects):
        p = p.strip()
        if not p or '不明点・質問' in p:
            continue
            
        print(f"Parsing project {i+1}...")
        lines = p.split('\n')
        title = ""
        github_url = ""
        tech_stack = ""
        overview = ""
        award = ""
        details = []
        is_details = False
        
        # Match title like "## 1. mobile-order-2024"
        title_match = re.search(r'## \d+\. (.*)', lines[0])
        if title_match:
            title = title_match.group(1).strip()
            print(f"  Title: {title}")
        else:
            print(f"  Warning: No title found for project {i+1}. Starting line: {lines[0] if lines else 'EMPTY'}")
            continue
            
        for line in lines[1:]:
            line_s = line.strip()
            if not line_s: continue
            
            if line_s.startswith('- **GitHub**:'):
                github_url = line_s.split(':', 1)[1].strip()
            elif line_s.startswith('- **技術スタック**:'):
                tech_stack = line_s.split(':', 1)[1].strip()
            elif line_s.startswith('- **概要 (Card用)**:'):
                overview = line_s.split(':', 1)[1].strip()
            elif line_s.startswith('- **受賞**:'):
                award = line_s.split(':', 1)[1].strip()
                print(f"  Award found: {award}")
            elif line_s.startswith('- **詳細内容**:'):
                is_details = True
                continue
            
            if is_details:
                details.append(line)
        
        # Construct the description for the card list
        full_desc = f"**Tech Stack:** {tech_stack}\n\n"
        if award:
            full_desc += f"🏆 **AWARD:** {award}\n\n"
        
        full_desc += f"### 概要\n{overview}\n\n"
        
        if details:
            full_desc += "\n".join(details)
        
        refined_data.append({
            'title': title,
            'description': full_desc,
            'github_url': github_url
        })
    return refined_data

def update_db(data, db_p):
    print(f"Connecting to database at {db_p}...")
    conn = sqlite3.connect(db_p)
    cursor = conn.cursor()
    
    # Clear existing works and reset auto-increment
    print("Clearing 'works' table...")
    cursor.execute("DELETE FROM works")
    cursor.execute("DELETE FROM sqlite_sequence WHERE name='works'")
    
    for item in data:
        # Default image
        image_url = "/no-image.png"
        print(f"Inserting: {item['title']}...")
        cursor.execute(
            "INSERT INTO works (title, description, image_url, github_url) VALUES (?, ?, ?, ?)",
            (item['title'], item['description'], image_url, item['github_url'])
        )
        
    conn.commit()
    conn.close()
    print(f"SUCCESS: Updated {len(data)} projects in database.")

if __name__ == "__main__":
    if os.path.exists(data_md_path):
        data = parse_data_md(data_md_path)
        update_db(data, db_path)
    else:
        print(f"Error: {data_md_path} not found.")
