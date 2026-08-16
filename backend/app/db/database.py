import sqlite3
import json
from pathlib import Path
from backend.app.config import DATABASE_FILE, DEFAULT_CONFIDENCE_THRESHOLD, DEFAULT_CAMERA_INDEX

def get_db():
    conn = sqlite3.connect(DATABASE_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Students table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS students (
            enrollment TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL,
            sample_count INTEGER DEFAULT 0,
            status TEXT DEFAULT 'Active'
        )
    """)
    
    # Attendance table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            enrollment TEXT NOT NULL,
            name TEXT NOT NULL,
            subject TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            status TEXT DEFAULT 'Present',
            method TEXT DEFAULT 'Automatic',
            UNIQUE(enrollment, subject, date)
        )
    """)

    # Subjects table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS subjects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            code TEXT
        )
    """)

    # Model Metadata table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS model_meta (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    """)

    # Settings table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    """)

    # Populate default settings if not exists
    cursor.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('confidence_threshold', ?)", (str(DEFAULT_CONFIDENCE_THRESHOLD),))
    cursor.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('camera_index', ?)", (str(DEFAULT_CAMERA_INDEX),))
    cursor.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('voice_notifications', 'true')")
    cursor.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('attendance_duration', '20')")
    cursor.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('theme', 'dark')")

    # Add default subjects if empty
    cursor.execute("SELECT COUNT(*) as count FROM subjects")
    if cursor.fetchone()["count"] == 0:
        default_subjects = [("Mathematics", "MATH101"), ("Physics", "PHYS101"), ("Computer Science", "CS101")]
        cursor.executemany("INSERT INTO subjects (name, code) VALUES (?, ?)", default_subjects)

    conn.commit()
    conn.close()

def get_setting(key: str, default: str = "") -> str:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM settings WHERE key = ?", (key,))
    row = cursor.fetchone()
    conn.close()
    return row["value"] if row else default

def update_setting(key: str, value: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (key, str(value)))
    conn.commit()
    conn.close()
