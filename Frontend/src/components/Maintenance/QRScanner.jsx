import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../services/api';

const QRScanner = ({ isOpen, onClose, onScanComplete }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const isScanningRef = useRef(false);
  const frameCountRef = useRef(0);
  const onScanCompleteRef = useRef(onScanComplete);

  // Keep callback ref updated
  useEffect(() => {
    onScanCompleteRef.current = onScanComplete;
  }, [onScanComplete]);

  const stopScanner = useCallback(async () => {
    isScanningRef.current = false;
    
    // Clear scanning interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setScanning(false);
  }, []);

  const captureAndScanFrame = useCallback(async () => {
    if (!isScanningRef.current || !videoRef.current || !canvasRef.current) {
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to base64 image
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      frameCountRef.current += 1;

      // Send frame to backend for QR scanning
      try {
        const result = await api.qr.scanFromFrame(imageData);

        // If success with valid asset data, stop scanning and trigger callback
        if (result.success && result.assetId && result.asset) {
          console.log('QR code detected with asset:', result.assetId);
          
          // Immediately stop scanning and clear interval
          isScanningRef.current = false;
          if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
          }
          
          // Stop camera
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
          
          setScanning(false);
          
          // Call the completion handler with the asset data
          if (onScanCompleteRef.current) {
            onScanCompleteRef.current(result.assetId);
          }
          
          return true;
        }
        
        // Handle specific error cases
        if (result.error === "Asset not found") {
          console.log('QR detected but asset not found');
          setError("QR code scanned but asset not found in database");
          await stopScanner();
          return false;
        }
        
        // If no QR detected, continue scanning
        return false;
        
      } catch (err) {
        console.error('QR scan error:', err);
        if (err.message?.includes('404')) {
          setError("Invalid QR code: Asset not found");
          await stopScanner();
          return false;
        }
        // Other errors - continue scanning
        return false;
      }
      
    } catch (err) {
      // Log error but continue scanning
      if (frameCountRef.current % 30 === 0) { // Only log every 30 frames to avoid spam
        console.debug('Scan error:', err.message);
      }
    }
  }, [stopScanner]);

  const startScanner = useCallback(async () => {
    if (isScanningRef.current) {
      return; // Already scanning
    }

    try {
      setError('');
      setScanning(true);
      isScanningRef.current = true;
      frameCountRef.current = 0;

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;

      // Set video source
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();

        // Wait for video to be ready
        await new Promise((resolve) => {
          if (videoRef.current.readyState >= 2) {
            resolve();
          } else {
            videoRef.current.addEventListener('loadedmetadata', resolve, { once: true });
          }
        });

        // Start continuous scanning loop
        // Scan every 200ms (5 frames per second) to balance performance and responsiveness
        scanIntervalRef.current = setInterval(() => {
          if (isScanningRef.current) {
            captureAndScanFrame();
          }
        }, 200);
      }

    } catch (err) {
      console.error('Scanner error:', err);
      setError('Failed to start camera. Please check permissions and ensure camera is available. Error: ' + err.message);
      setScanning(false);
      isScanningRef.current = false;
      
      // Clean up on error
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  }, [captureAndScanFrame]);

  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        startScanner();
      }, 300);
      
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen, startScanner, stopScanner]);

  if (!isOpen) return null;

  return (
    <div className="modal show" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Scan QR Code</h3>
          <button className="close-btn" onClick={onClose}>
            <span className="material-icons-round">close</span>
          </button>
        </div>

        <div className="modal-body">
          <div style={{ position: 'relative', width: '100%', maxWidth: '500px', margin: '0 auto' }}>
            {/* Video element for camera feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: '12px',
                backgroundColor: '#000',
                display: scanning && !error ? 'block' : 'none'
              }}
            />
            
            {/* Hidden canvas for frame capture */}
            <canvas
              ref={canvasRef}
              style={{ display: 'none' }}
            />

            {/* Loading/Error states */}
            {error && (
              <div className="error-message" style={{ marginTop: 16, color: '#f44336', padding: '12px', background: '#ffebee', borderRadius: '8px' }}>
                <span className="material-icons-round" style={{ verticalAlign: 'middle', marginRight: '8px' }}>error_outline</span>
                {error}
              </div>
            )}
            
            {scanning && !error && (
              <div style={{ 
                marginTop: 16, 
                textAlign: 'center', 
                color: '#666', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px',
                padding: '12px',
                background: '#E3F2FD',
                borderRadius: '8px'
              }}>
                <span className="material-icons-round" style={{ animation: 'pulse 2s infinite', color: '#1976D2' }}>qr_code_scanner</span>
                <span>Position QR code within the frame</span>
              </div>
            )}
            
            {!scanning && !error && (
              <div style={{ 
                marginTop: 16, 
                textAlign: 'center', 
                color: '#666',
                padding: '40px',
                background: '#F5F5F5',
                borderRadius: '12px'
              }}>
                <span className="material-icons-round" style={{ fontSize: '48px', color: '#999', marginBottom: '12px' }}>camera_alt</span>
                <p>Initializing camera...</p>
              </div>
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button className="md-button outline" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
