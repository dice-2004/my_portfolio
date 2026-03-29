import sqlite3
import os
import re

# パスの設定 (WSL内からのパスに調整)
db_path = r"backend/data/portfolio.db"
unified_md_path = r"works_unified.md"

# 管理者の公開鍵 (必要に応じて変更してください)
ADMIN_PUBLIC_KEY = "YLmCdCV5G5zlPw4GFpiFcOshAoqgN4hW4GmW5GAHXew="

def parse_unified_md(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # プロジェクトごとに分割
    items = re.split(r'\n---\n\n## \d+\. ', content)
    # 最初のセクション（ヘッダー）を削除
    if len(items) > 0:
        items[0] = re.sub(r'^.*?## 1\. ', '', items[0], flags=re.DOTALL)
    
    projects = []
    for item in items:
        lines = [l.strip() for l in item.split('\n') if l.strip()]
        if not lines: continue
        
        # タイトルの抽出
        title_line = lines[0]
        title = title_line.split(' (')[0].strip()
        
        # フィールドの抽出用正規表現
        fields = {
            "github": r"- \*\*GitHub\*\*: (.*)",
            "tech": r"- \*\*技術スタック\*\*: (.*)",
            "period": r"- \*\*開発時期\*\*: (.*)",
            "team": r"- \*\*体制\*\*: (.*)",
            "award": r"- \*\*受賞\*\*: (.*)",
            "short_intro": r"- \*\*ショート概要\*\*: (.*)",
            "background": r"- \*\*背景・課題\*\*: (.*)",
            "solution": r"- \*\*解決策\*\*: (.*)",
            "role": r"- \*\*担当・工夫した点\*\*: (.*)",
            "notes": r"- \*\*備考\*\*: (.*)"
        }
        
        extracted = {}
        for key, pattern in fields.items():
            match = re.search(pattern, item)
            extracted[key] = match.group(1).strip() if match else ""
        
        # 詳細ページ向けの Markdown 構成
        description = ""
        if extracted["award"]:
            description += f"🏆 **AWARD:** {extracted['award']}\n\n"
        
        description += f"### Spec Sheet\n"
        if extracted["period"]: description += f"- **Period:** {extracted['period']}\n"
        if extracted["team"]:   description += f"- **Team:** {extracted['team']}\n"
        if extracted["tech"]:   description += f"- **Tech Stack:** {extracted['tech']}\n"
        description += "\n"
        
        if extracted["short_intro"]:
            description += f"### Concept\n{extracted['short_intro']}\n\n"
        
        if extracted["background"]:
            description += f"### Background & Problem\n{extracted['background']}\n\n"
            
        if extracted["solution"]:
            description += f"### Solution\n{extracted['solution']}\n\n"
            
        if extracted["role"]:
            description += f"### Laboratory Notes (Role & Effort)\n{extracted['role']}\n\n"
            
        if extracted["notes"]:
            description += f"### Remarks\n{extracted['notes']}\n"

        projects.append({
            "title": title,
            "description": description.strip(),
            "github_url": extracted["github"],
            "image_url": "/no-image.png" # デフォルト
        })
    return projects

def update_db():
    print(f"Reading unified data from {unified_md_path}...")
    projects = parse_unified_md(unified_md_path)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # --- 管理者公開鍵の登録 (必要に応じて) ---
    print("Ensuring admin user exists...")
    cursor.execute("""
        INSERT OR REPLACE INTO users (id, name, public_key)
        VALUES ('admin', 'Dice', ?)
    """, (ADMIN_PUBLIC_KEY,))
    
    # --- Works テーブルのクリーンアップと更新 ---
    print(f"Clearing existing works and updating with {len(projects)} projects...")
    cursor.execute("DELETE FROM works")
    
    for p in projects:
        cursor.execute("""
            INSERT INTO works (title, description, image_url, github_url)
            VALUES (?, ?, ?, ?)
        """, (p["title"], p["description"], p["image_url"], p["github_url"]))
    
    conn.commit()
    conn.close()
    print("Database updated successfully.")

if __name__ == "__main__":
    if os.path.exists(unified_md_path):
        update_db()
    else:
        print(f"Error: {unified_md_path} not found.")
