import os
import sqlite3
from typing import Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

DB_PATH = '/workspace/data/app.db'


def get_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:
        conn.execute('''CREATE TABLE IF NOT EXISTS saved_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_key TEXT UNIQUE NOT NULL,
            kind TEXT NOT NULL,
            title TEXT NOT NULL,
            category TEXT,
            description TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )''')


app = FastAPI()
init_db()


class SavedItem(BaseModel):
    item_key: str
    kind: str
    title: str
    category: Optional[str] = ''
    description: Optional[str] = ''


@app.get('/api/health')
def health():
    return {'ok': True}


@app.get('/api/saved')
def list_saved():
    with get_db() as conn:
        rows = conn.execute('SELECT * FROM saved_items ORDER BY id DESC').fetchall()
    return [dict(row) for row in rows]


@app.post('/api/saved')
def save_item(item: SavedItem):
    with get_db() as conn:
        conn.execute('''INSERT INTO saved_items (item_key, kind, title, category, description)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(item_key) DO UPDATE SET title=excluded.title, category=excluded.category, description=excluded.description''',
            (item.item_key, item.kind, item.title, item.category or '', item.description or ''))
    return {'ok': True}


@app.delete('/api/saved/{item_key}')
def delete_saved(item_key: str):
    with get_db() as conn:
        result = conn.execute('DELETE FROM saved_items WHERE item_key = ?', (item_key,))
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail='저장된 항목을 찾을 수 없습니다.')
    return {'ok': True}
