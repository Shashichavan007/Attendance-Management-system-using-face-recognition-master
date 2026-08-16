import os
import cv2
import numpy as np
from PIL import Image
from datetime import datetime
from backend.app.config import (
    HAAR_CASCADE_PATH,
    TRAINING_IMAGE_DIR,
    TRAINER_FILE,
    DEFAULT_CONFIDENCE_THRESHOLD,
)
from backend.app.db.database import get_db, get_setting, update_setting

class RecognitionService:
    def __init__(self):
        self.detector = None
        self.recognizer = None
        self.is_trained = False
        self._load_detector()
        self._load_recognizer()

    def _load_detector(self):
        if os.path.exists(HAAR_CASCADE_PATH):
            self.detector = cv2.CascadeClassifier(str(HAAR_CASCADE_PATH))
        else:
            print(f"[RecognitionService] Haar Cascade file not found at {HAAR_CASCADE_PATH}")

    def _load_recognizer(self):
        try:
            self.recognizer = cv2.face.LBPHFaceRecognizer_create()
            if os.path.exists(TRAINER_FILE) and os.path.getsize(TRAINER_FILE) > 0:
                self.recognizer.read(str(TRAINER_FILE))
                self.is_trained = True
                print(f"[RecognitionService] Loaded trained model from {TRAINER_FILE}")
            else:
                self.is_trained = False
        except Exception as e:
            print(f"[RecognitionService] Model loading exception: {e}")
            self.is_trained = False

    def get_model_status(self):
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) as count FROM students")
        student_count = cursor.fetchone()["count"]

        # Count total training images across directories
        total_images = 0
        if TRAINING_IMAGE_DIR.exists():
            for d in TRAINING_IMAGE_DIR.iterdir():
                if d.is_dir():
                    total_images += len(list(d.glob("*.jpg")) + list(d.glob("*.png")))

        last_trained = get_setting("last_trained_at", "Never")
        conn.close()

        return {
            "algorithm": "LBPH Face Recognizer (OpenCV)",
            "is_trained": self.is_trained,
            "registered_students": student_count,
            "training_images": total_images,
            "last_trained_at": last_trained,
            "model_file_exists": os.path.exists(TRAINER_FILE),
            "status": "Ready" if self.is_trained else "Requires Training"
        }

    def train_model(self):
        """Train LBPH model from saved images in TrainingImage/."""
        if not TRAINING_IMAGE_DIR.exists():
            raise FileNotFoundError("Training images directory does not exist.")

        newdirs = [d for d in TRAINING_IMAGE_DIR.iterdir() if d.is_dir()]
        faces = []
        ids = []

        for student_dir in newdirs:
            for img_path in student_dir.glob("*.*"):
                if img_path.suffix.lower() not in [".jpg", ".jpeg", ".png"]:
                    continue
                try:
                    pil_img = Image.open(img_path).convert("L")
                    img_np = np.array(pil_img, "uint8")
                    
                    # File format: Name_Enrollment_SampleNum.jpg or Enrollment_Name_SampleNum.jpg
                    filename_stem = img_path.stem
                    parts = filename_stem.split("_")
                    
                    # Extract numeric Enrollment ID
                    enrollment_id = None
                    for part in parts:
                        if part.isdigit():
                            enrollment_id = int(part)
                            break
                    
                    if enrollment_id is not None:
                        faces.append(img_np)
                        ids.append(enrollment_id)
                except Exception as e:
                    print(f"[RecognitionService] Skipping image {img_path}: {e}")

        if not faces or not ids:
            return {"success": False, "message": "No valid face samples found to train."}

        self.recognizer = cv2.face.LBPHFaceRecognizer_create()
        self.recognizer.train(faces, np.array(ids))
        
        TRAINER_FILE.parent.mkdir(parents=True, exist_ok=True)
        self.recognizer.save(str(TRAINER_FILE))
        self.is_trained = True
        
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        update_setting("last_trained_at", now_str)

        return {
            "success": True,
            "message": f"Model successfully trained on {len(faces)} face samples across {len(set(ids))} students.",
            "total_samples": len(faces),
            "total_students": len(set(ids)),
            "trained_at": now_str
        }

    def detect_faces(self, gray_img):
        if self.detector is None:
            self._load_detector()
        return self.detector.detectMultiScale(gray_img, scaleFactor=1.2, minNeighbors=5, minSize=(30, 30))

    def predict_face(self, gray_crop):
        if not self.is_trained or self.recognizer is None:
            return None, 999.0
        
        try:
            enrollment_id, confidence = self.recognizer.predict(gray_crop)
            return enrollment_id, float(confidence)
        except Exception as e:
            print(f"[RecognitionService] Prediction error: {e}")
            return None, 999.0

# Singleton instance
recognition_service = RecognitionService()
