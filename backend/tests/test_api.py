import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

def test_health():
    with TestClient(app) as client:
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "online"
        assert data["app"] == "AttendAI"

def test_dashboard_summary():
    with TestClient(app) as client:
        response = client.get("/api/dashboard")
        assert response.status_code == 200
        data = response.json()
        assert "total_students" in data
        assert "present_today" in data
        assert "absent_today" in data
        assert "attendance_rate" in data

def test_student_registration_and_list():
    with TestClient(app) as client:
        test_enrollment = "99999"
        test_name = "PyTest Student"
        
        # 1. Register student
        reg_response = client.post("/api/students", json={"enrollment": test_enrollment, "name": test_name})
        assert reg_response.status_code == 200
        
        # 2. Get student details
        get_response = client.get(f"/api/students/{test_enrollment}")
        assert get_response.status_code == 200
        assert get_response.json()["name"] == test_name
        
        # 3. List students
        list_response = client.get("/api/students")
        assert list_response.status_code == 200
        enrollments = [s["enrollment"] for s in list_response.json()]
        assert test_enrollment in enrollments
        
        # 4. Clean up test student
        del_response = client.delete(f"/api/students/{test_enrollment}")
        assert del_response.status_code == 200

def test_attendance_mark_and_deduplication():
    with TestClient(app) as client:
        test_enrollment = "88888"
        test_name = "Deduplication Test Student"
        test_subject = "PyTest Subject"
        
        # Register student
        client.post("/api/students", json={"enrollment": test_enrollment, "name": test_name})
        
        # 1. First mark -> Success
        res1 = client.post("/api/attendance/mark", json={"enrollment": test_enrollment, "name": test_name, "subject": test_subject})
        assert res1.status_code == 200
        assert res1.json()["already_marked"] is False
        
        # 2. Duplicate mark -> Intercepted
        res2 = client.post("/api/attendance/mark", json={"enrollment": test_enrollment, "name": test_name, "subject": test_subject})
        assert res2.status_code == 200
        assert res2.json()["already_marked"] is True

        # Cleanup
        client.delete(f"/api/students/{test_enrollment}")

def test_reports_generation():
    with TestClient(app) as client:
        csv_res = client.get("/api/reports/csv")
        assert csv_res.status_code == 200
        assert "text/csv" in csv_res.headers["content-type"]
        
        excel_res = client.get("/api/reports/excel")
        assert excel_res.status_code == 200
        
        pdf_res = client.get("/api/reports/pdf")
        assert pdf_res.status_code == 200
        assert "application/pdf" in pdf_res.headers["content-type"]
