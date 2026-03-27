import sqlite3
import os

db_path = r"\\wsl.localhost\Ubuntu\home\dice\programs\my_portfolio\backend\data\portfolio.db"

def query_works():
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT id, title, description FROM works")
        rows = cursor.fetchall()
        for row in rows:
            print(f"ID: {row[0]}, Title: {row[1]}")
            # print(f"Desc: {row[2][:50]}...")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

query_works()
