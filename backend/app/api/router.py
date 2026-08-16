import cv2
import base64
import json
import numpy as np
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, Response, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from backend.app.services.student_service import StudentService
from backend.app.services.attendance_service import AttendanceService
from backend.app.services.recognition import recognition_service
from backend.app.services.report_service import ReportService
from backend.app.services.tts_service import tts_service
from backend.app.db.database import get_db, get_setting, update_setting

router = APIRouter()

# Data models
class RegisterStudentRequest(BaseModel):
    enrollment: str
    name: str

class CaptureSampleFrameRequest(BaseModel):
    enrollment: str
    name: str
    frame_b64: str  # Base64 encoded image frame

class MarkAttendanceRequest(BaseModel):
    enrollment: str
    name: str
    subject: str
    method: Optional[str] = "Automatic"

class ManualAttendanceRequest(BaseModel):
    subject: str
    date: str
    records: List[dict]  # list of {"enrollment": "...", "name": "...", "present": True}

class PredictFrameRequest(BaseModel):
    frame_b64: str
    subject: str = "General"

class UpdateSettingsRequest(BaseModel):
    confidence_threshold: Optional[float] = None
    camera_index: Optional[int] = None
    voice_notifications: Optional[bool] = None
    attendance_duration: Optional[int] = None
    theme: Optional[str] = None

# --- DASHBOARD ---
@router.get("/dashboard")
def get_dashboard():
    return AttendanceService.get_dashboard_summary()

# --- STUDENTS ---
@router.get("/students")
def list_students(search: Optional[str] = Query(None)):
    return StudentService.get_all_students(search=search)

@router.get("/students/{enrollment}")
def get_student(enrollment: str):
    student = StudentService.get_student_by_enrollment(enrollment)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@router.post("/students")
