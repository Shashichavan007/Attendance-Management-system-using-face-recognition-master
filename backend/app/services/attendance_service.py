import os
import csv
from datetime import datetime, timedelta
import pandas as pd
from backend.app.config import ATTENDANCE_DIR
from backend.app.db.database import get_db

class AttendanceService:
    @staticmethod
    def mark_attendance(enrollment: str, name: str, subject: str, method: str = "Automatic"):
        enrollment = str(enrollment).strip()
        name = str(name).strip()
        subject = str(subject).strip() or "General"
        
        now = datetime.now()
        date_str = now.strftime("%Y-%m-%d")
        time_str = now.strftime("%H:%M:%S")

        conn = get_db()
        cursor = conn.cursor()
        
        # Check duplicate protection for (enrollment, subject, date)
        cursor.execute("""
            SELECT id FROM attendance WHERE enrollment = ? AND subject = ? AND date = ?
        """, (enrollment, subject, date_str))
        existing = cursor.fetchone()
        
        if existing:
            conn.close()
            return {
                "already_marked": True,
                "enrollment": enrollment,
                "name": name,
                "subject": subject,
                "date": date_str,
                "time": time_str,
                "message": f"Attendance already recorded for {name} ({enrollment}) in {subject} today."
            }

        # Ensure subject exists
        cursor.execute("INSERT OR IGNORE INTO subjects (name) VALUES (?)", (subject,))
        
        cursor.execute("""
            INSERT INTO attendance (enrollment, name, subject, date, time, status, method)
            VALUES (?, ?, ?, ?, ?, 'Present', ?)
        """, (enrollment, name, subject, date_str, time_str, method))
        conn.commit()
        conn.close()

        # Write to legacy CSV format
        try:
            subject_dir = ATTENDANCE_DIR / subject
            subject_dir.mkdir(parents=True, exist_ok=True)
            
            hour, minute, second = time_str.split(":")
            csv_file = subject_dir / f"{subject}_{date_str}_{hour}-{minute}-{second}.csv"
            
            # Write session CSV
            with open(csv_file, mode="w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow(["Enrollment", "Name"])
                writer.writerow([enrollment, name])
                
            # Update combined subject CSV attendance.csv
            AttendanceService._update_combined_subject_csv(subject)
        except Exception as e:
            print(f"[AttendanceService] CSV export error: {e}")

        return {
            "already_marked": False,
            "enrollment": enrollment,
            "name": name,
            "subject": subject,
            "date": date_str,
            "time": time_str,
            "message": f"Attendance successfully marked for {name} ({enrollment})!"
        }

    @staticmethod
    def _update_combined_subject_csv(subject: str):
        subject_dir = ATTENDANCE_DIR / subject
        if not subject_dir.exists():
            return
            
        csv_files = [f for f in subject_dir.glob(f"{subject}*.csv") if f.name != "attendance.csv"]
        if not csv_files:
            return
            
        dfs = []
        for f in csv_files:
            try:
                df = pd.read_csv(f)
                dfs.append(df)
            except Exception:
                pass
                
        if not dfs:
            return
            
        combined = dfs[0]
        for df in dfs[1:]:
            combined = combined.merge(df, how="outer")
            
        combined.fillna(0, inplace=True)
        combined["Attendance"] = "100%"
        combined.to_csv(subject_dir / "attendance.csv", index=False)

    @staticmethod
    def get_dashboard_summary():
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) as count FROM students")
        total_students = cursor.fetchone()["count"]
        
        today_str = datetime.now().strftime("%Y-%m-%d")
        cursor.execute("SELECT COUNT(DISTINCT enrollment) as present_count FROM attendance WHERE date = ?", (today_str,))
        present_today = cursor.fetchone()["present_count"]
        
        absent_today = max(total_students - present_today, 0)
        attendance_rate = round((present_today / max(total_students, 1)) * 100, 1)
        
        cursor.execute("SELECT COUNT(*) as count FROM subjects")
        total_subjects = cursor.fetchone()["count"]
        
        cursor.execute("SELECT * FROM attendance ORDER BY date DESC, time DESC LIMIT 1")
        last_row = cursor.fetchone()
        last_recognition = dict(last_row) if last_row else None
        
        conn.close()
        
        return {
            "total_students": total_students,
            "present_today": present_today,
            "absent_today": absent_today,
            "attendance_rate": attendance_rate,
            "total_subjects": total_subjects,
            "last_recognition": last_recognition
        }

    @staticmethod
    def get_attendance_records(date: str = None, subject: str = None, enrollment: str = None, status: str = None):
        conn = get_db()
        cursor = conn.cursor()
        
        query = "SELECT * FROM attendance WHERE 1=1"
        params = []
        
        if date:
            query += " AND date = ?"
            params.append(date)
        if subject:
            query += " AND subject = ?"
            params.append(subject)
        if enrollment:
            query += " AND enrollment = ?"
            params.append(enrollment)
        if status:
            query += " AND status = ?"
            params.append(status)
            
        query += " ORDER BY date DESC, time DESC"
        cursor.execute(query, params)
        records = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return records

    @staticmethod
    def get_analytics():
        conn = get_db()
        cursor = conn.cursor()
        
        # 1. Daily trend for last 7 days
        days = []
        today = datetime.now().date()
        for i in range(6, -1, -1):
            d_str = (today - timedelta(days=i)).strftime("%Y-%m-%d")
            cursor.execute("SELECT COUNT(DISTINCT enrollment) as count FROM attendance WHERE date = ?", (d_str,))
            p_count = cursor.fetchone()["count"]
            days.append({"date": d_str, "present": p_count})
            
        # 2. Subject breakdown
        cursor.execute("""
            SELECT subject, COUNT(DISTINCT enrollment) as count
            FROM attendance
            GROUP BY subject
        """)
        subject_stats = [dict(r) for r in cursor.fetchall()]

        # 3. Overall Present vs Absent
        cursor.execute("SELECT COUNT(*) as total_students FROM students")
        total_students = cursor.fetchone()["total_students"]
        
        cursor.execute("SELECT COUNT(DISTINCT enrollment) as present_today FROM attendance WHERE date = ?", (today.strftime("%Y-%m-%d"),))
        present_today = cursor.fetchone()["present_today"]
        absent_today = max(total_students - present_today, 0)

        conn.close()

        return {
            "daily_trends": days,
            "subject_breakdown": subject_stats,
            "present_vs_absent": [
                {"name": "Present", "value": present_today},
                {"name": "Absent", "value": absent_today}
            ]
        }
