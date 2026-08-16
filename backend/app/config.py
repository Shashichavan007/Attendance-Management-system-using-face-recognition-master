import os
from pathlib import Path

# Base directory (project root)
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Storage paths matching legacy layout
TRAINING_IMAGE_DIR = BASE_DIR / "TrainingImage"
TRAINING_IMAGE_LABEL_DIR = BASE_DIR / "TrainingImageLabel"
STUDENT_DETAILS_DIR = BASE_DIR / "StudentDetails"
ATTENDANCE_DIR = BASE_DIR / "Attendance"
HAAR_CASCADE_PATH = BASE_DIR / "haarcascade_frontalface_default.xml"
TRAINER_FILE = TRAINING_IMAGE_LABEL_DIR / "Trainner.yml"
STUDENT_CSV_FILE = STUDENT_DETAILS_DIR / "studentdetails.csv"
DATABASE_FILE = BASE_DIR / "attendai.db"

# Recognition defaults
DEFAULT_CONFIDENCE_THRESHOLD = 70.0  # Lower LBPH distance score = better match in OpenCV LBPH
DEFAULT_SAMPLES_COUNT = 50
DEFAULT_CAMERA_INDEX = 0

# Ensure essential directories exist
TRAINING_IMAGE_DIR.mkdir(parents=True, exist_ok=True)
TRAINING_IMAGE_LABEL_DIR.mkdir(parents=True, exist_ok=True)
STUDENT_DETAILS_DIR.mkdir(parents=True, exist_ok=True)
ATTENDANCE_DIR.mkdir(parents=True, exist_ok=True)
