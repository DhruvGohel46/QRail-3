"""
Speech Processing Module for RailQR
Handles voice input using Vosk offline speech recognition
"""

import os
import json
import logging
import tempfile
import subprocess
import base64
import wave

logger = logging.getLogger(__name__)

# Try to import vosk
try:
    import vosk
    VOSK_AVAILABLE = True
except ImportError:
    VOSK_AVAILABLE = False
    logger.error("❌ Vosk module not installed. Run: pip install vosk")


class SpeechProcessor:
    """Handles speech-to-text conversion using Vosk"""
    
    def __init__(self, model_path=None):
        """
        Initialize Vosk speech processor
        
        Args:
            model_path: Path to Vosk model directory
        """
        self.model_path = model_path or os.environ.get(
            'VOSK_MODEL_PATH', 
            'models/vosk-model-small-en-us-0.15'
        )
        self.model = None
        self.available = False
        
        # Check if vosk is installed
        if not VOSK_AVAILABLE:
            logger.error("❌ Vosk not installed. Speech recognition unavailable.")
            return
        
        # Try to load model
        self._load_model()
    
    def _load_model(self):
        """Load Vosk model from disk"""
        try:
            # Convert to absolute path if relative
            if not os.path.isabs(self.model_path):
                # Get the Backend directory path
                backend_dir = os.path.dirname(os.path.abspath(__file__))
                project_root = os.path.dirname(backend_dir)
                self.model_path = os.path.join(project_root, self.model_path)
            
            logger.info(f"🔍 Looking for Vosk model at: {self.model_path}")
            
            if not os.path.exists(self.model_path):
                logger.error(
                    f"❌ Vosk model directory not found: {self.model_path}\n"
                    f"   Download from: https://alphacephei.com/vosk/models\n"
                    f"   Expected structure:\n"
                    f"   {self.model_path}/\n"
                    f"     ├── am/\n"
                    f"     ├── conf/\n"
                    f"     ├── graph/\n"
                    f"     └── ivector/"
                )
                return
            
            # Check for required subdirectories
            required_dirs = ['am', 'conf', 'graph']
            missing_dirs = [d for d in required_dirs if not os.path.exists(os.path.join(self.model_path, d))]
            
            if missing_dirs:
                logger.error(
                    f"❌ Vosk model incomplete. Missing directories: {missing_dirs}\n"
                    f"   Please re-download the model from: https://alphacephei.com/vosk/models"
                )
                return
            
            # Load the model
            logger.info(f"📦 Loading Vosk model...")
            self.model = vosk.Model(self.model_path)
            self.available = True
            logger.info(f"✅ Vosk model loaded successfully from: {self.model_path}")
            
        except Exception as e:
            logger.error(f"❌ Failed to load Vosk model: {e}")
            logger.exception("Full error details:")
            self.available = False
    
    def is_available(self):
        """Check if speech recognition is available"""
        return self.available and self.model is not None
    
    def convert_webm_to_wav(self, webm_path, wav_path):
        """
        Convert WebM audio to WAV format required by Vosk
        
        Args:
            webm_path: Path to input WebM file
            wav_path: Path to output WAV file
            
        Returns:
            bool: True if conversion successful
        """
        try:
            # FFmpeg conversion: WebM -> 16kHz mono WAV
            result = subprocess.run([
                "ffmpeg", "-y",  # Overwrite output
                "-i", webm_path,
                "-ar", "16000",   # 16kHz sample rate
                "-ac", "1",       # Mono
                "-f", "wav",      # WAV format
                wav_path
            ], capture_output=True, check=True, timeout=30)
            
            return True
            
        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg conversion failed: {e.stderr.decode()}")
            raise Exception("Audio conversion failed. Ensure ffmpeg is installed.")
        except subprocess.TimeoutExpired:
            logger.error("FFmpeg conversion timeout")
            raise Exception("Audio conversion timeout")
        except FileNotFoundError:
            raise Exception("FFmpeg not found. Please install ffmpeg: choco install ffmpeg")
    
    def recognize_speech_from_wav(self, wav_path):
        """
        Recognize speech from WAV file using Vosk
        
        Args:
            wav_path: Path to WAV file (16kHz, mono, PCM)
            
        Returns:
            str: Recognized text
        """
        if not self.is_available():
            raise Exception("Vosk model not loaded")
        
        try:
            wf = wave.open(wav_path, "rb")
            
            # Verify audio format
            if wf.getnchannels() != 1:
                raise ValueError("Audio must be mono (1 channel)")
            if wf.getsampwidth() != 2:
                raise ValueError("Audio must be 16-bit PCM")
            if wf.getframerate() != 16000:
                raise ValueError("Audio must be 16kHz sample rate")
            
            # Create recognizer
            recognizer = vosk.KaldiRecognizer(self.model, wf.getframerate())
            recognizer.SetWords(True)  # Enable word-level timestamps
            
            # Process audio in chunks
            results = []
            while True:
                audio_data = wf.readframes(4000)
                if len(audio_data) == 0:
                    break
                
                if recognizer.AcceptWaveform(audio_data):
                    result = json.loads(recognizer.Result())
                    text = result.get("text", "").strip()
                    if text:
                        results.append(text)
            
            # Get final result
            final_result = json.loads(recognizer.FinalResult())
            final_text = final_result.get("text", "").strip()
            if final_text:
                results.append(final_text)
            
            wf.close()
            
            # Combine all recognized text
            full_text = " ".join(results).strip()
            
            logger.info(f"✅ Recognized speech: {full_text[:100]}...")
            return full_text
            
        except Exception as e:
            logger.error(f"Speech recognition error: {e}")
            raise
    
    def process_audio_base64(self, audio_base64):
        """
        Process base64-encoded audio (WebM format from browser)
        
        Args:
            audio_base64: Base64-encoded audio data
            
        Returns:
            str: Recognized text
        """
        if not self.is_available():
            raise Exception("Speech recognition not available. Model not loaded.")
        
        # Decode base64
        if "," in audio_base64:
            # Remove data URL prefix (e.g., "data:audio/webm;base64,")
            audio_base64 = audio_base64.split(",", 1)[1]
        
        try:
            audio_bytes = base64.b64decode(audio_base64)
        except Exception as e:
            raise ValueError(f"Invalid base64 audio data: {e}")
        
        if len(audio_bytes) == 0:
            raise ValueError("Empty audio data")
        
        # Create temporary files
        webm_fd, webm_path = tempfile.mkstemp(suffix=".webm")
        wav_fd, wav_path = tempfile.mkstemp(suffix=".wav")
        
        try:
            # Write WebM data
            os.write(webm_fd, audio_bytes)
            os.close(webm_fd)
            os.close(wav_fd)
            
            # Convert to WAV
            self.convert_webm_to_wav(webm_path, wav_path)
            
            # Recognize speech
            recognized_text = self.recognize_speech_from_wav(wav_path)
            
            if not recognized_text:
                raise ValueError("No speech detected in audio")
            
            return recognized_text
            
        finally:
            # Cleanup temp files
            try:
                if os.path.exists(webm_path):
                    os.unlink(webm_path)
                if os.path.exists(wav_path):
                    os.unlink(wav_path)
            except Exception as cleanup_error:
                logger.warning(f"Temp file cleanup error: {cleanup_error}")


# Language support configuration
SUPPORTED_LANGUAGES = [
    {"code": "en", "name": "English", "native": "English"},
    {"code": "hi", "name": "Hindi", "native": "हिन्दी"},
    {"code": "gu", "name": "Gujarati", "native": "ગુજરાતી"},
    {"code": "ta", "name": "Tamil", "native": "தமிழ்"},
    {"code": "te", "name": "Telugu", "native": "తెలుగు"},
    {"code": "bn", "name": "Bengali", "native": "বাংলা"},
    {"code": "mr", "name": "Marathi", "native": "मराठी"},
    {"code": "kn", "name": "Kannada", "native": "ಕನ್ನಡ"},
    {"code": "ml", "name": "Malayalam", "native": "മലയാളം"},
    {"code": "pa", "name": "Punjabi", "native": "ਪੰਜਾਬੀ"},
]


def get_supported_languages():
    """Get list of supported speech recognition languages"""
    return SUPPORTED_LANGUAGES
