import threading
import pyttsx3
from backend.app.db.database import get_setting

class TTSService:
    @staticmethod
    def speak(text: str):
        enabled = get_setting("voice_notifications", "true").lower() == "true"
        if not enabled:
            return

        def run_tts(msg):
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
            except Exception as e:
                print(f"[TTSService] Speech error: {e}")

        # Run in separate thread to prevent blocking main API event loop
        threading.Thread(target=run_tts, args=(text,), daemon=True).start()

tts_service = TTSService()
