import os
import csv
import shutil
import cv2
import numpy as np
from datetime import datetime
from backend.app.config import TRAINING_IMAGE_DIR, STUDENT_CSV_FILE
from backend.app.db.database import get_db

class StudentService:
    @staticmethod
    def get_all_students(search: str = None):
        conn = get_db()
        cursor = conn.cursor()
        
        query = "SELECT * FROM students"
        params = []
        if search:
            query += " WHERE enrollment LIKE ? OR name LIKE ?"
            params = [f"%{search}%", f"%{search}%"]
            
        cursor.execute(query, params)
        students = [dict(row) for row in cursor.fetchall()]
        
        # Calculate attendance percentage for each student
        for student in students:
            enrollment = student["enrollment"]
            
            cursor.execute("SELECT COUNT(*) as total FROM attendance WHERE enrollment = ?", (enrollment,))
            present_count = cursor.fetchone()["total"]
            
            # Find total unique class sessions recorded across all subjects
            cursor.execute("SELECT COUNT(DISTINCT subject || '_' || date) as total_sessions FROM attendance")
            total_sessions = cursor.fetchone()["total_sessions"] or 1
            
            rate = round((present_count / max(total_sessions, 1)) * 100, 1)
            student["attendance_rate"] = rate
            student["present_count"] = present_count
            student["total_sessions"] = total_sessions
            
        conn.close()
        return students

    @staticmethod
    def get_student_by_enrollment(enrollment: str):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM students WHERE enrollment = ?", (enrollment,))
        row = cursor.fetchone()
        
        if not row:
            conn.close()
            return None
            
        student = dict(row)
        
        # Get detailed attendance history
        cursor.execute("SELECT * FROM attendance WHERE enrollment = ? ORDER BY date DESC, time DESC", (enrollment,))
        history = [dict(r) for r in cursor.fetchall()]
        student["attendance_history"] = history
        
        # Samples path
        student_dir = TRAINING_IMAGE_DIR / f"{enrollment}_{student['name']}"
        student["has_samples"] = student_dir.exists() and len(list(student_dir.glob("*.jpg"))) > 0
        student["actual_sample_count"] = len(list(student_dir.glob("*.jpg"))) if student_dir.exists() else 0
        
        conn.close()
        return student

    @staticmethod
    def register_student(enrollment: str, name: str):
        enrollment = str(enrollment).strip()
        name = str(name).strip()
        
        if not enrollment or not name:
            raise ValueError("Enrollment number and Name are required.")
            
        conn = get_db()
        cursor = conn.cursor()
        
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute("""
            INSERT OR REPLACE INTO students (enrollment, name, created_at, sample_count, status)
            VALUES (?, ?, ?, 0, 'Active')
        """, (enrollment, name, now_str))
        conn.commit()
        conn.close()
        
        # Append to CSV for legacy compatibility
        try:
            STUDENT_CSV_FILE.parent.mkdir(parents=True, exist_ok=True)
            with open(STUDENT_CSV_FILE, mode="a", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow([enrollment, name])
        except Exception as e:
            print(f"[StudentService] CSV sync error: {e}")

        return {"enrollment": enrollment, "name": name, "created_at": now_str}

    @staticmethod
    def save_face_samples(enrollment: str, name: str, face_crops: list):
        """Save a list of grayscale face crop numpy arrays to TrainingImage/Enrollment_Name/"""
        directory = f"{enrollment}_{name}"
        path = TRAINING_IMAGE_DIR / directory
        path.mkdir(parents=True, exist_ok=True)

        existing_samples = len(list(path.glob("*.jpg")))
        saved = 0
        
        for idx, crop in enumerate(face_crops):
            sample_num = existing_samples + idx + 1
            filename = f"{name}_{enrollment}_{sample_num}.jpg"
            file_path = path / filename
            cv2.imwrite(str(file_path), crop)
            saved += 1

        total_samples = existing_samples + saved
        
        # Update SQLite DB count
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("UPDATE students SET sample_count = ? WHERE enrollment = ?", (total_samples, enrollment))
        conn.commit()
        conn.close()

        return {"enrollment": enrollment, "saved_samples": saved, "total_samples": total_samples}

    @staticmethod
    def delete_student(enrollment: str):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM students WHERE enrollment = ?", (enrollment,))
        row = cursor.fetchone()
        
        if row:
            name = row["name"]
            directory = f"{enrollment}_{name}"
            path = TRAINING_IMAGE_DIR / directory
            if path.exists():
                shutil.rmtree(path)
                
        cursor.execute("DELETE FROM students WHERE enrollment = ?", (enrollment,))
        cursor.execute("DELETE FROM attendance WHERE enrollment = ?", (enrollment,))
        conn.commit()
        conn.close()
        
        return {"success": True, "enrollment": enrollment}
