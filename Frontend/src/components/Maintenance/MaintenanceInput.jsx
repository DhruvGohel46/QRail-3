import React, { useState, useEffect, useRef } from 'react';
import './MaintenanceInput.css';

const MaintenanceInput = ({ onSubmit, initialValue = '' }) => {
  const [description, setDescription] = useState(initialValue);
  const [isListening, setIsListening] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isProcessingSpeech, setIsProcessingSpeech] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [supportedLanguages, setSupportedLanguages] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Sync with parent's initialValue changes
  useEffect(() => {
    setDescription(initialValue);
  }, [initialValue]);

  // Notify parent of description changes
  useEffect(() => {
    if (onSubmit) {
      onSubmit(description);
    }
  }, [description, onSubmit]);

  // Load supported languages on mount
  useEffect(() => {
    fetchSupportedLanguages();
    checkAudioSupport();
  }, []);

  const fetchSupportedLanguages = async () => {
    try {
      const response = await fetch('/api/speech/languages', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setSupportedLanguages(data.languages);
      }
    } catch (err) {
      console.error('Failed to load languages:', err);
      // Fallback languages
      setSupportedLanguages([
        { code: 'en', name: 'English', native: 'English' },
        { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
        { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
      ]);
    }
  };

  const checkAudioSupport = () => {
    const hasMediaRecorder = !!navigator.mediaDevices?.getUserMedia;
    setSpeechSupported(hasMediaRecorder);
    if (!hasMediaRecorder) {
      console.warn('MediaRecorder API not supported in this browser');
    }
  };

  const startRecording = async () => {
    if (!speechSupported) {
      setError('Audio recording is not supported in your browser. Please use Chrome, Edge, or Firefox.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        }
      });

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });

      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudioBlob(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsListening(true);
      setError('');
      console.log('🎤 Recording started');
    } catch (err) {
      console.error('Recording error:', err);
      setError('Failed to access microphone. Please grant permission and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
      console.log('⏹️ Recording stopped');
    }
  };

  const processAudioBlob = async (audioBlob) => {
    setIsProcessingSpeech(true);
    setError('');

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result;

        console.log('📤 Sending audio to speech recognition...');

        const response = await fetch('/api/speech/process-audio', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            audio: base64Audio,
            language: selectedLanguage
          }),
        });

        const data = await response.json();

        if (data.success) {
          // JUST show the recognized text - NO AI enhancement yet
          const recognizedText = data.recognized_text;

          // Append to existing description
          if (description.trim()) {
            setDescription(prev => prev.trim() + ' ' + recognizedText);
          } else {
            setDescription(recognizedText);
          }

          const langName = supportedLanguages.find(l => l.code === selectedLanguage)?.name || 'selected language';
          setSuccess(`✓ Voice input recognized (${langName}). You can now edit or enhance with AI.`);
          setTimeout(() => setSuccess(''), 4000);

          console.log('✅ Speech recognized:', recognizedText);
        } else {
          if (data.error_type === 'MODEL_NOT_LOADED') {
            setError('Speech recognition model not loaded. Please contact administrator.');
          } else if (data.error_type === 'EMPTY_AUDIO') {
            setError('No speech detected. Please speak clearly and try again.');
          } else {
            setError(data.error || 'Failed to process speech');
          }
        }
      };

      reader.onerror = () => {
        setError('Failed to read audio file');
        setIsProcessingSpeech(false);
      };
    } catch (err) {
      console.error('Speech processing error:', err);
      setError('Network error. Please check your connection.');
      setIsProcessingSpeech(false);
    } finally {
      setIsProcessingSpeech(false);
    }
  };

  const handleEnhance = async () => {
    if (!description.trim()) {
      setError('Please enter or speak a description first');
      return;
    }

    setIsEnhancing(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/ai/enhance-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ description: description.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setDescription(data.enhanced_description);
        setSuccess('✓ Description enhanced with AI');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        if (data.error_type === 'OLLAMA_OFFLINE') {
          setError('AI model is offline. Please start Ollama and ensure Llama 3.2:3b is installed.');
        } else {
          setError(data.error || 'Failed to enhance description');
        }
      }
    } catch (err) {
      console.error('Enhancement error:', err);
      setError('Network error. Please check your connection.');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleManualInput = (e) => {
    // User can type freely at any time
    setDescription(e.target.value);
    setError(''); // Clear errors when user starts typing
  };

  return (
    <div className="maintenance-input-container">
      <div className="input-header">
        <label htmlFor="description">Maintenance Description</label>
        <div className="input-controls">
          {/* Language selector */}
          {supportedLanguages.length > 0 && (
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="language-select"
              disabled={isListening || isProcessingSpeech}
            >
              {supportedLanguages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.native}
                </option>
              ))}
            </select>
          )}

          {/* Voice input button */}
          {speechSupported && (
            <button
              type="button"
              className={`voice-btn ${isListening ? 'listening' : ''}`}
              onClick={isListening ? stopRecording : startRecording}
              disabled={isProcessingSpeech || isEnhancing}
              title={isListening ? 'Stop recording' : 'Start voice input'}
            >
              {isListening ? '⏹️ Stop' : '🎤 Voice'}
            </button>
          )}

          {/* AI Enhancement button */}
          <button
            type="button"
            className="enhance-btn"
            onClick={handleEnhance}
            disabled={!description.trim() || isEnhancing || isProcessingSpeech || isListening}
            title="Enhance description with AI"
          >
            {isEnhancing ? '⏳ Enhancing...' : '✨ Enhance with AI'}
          </button>
        </div>
      </div>

      {/* Text area */}
      <textarea
        id="description"
        className="description-textarea"
        value={description}
        onChange={handleManualInput}
        placeholder="Type maintenance description or use voice input..."
        rows={6}
        disabled={isProcessingSpeech || isListening}
      />

      {/* Processing indicator */}
      {isProcessingSpeech && (
        <div className="processing-indicator">
          <span className="spinner">🔄</span> Processing speech...
        </div>
      )}

      {/* Status messages */}
      {success && <div className="success-message">{success}</div>}
      {error && <div className="error-message">{error}</div>}

      {/* Help text */}
      <div className="help-text">
        <small>
          💡 Tip: Use voice input for quick notes, then enhance with AI for professional formatting
        </small>
      </div>
    </div>
  );
};

export default MaintenanceInput;
