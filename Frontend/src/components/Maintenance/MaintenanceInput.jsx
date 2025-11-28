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
  }, [description]);

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
        { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
        { code: 'te', name: 'Telugu', native: 'తెలుగు' },
        { code: 'bn', name: 'Bengali', native: 'বাংলা' },
        { code: 'mr', name: 'Marathi', native: 'मराठी' },
        { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
        { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
        { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' }
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
      console.log('Recording started');
      
    } catch (err) {
      console.error('Recording error:', err);
      setError('Failed to access microphone. Please grant permission and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
      console.log('Recording stopped');
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
        
        console.log('Sending audio to speech pipeline...');
        
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
          // Append to existing description (don't replace)
          const newDescription = data.model_response || data.translated_text || data.original_text;
          
          if (description.trim()) {
            // Add space if there's existing content
            setDescription(prev => prev.trim() + ' ' + newDescription);
          } else {
            setDescription(newDescription);
          }
          
          const langName = supportedLanguages.find(l => l.code === selectedLanguage)?.name || 'selected language';
          setSuccess(`✓ Voice input processed (${langName})`);
          setTimeout(() => setSuccess(''), 3000);
          
          console.log('Speech processed successfully:', {
            original: data.original_text,
            translated: data.translated_text,
            enhanced: data.model_response
          });
        } else {
          if (data.error_type === 'LLAMA_OFFLINE') {
            setError('AI model is offline. Please start Ollama and ensure Llama 3.2:3b is installed.');
          } else if (data.error_type === 'EMPTY_AUDIO') {
            setError('No speech detected. Please speak clearly and try again.');
          } else if (data.error_type === 'UNSUPPORTED_LANGUAGE') {
            setError(data.error || 'Unsupported language selected.');
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
        <label htmlFor="maintenance-description">
          Maintenance Description
          <span className="input-hint">Type or speak your description</span>
        </label>
        
        <div className="button-group">
          {/* Language Selector for Voice Input */}
          {speechSupported && (
            <div className="language-selector">
              <label htmlFor="speech-language" className="sr-only">Speech Language</label>
              <select 
                id="speech-language"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="language-select"
                disabled={isListening || isProcessingSpeech}
                title="Select speech input language"
              >
                {supportedLanguages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    🌐 {lang.native}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Voice Input Button */}
          {speechSupported && (
            <button
              type="button"
              onClick={isListening ? stopRecording : startRecording}
              className={`mic-button ${isListening ? 'listening' : ''}`}
              title={isListening ? 'Stop recording' : 'Start voice input'}
              disabled={isProcessingSpeech || isEnhancing}
            >
              <span className="mic-icon">{isListening ? '⏹️' : '🎤'}</span>
              {isListening ? 'Stop Recording' : 'Voice Input'}
            </button>
          )}
          
          {/* AI Enhance Button */}
          <button
            type="button"
            onClick={handleEnhance}
            disabled={isEnhancing || !description.trim() || isProcessingSpeech}
            className="enhance-button"
            title="Improve description with AI"
          >
            <span className="ai-icon">✨</span>
            {isEnhancing ? 'Enhancing...' : 'Enhance with AI'}
          </button>
        </div>
      </div>

      {/* Main Textarea - Always Editable */}
      <textarea
        id="maintenance-description"
        value={description}
        onChange={handleManualInput}
        placeholder="Type your maintenance description here, or use voice input in any Indian language..."
        rows="6"
        className={`
          maintenance-textarea
          ${isListening ? 'listening-active' : ''} 
          ${isProcessingSpeech ? 'processing' : ''}
        `}
        disabled={isEnhancing || isProcessingSpeech}
        required
      />

      {/* Status Indicators */}
      {isListening && (
        <div className="status-indicator listening-indicator">
          <span className="pulse"></span>
          <span className="status-text">
            🎤 Listening in {supportedLanguages.find(l => l.code === selectedLanguage)?.name || 'selected language'}... 
            Speak now
          </span>
        </div>
      )}

      {isProcessingSpeech && (
        <div className="status-indicator processing-indicator">
          <span className="spinner"></span>
          <span className="status-text">
            Processing speech → Transcribing → Translating → Enhancing...
          </span>
        </div>
      )}

      {/* Error Messages */}
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Success Messages */}
      {success && (
        <div className="success-message">
          <span className="success-icon">✓</span>
          <span>{success}</span>
        </div>
      )}

      {/* Help Text */}
      <div className="input-help">
        <small>
          💡 Tip: You can type manually or use voice input in Hindi, Gujarati, Tamil, Telugu, and 6 other Indian languages. 
          Click "Enhance with AI" to improve any description.
        </small>
      </div>
    </div>
  );
};

export default MaintenanceInput;
