import os
import csv
import glob
from datetime import datetime
from backend.app.config import STUDENT_CSV_FILE, ATTENDANCE_DIR, TRAINING_IMAGE_DIR
from backend.app.db.database import get_db

def run_migration():
    """Migrate legacy CSV files into SQLite database if not present."""
    conn = get_db()
    cursor = conn.cursor()
    
    # 1. Import StudentDetails/studentdetails.csv
    if STUDENT_CSV_FILE.exists():
        try:
            with open(STUDENT_CSV_FILE, mode="r", newline="", encoding="utf-8") as f:
                reader = csv.reader(f)
                for row in reader:
                    if not row or len(row) < 2:
                        continue
                    enrollment, name = row[0].strip(), row[1].strip()
                    if enrollment.lower() in ("enrollment", "id", "no"):
                        continue
                    
                    # Count actual saved images in TrainingImage/Enrollment_Name
                    dir_pattern = f"{enrollment}_*"
                    matched_dirs = list(TRAINING_IMAGE_DIR.glob(dir_pattern))
                    sample_count = 0
                    if matched_dirs:
                        sample_count = len(list(matched_dirs[0].glob("*.jpg")))
                    
                    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    cursor.execute("""
                        INSERT OR IGNORE INTO students (enrollment, name, created_at, sample_count, status)
                        VALUES (?, ?, ?, ?, 'Active')
                    """, (enrollment, name, now_str, sample_count))
        except Exception as e:
            print(f"[Migrator] Error importing student details CSV: {e}")

    # 2. Import Attendance CSV files
    if ATTENDANCE_DIR.exists():
        csv_files = glob.glob(str(ATTENDANCE_DIR / "**" / "*.csv"), recursive=True)
        for csv_path in csv_files:
            rel_path = os.path.relpath(csv_path, ATTENDANCE_DIR)
            parts = rel_path.split(os.sep)
            
            # Skip overall subject summary file "attendance.csv" if merged
            filename = os.path.basename(csv_path)
            if filename == "attendance.csv":
                continue
                
            subject = parts[0] if len(parts) > 1 else "General"
            
            try:
                # Attempt to extract date/time from filename e.g. Subject_2026-08-17_01-30-00.csv
                date_str = datetime.now().strftime("%Y-%m-%d")
                time_str = datetime.now().strftime("%H:%M:%S")
                
                name_without_ext = os.path.splitext(filename)[0]
                filename_parts = name_without_ext.split("_")
                if len(filename_parts) >= 3:
                    date_candidate = filename_parts[-2]
                    time_candidate = filename_parts[-1].replace("-", ":")
                    if len(date_candidate) == 10 and date_candidate.count("-") == 2:
                        date_str = date_candidate
                    if len(time_candidate) == 8 and time_candidate.count(":") == 2:
                        time_str = time_candidate

                with open(csv_path, mode="r", newline="", encoding="utf-8") as f:
                    reader = csv.reader(f)
                    header = next(reader, None)
                    if not header:
                        continue
                    
                    for row in reader:
                        if not row or len(row) < 2:
                            continue
                        enrollment = str(row[0]).strip()
                        student_name = str(row[1]).strip()
                        if enrollment.lower() in ("enrollment", "id"):
                            continue
                        
                        # Add subject to subjects table if missing
                        cursor.execute("INSERT OR IGNORE INTO subjects (name) VALUES (?)", (subject,))

                        cursor.execute("""
                            INSERT OR IGNORE INTO attendance (enrollment, name, subject, date, time, status, method)
                            VALUES (?, ?, ?, ?, ?, 'Present', 'Automatic')
                        """, (enrollment, student_name, subject, date_str, time_str))
            except Exception as e:
                print(f"[Migrator] Error importing attendance CSV {csv_path}: {e}")

    conn.commit()
    conn.close()
