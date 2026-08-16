import threading
import pyttsx3
from backend.app.db.database import get_setting

_speech_lock = threading.Lock()

class TTSService:
    @staticmethod
    def speak(text: str):
        enabled = get_setting("voice_notifications", "true").lower() == "true"
        if not enabled:
            return

        def run_tts(msg):
            if not _speech_lock.acquire(blocking=False):
                # If speech is already playing, skip to prevent pyttsx3 loop collisions
                return
            try:
                try:
                    import pythoncom
                    pythoncom.CoInitialize()
                except Exception:
                    pass

                engine = pyttsx3.init()
                engine.say(msg)
                engine.runAndWait()

                try:
                    import pythoncom
                    pythoncom.CoUninitialize()
                except Exception:
                    pass
            except Exception:
                pass
            finally:
                _speech_lock.release()

        threading.Thread(target=run_tts, args=(text,), daemon=True).start()

tts_service = TTSService()
