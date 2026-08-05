import sqlite3
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIR.startswith("/app"):
    db_path = "/app/data/portfolio.db"
else:
    BASE_DIR = os.path.dirname(os.path.dirname(SCRIPT_DIR))
    db_path = os.path.join(BASE_DIR, "backend", "data", "portfolio.db")

def inspect_db():
    if not os.path.exists(db_path):
        print(f"Error: Database file not found at {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    tables = ["works", "skills", "about", "timeline", "users"]
    
    print("="*40)
    print(" PORTFOLIO DATABASE INSPECTION ")
    print("="*40)
    
    for table in tables:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"\n[Table: {table}] (Count: {count})")
            
            if table == "works":
                cursor.execute("SELECT id, title FROM works")
                items = cursor.fetchall()
                for item in items:
                    print(f"  - {item[0]}: {item[1]}")
            elif table == "users":
                cursor.execute("SELECT id, name, public_key FROM users")
                items = cursor.fetchall()
                for item in items:
                    print(f"  - User: {item[1]} (ID: {item[0]})")
                    print(f"    PK: {item[2][:10]}...{item[2][-10:]}")
            elif table == "skills":
                cursor.execute("SELECT name, proficiency FROM skills")
                items = cursor.fetchall()
                for item in items:
                    print(f"  - {item[0]} ({item[1]}%)")
        except sqlite3.Error as e:
            print(f"  Error reading {table}: {e}")
            
    conn.close()
    print("\n" + "="*40)

if __name__ == "__main__":
    inspect_db()