def register_student(req: RegisterStudentRequest):
    try:
        res = StudentService.register_student(req.enrollment, req.name)
        tts_service.speak(f"Student {req.name} registered.")
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/students/capture-samples")
def capture_sample_frame(req: CaptureSampleFrameRequest):
    try:
        # Decode base64 image frame
        header, encoded = req.frame_b64.split(",", 1) if "," in req.frame_b64 else ("", req.frame_b64)
        img_bytes = base64.b64decode(encoded)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image frame.")
            
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = recognition_service.detect_faces(gray)
        
        if len(faces) == 0:
            return {"face_detected": False, "saved": False, "message": "No face detected in frame."}
            
        (x, y, w, h) = faces[0]
        face_crop = gray[y:y+h, x:x+w]
        
        res = StudentService.save_face_samples(req.enrollment, req.name, [face_crop])
        return {
            "face_detected": True,
            "saved": True,
            "sample_count": res["total_samples"],
            "bbox": [int(x), int(y), int(w), int(h)],
            "message": f"Sample captured ({res['total_samples']} / 50)"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/students/{enrollment}")
def delete_student(enrollment: str):
    return StudentService.delete_student(enrollment)

# --- RECOGNITION & MODEL ---
@router.get("/recognition/status")
def get_model_status():
    return recognition_service.get_model_status()

@router.post("/recognition/train")
def train_model():
    try:
        res = recognition_service.train_model()
        if res.get("success"):
            tts_service.speak("Recognition model updated successfully.")
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/recognition/predict-frame")
def predict_frame(req: PredictFrameRequest):
    try:
        header, encoded = req.frame_b64.split(",", 1) if "," in req.frame_b64 else ("", req.frame_b64)
        img_bytes = base64.b64decode(encoded)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return {"status": "error", "message": "Invalid frame data."}
            
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = recognition_service.detect_faces(gray)
        
        threshold = float(get_setting("confidence_threshold", "70.0"))

        if len(faces) == 0:
            return {"status": "Scanning", "message": "Looking for faces...", "faces": []}

        detected_faces = []
        for (x, y, w, h) in faces:
            face_crop = gray[y:y+h, x:x+w]
            enrollment_id, confidence = recognition_service.predict_face(face_crop)
            
            face_data = {
                "bbox": [int(x), int(y), int(w), int(h)],
                "confidence": round(confidence, 1),
                "status": "Unknown",
                "student": None
            }
            
            if enrollment_id is not None and confidence < threshold:
                student = StudentService.get_student_by_enrollment(str(enrollment_id))
                if student:
                    face_data["status"] = "Recognized"
                    face_data["student"] = {"enrollment": student["enrollment"], "name": student["name"]}
                    
                    # Auto mark attendance
                    att_res = AttendanceService.mark_attendance(
                        student["enrollment"],
                        student["name"],
                        req.subject,
                        method="Automatic"
                    )
                    face_data["attendance_marked"] = not att_res["already_marked"]
                    face_data["attendance_message"] = att_res["message"]
                    
                    if not att_res["already_marked"]:
                        tts_service.speak(f"Attendance marked for {student['name']}.")
            elif enrollment_id is not None and confidence >= threshold:
                face_data["status"] = "Low Confidence"
            
            detected_faces.append(face_data)

        return {
            "status": "Face Detected",
            "message": f"Detected {len(detected_faces)} face(s)",
            "faces": detected_faces
        }
    except Exception as e:
        return {"status": "error", "message": str(e), "faces": []}

# --- ATTENDANCE ---
@router.get("/attendance")
def get_attendance(
    date: Optional[str] = Query(None),
    subject: Optional[str] = Query(None),
    enrollment: Optional[str] = Query(None),
    status: Optional[str] = Query(None)
):
    return AttendanceService.get_attendance_records(date=date, subject=subject, enrollment=enrollment, status=status)

@router.post("/attendance/mark")
def mark_attendance(req: MarkAttendanceRequest):
    res = AttendanceService.mark_attendance(req.enrollment, req.name, req.subject, method=req.method or "Manual")
    if not res["already_marked"]:
        tts_service.speak(f"Attendance marked for {req.name}.")
    return res

@router.post("/attendance/manual")
def record_manual_attendance(req: ManualAttendanceRequest):
    marked_count = 0
    for item in req.records:
        if item.get("present"):
            res = AttendanceService.mark_attendance(
                item["enrollment"],
                item["name"],
                req.subject,
                method="Manual"
            )
            if not res["already_marked"]:
                marked_count += 1
                
    tts_service.speak(f"Manual attendance saved for {marked_count} students in {req.subject}.")
    return {"success": True, "subject": req.subject, "marked_students": marked_count}

# --- ANALYTICS ---
@router.get("/analytics")
def get_analytics():
    return AttendanceService.get_analytics()

# --- REPORTS ---
@router.get("/reports/csv")
def download_csv(subject: Optional[str] = Query(None), date: Optional[str] = Query(None)):
    data = ReportService.generate_csv(subject=subject, date=date)
    return Response(content=data, media_type="text/csv", headers={
        "Content-Disposition": f"attachment; filename=AttendAI_{subject or 'All'}_{date or 'All'}.csv"
    })

@router.get("/reports/excel")
def download_excel(subject: Optional[str] = Query(None), date: Optional[str] = Query(None)):
    data = ReportService.generate_excel(subject=subject, date=date)
    return Response(content=data, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={
        "Content-Disposition": f"attachment; filename=AttendAI_{subject or 'All'}_{date or 'All'}.xlsx"
    })

@router.get("/reports/pdf")
def download_pdf(subject: Optional[str] = Query(None), date: Optional[str] = Query(None)):
    data = ReportService.generate_pdf(subject=subject, date=date)
    return Response(content=data, media_type="application/pdf", headers={
        "Content-Disposition": f"attachment; filename=AttendAI_{subject or 'All'}_{date or 'All'}.pdf"
    })

# --- SETTINGS ---
@router.get("/settings")
def get_settings():
    return {
        "confidence_threshold": float(get_setting("confidence_threshold", "70.0")),
        "camera_index": int(get_setting("camera_index", "0")),
        "voice_notifications": get_setting("voice_notifications", "true").lower() == "true",
        "attendance_duration": int(get_setting("attendance_duration", "20")),
        "theme": get_setting("theme", "dark")
    }

@router.post("/settings")
def update_settings(req: UpdateSettingsRequest):
    if req.confidence_threshold is not None:
        update_setting("confidence_threshold", req.confidence_threshold)
    if req.camera_index is not None:
        update_setting("camera_index", req.camera_index)
    if req.voice_notifications is not None:
        update_setting("voice_notifications", str(req.voice_notifications).lower())
    if req.attendance_duration is not None:
        update_setting("attendance_duration", req.attendance_duration)
    if req.theme is not None:
        update_setting("theme", req.theme)
        
    return {"success": True, "settings": get_settings()}
