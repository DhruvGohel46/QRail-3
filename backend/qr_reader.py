import cv2
import numpy as np
import json
from typing import Tuple, Optional, Dict, Any, List
import traceback
import logging

try:
    logger = logging.getLogger(__name__)
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
except Exception:
    class SimpleLogger:
        def info(self, msg): print(f"INFO: {msg}")
        def warning(self, msg): print(f"WARNING: {msg}")
        def error(self, msg): print(f"ERROR: {msg}")
        def debug(self, msg): print(f"DEBUG: {msg}")
    logger = SimpleLogger()


class RailwayQRReader:
    """
    Optimized QR Reader using OpenCV native detectors for faster performance.
    Removes slow pyzbar dependency and uses QRCodeDetectorAruco for best speed.
    """
    
    def __init__(self):
        self.cv_detector = None
        self.aruco_detector = None
        self._dependencies_available = False
        
        # Initialize standard OpenCV QR detector
        try:
            self.cv_detector = cv2.QRCodeDetector()
            self._dependencies_available = True
            logger.info("✅ OpenCV QR detector initialized")
        except Exception as e:
            logger.warning(f"⚠️ OpenCV QR detector not available: {e}")
        
        # Try to initialize the faster Aruco-based QR detector (OpenCV 4.7+)
        try:
            # Check if QRCodeDetectorAruco is available (newer OpenCV versions)
            if hasattr(cv2, 'QRCodeDetectorAruco'):
                self.aruco_detector = cv2.QRCodeDetectorAruco()
                logger.info("✅ OpenCV QRCodeDetectorAruco initialized (faster detection)")
        except Exception as e:
            logger.debug(f"QRCodeDetectorAruco not available: {e}")
    
    @property
    def dependencies_available(self) -> bool:
        """Check if QR detection is available"""
        return self._dependencies_available and (self.cv_detector is not None or self.aruco_detector is not None)
    
    def _fast_preprocess(self, image: np.ndarray) -> List[np.ndarray]:
        """
        Simplified preprocessing for speed - only essential transformations
        """
        processed = []
        
        # Original
        processed.append(image)
        
        # Convert to grayscale if needed
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        processed.append(gray)
        
        # Only adaptive threshold (best for QR codes)
        try:
            adaptive = cv2.adaptiveThreshold(
                gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                cv2.THRESH_BINARY, 11, 2
            )
            processed.append(adaptive)
        except Exception:
            pass
        
        return processed
    
    def _detect_with_aruco(self, image: np.ndarray) -> Optional[str]:
        """Fast detection using Aruco-based detector"""
        if not self.aruco_detector:
            return None
        
        try:
            success, decoded_info, points, straight_qrcode = self.aruco_detector.detectAndDecode(image)
            if success and len(decoded_info) > 0 and decoded_info[0]:
                data = decoded_info[0].strip()
                if data:
                    logger.debug(f"Aruco detected QR: {data[:50]}...")
                    return data
        except Exception as e:
            logger.debug(f"Aruco detection error: {e}")
        
        return None
    
    def _detect_with_opencv(self, image: np.ndarray) -> Optional[str]:
        """Standard OpenCV detection"""
        if not self.cv_detector:
            return None
        
        try:
            data, points, straight_qrcode = self.cv_detector.detectAndDecode(image)
            if data and len(data.strip()) > 0:
                logger.debug(f"OpenCV detected QR: {data[:50]}...")
                return data.strip()
        except Exception as e:
            logger.debug(f"OpenCV detection error: {e}")
        
        return None
    
    def _fast_detect(self, image: np.ndarray) -> Optional[str]:
        """
        Fast detection strategy - try Aruco first (faster), then standard OpenCV
        """
        # Try Aruco detector first (fastest)
        if self.aruco_detector:
            result = self._detect_with_aruco(image)
            if result:
                return result
        
        # Fallback to standard detector
        if self.cv_detector:
            result = self._detect_with_opencv(image)
            if result:
                return result
        
        return None
    
    def read_qr_from_bytes(self, image_bytes: bytes) -> Tuple[bool, Optional[str], Optional[Dict[str, Any]]]:
        """
        Optimized QR reading - minimal preprocessing for speed
        
        Args:
            image_bytes: Raw image bytes
            
        Returns:
            Tuple of (success, qr_data, parsed_payload)
        """
        if not self.dependencies_available:
            logger.error("No QR detection libraries available")
            return False, None, None
        
        try:
            # Decode image
            nparr = np.frombuffer(image_bytes, np.uint8)
            if len(nparr) == 0:
                return False, None, None
            
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if image is None:
                return False, None, None
            
            # Fast detection on original image first
            result = self._fast_detect(image)
            if result:
                try:
                    parsed_data = json.loads(result)
                    logger.info("✅ QR decoded (fast path)")
                    return True, result, parsed_data
                except json.JSONDecodeError:
                    logger.info("✅ QR decoded (non-JSON)")
                    return True, result, None
            
            # If that failed, try minimal preprocessing
            for processed_img in self._fast_preprocess(image):
                result = self._fast_detect(processed_img)
                if result:
                    try:
                        parsed_data = json.loads(result)
                        logger.info("✅ QR decoded (preprocessed)")
                        return True, result, parsed_data
                    except json.JSONDecodeError:
                        return True, result, None
            
            logger.debug("No QR code detected")
            return False, None, None
            
        except Exception as e:
            logger.error(f"Error processing image: {e}")
            traceback.print_exc()
            return False, None, None
    
    def is_railway_qr(self, payload: dict) -> bool:
        """Check if payload matches railway QR schema"""
        try:
            if not isinstance(payload, dict):
                return False
            
            required = {'aid'}  # At minimum, need asset ID
            optional_fields = {'v', 'tp', 'mfg', 'mfd', 'type', 'manufacturer_id', 'manufacturing_date'}
            
            has_required = required.issubset(set(payload.keys()))
            has_optional = bool(set(payload.keys()) & optional_fields)
            
            return has_required and has_optional
        except Exception:
            return False
    
    def get_detection_info(self) -> Dict[str, Any]:
        """Get information about available detection methods"""
        return {
            'opencv_available': self.cv_detector is not None,
            'aruco_available': self.aruco_detector is not None,
            'dependencies_ok': self.dependencies_available,
            'recommended': 'QRCodeDetectorAruco' if self.aruco_detector else 'QRCodeDetector'
        }
