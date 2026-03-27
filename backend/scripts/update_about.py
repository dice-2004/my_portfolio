import sqlite3
import os

db_path = r"\\wsl.localhost\Ubuntu\home\dice\programs\my_portfolio\backend\data\portfolio.db"

new_content = """## クリエイティブとエンジニアリングの交差点
プログラミングは、論理だけではなく、自分自身を表現するための「筆」のようなものだと考えています。

日々進化し続ける技術の海の中で、新しいツールを実験し、それを自分の血肉としながら、誰かの心に響くプロダクトを創り出すこと。それが私のエンジニアとしての原動力です。

このアーカイブには、そんな試行錯誤の軌跡を記録しています。"""

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("UPDATE about SET content = ? WHERE id = 1", (new_content,))
    conn.commit()
    conn.close()
    print("Database updated successfully.")
except Exception as e:
    print(f"Error: {e}")
