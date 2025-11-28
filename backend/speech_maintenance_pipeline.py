"""
Speech-to-Maintenance-Description Pipeline for RailQR
AI4Bharat Integration with Flask Backend

Place this file in: Backend/speech_maintenance_pipeline.py
"""

import asyncio
import aiohttp
import json
import logging
from typing import Dict, Optional, Union
from dataclasses import dataclass, asdict
from enum import Enum
import base64
import io
import wave
import numpy as np

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class LanguageCode(Enum):
    """Supported Indian languages for AI4Bharat ASR"""
    HINDI = "hi"
    BENGALI = "bn"
    GUJARATI = "gu"
    MARATHI = "mr"
    TAMIL = "ta"
    TELUGU = "te"
    KANNADA = "kn"
    MALAYALAM = "ml"
    PUNJABI = "pa"
    ENGLISH = "en"


class ErrorType(Enum):
    """Error types for detailed error handling"""
    EMPTY_AUDIO = "EMPTY_AUDIO"
    UNSUPPORTED_LANGUAGE = "UNSUPPORTED_LANGUAGE"
    API_TIMEOUT = "API_TIMEOUT"
    API_FAILURE = "API_FAILURE"
    NETWORK_ERROR = "NETWORK_ERROR"
    INVALID_AUDIO_FORMAT = "INVALID_AUDIO_FORMAT"
    LLAMA_OFFLINE = "LLAMA_OFFLINE"
    TRANSLATION_FAILED = "TRANSLATION_FAILED"
    ASR_FAILED = "ASR_FAILED"


@dataclass
class PipelineResult:
    """Result object containing all pipeline outputs"""
    success: bool
    original_text: Optional[str] = None
    translated_text: Optional[str] = None
    model_response: Optional[str] = None
    source_language: Optional[str] = None
    error: Optional[str] = None
    error_type: Optional[str] = None
    processing_time: Optional[float] = None
    metadata: Optional[Dict] = None

    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        result = asdict(self)
        if result.get('error_type') and isinstance(result['error_type'], ErrorType):
            result['error_type'] = result['error_type'].value
        return result


class AI4BharatSpeechPipeline:
    """
    Production-ready speech-to-maintenance pipeline
    Integrates AI4Bharat ASR, Translation, and LLaMA inference
    """

    def __init__(
        self,
        asr_endpoint: str = "https://api.dhruva.ai4bharat.org/services/inference/asr",
        translation_endpoint: str = "https://api.dhruva.ai4bharat.org/services/inference/translation",
        llama_endpoint: str = "http://localhost:11434/api/chat",
        api_key: Optional[str] = None,
        llama_model: str = "llama3.2:3b",
        timeout: int = 30,
        sample_rate: int = 16000
    ):
        self.asr_endpoint = asr_endpoint
        self.translation_endpoint = translation_endpoint
        self.llama_endpoint = llama_endpoint
        self.api_key = api_key
        self.llama_model = llama_model
        self.timeout = timeout
        self.sample_rate = sample_rate
        self.session: Optional[aiohttp.ClientSession] = None

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    def _get_headers(self) -> Dict[str, str]:
        """Get API request headers"""
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    async def speech_recognition(
        self,
        audio_base64: str,
        source_language: LanguageCode
    ) -> Dict:
        """
        Convert speech to text using AI4Bharat ASR

        Args:
            audio_base64: Base64-encoded WAV audio
            source_language: Source language code

        Returns:
            Dict with 'text' and metadata
        """
        try:
            if not audio_base64:
                raise ValueError("Empty audio input")

            # Prepare ASR request
            payload = {
                "config": {
                    "language": {
                        "sourceLanguage": source_language.value
                    },
                    "transcriptionFormat": {"value": "transcript"},
                    "audioFormat": "wav",
                    "samplingRate": self.sample_rate
                },
                "audio": [{
                    "audioContent": audio_base64
                }]
            }

            logger.info(f"ASR request for language: {source_language.value}")

            if not self.session:
                self.session = aiohttp.ClientSession()

            async with self.session.post(
                self.asr_endpoint,
                json=payload,
                headers=self._get_headers(),
                timeout=aiohttp.ClientTimeout(total=self.timeout)
            ) as response:
                
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"ASR API error: {error_text}")
                    raise aiohttp.ClientError(f"ASR failed with status {response.status}")

                result = await response.json()
                transcript = result.get("output", [{}])[0].get("source", "")
                
                logger.info(f"✓ ASR Complete: {transcript[:100]}...")
                
                return {
                    "text": transcript.strip(),
                    "language": source_language.value,
                    "confidence": result.get("confidence", None)
                }

        except Exception as e:
            logger.error(f"ASR error: {str(e)}")
            raise

    async def translate_text(
        self,
        text: str,
        source_language: LanguageCode,
        target_language: LanguageCode = LanguageCode.ENGLISH
    ) -> Dict:
        """
        Translate text using AI4Bharat translation service

        Args:
            text: Input text to translate
            source_language: Source language code
            target_language: Target language code (default: English)

        Returns:
            Dict with 'translated_text' and metadata
        """
        try:
            if not text or not text.strip():
                raise ValueError("Empty text input for translation")

            payload = {
                "input": [{"source": text}],
                "config": {
                    "language": {
                        "sourceLanguage": source_language.value,
                        "targetLanguage": target_language.value
                    }
                }
            }

            logger.info(f"Translating {source_language.value} → {target_language.value}")

            if not self.session:
                self.session = aiohttp.ClientSession()

            async with self.session.post(
                self.translation_endpoint,
                json=payload,
                headers=self._get_headers(),
                timeout=aiohttp.ClientTimeout(total=self.timeout)
            ) as response:
                
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"Translation API error: {error_text}")
                    raise aiohttp.ClientError(f"Translation failed with status {response.status}")

                result = await response.json()
                translated = result.get("output", [{}])[0].get("target", "")
                
                logger.info(f"✓ Translation Complete: {translated[:100]}...")
                
                return {
                    "translated_text": translated.strip(),
                    "source_language": source_language.value,
                    "target_language": target_language.value
                }

        except Exception as e:
            logger.error(f"Translation error: {str(e)}")
            raise

    async def llama_inference(
        self,
        prompt: str,
        system_prompt: Optional[str] = None
    ) -> Dict:
        """
        Generate standardized maintenance description using LLaMA

        Args:
            prompt: User prompt (translated maintenance description)
            system_prompt: Optional system prompt for context

        Returns:
            Dict with 'response' and metadata
        """
        if system_prompt is None:
            system_prompt = """You are a professional railway maintenance technician and technical writer. 
Your task is to rewrite maintenance notes into concise, technical, and actionable descriptions.

Rules:
- Preserve all facts, component names, asset IDs, coach numbers, locations, dates exactly
- Focus on: (1) issue/fault observed, (2) action taken, (3) outcome/status
- Remove casual language, use clear technical language
- Keep under 150 words in a single paragraph
- Output plain text only, no markdown
- Wrap output in <description></description> tags"""

        try:
            if not prompt or not prompt.strip():
                raise ValueError("Empty prompt for LLaMA inference")

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Rewrite this maintenance description professionally:\n\n{prompt}"}
            ]

            payload = {
                "model": self.llama_model,
                "messages": messages,
                "options": {
                    "temperature": 0.3,
                    "num_predict": 250
                },
                "stream": False
            }

            logger.info("Sending LLaMA inference request")

            if not self.session:
                self.session = aiohttp.ClientSession()

            async with self.session.post(
                self.llama_endpoint,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=self.timeout * 2)
            ) as response:
                
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"LLaMA API error: {error_text}")
                    
                    if "connection" in error_text.lower() or "refused" in error_text.lower():
                        raise ConnectionError("LLaMA endpoint offline")
                    
                    raise aiohttp.ClientError(f"LLaMA failed with status {response.status}")

                result = await response.json()
                raw_response = result.get("message", {}).get("content", "").strip()
                
                # Extract content from description tags
                import re
                match = re.search(r'<description>(.*?)</description>', raw_response, re.DOTALL | re.IGNORECASE)
                
                if match:
                    enhanced_description = match.group(1).strip()
                else:
                    enhanced_description = self._clean_llama_output(raw_response)
                
                logger.info("✓ LLaMA Enhancement Complete")
                
                return {
                    "response": enhanced_description,
                    "raw_response": raw_response,
                    "model": self.llama_model
                }

        except ConnectionError as e:
            logger.error(f"LLaMA connection error: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"LLaMA inference error: {str(e)}")
            raise

    async def process_audio(
        self,
        audio_base64: str,
        source_language: LanguageCode
    ) -> PipelineResult:
        """
        Complete pipeline: ASR -> Translation -> LLaMA enhancement

        Args:
            audio_base64: Base64-encoded WAV audio
            source_language: Spoken language in audio

        Returns:
            PipelineResult with all outputs and metadata
        """
        from datetime import datetime
        start_time = datetime.now()
        
        try:
            logger.info("=" * 50)
            logger.info("PIPELINE START: Speech-to-Maintenance")
            logger.info("=" * 50)
            
            # Step 1: Speech Recognition
            try:
                asr_result = await self.speech_recognition(audio_base64, source_language)
                original_text = asr_result["text"]
                
                if not original_text:
                    return PipelineResult(
                        success=False,
                        error="No speech detected in audio",
                        error_type=ErrorType.EMPTY_AUDIO.value
                    )
                
            except ValueError as e:
                if "Empty audio" in str(e):
                    return PipelineResult(
                        success=False,
                        error=str(e),
                        error_type=ErrorType.EMPTY_AUDIO.value
                    )
                raise
            
            # Step 2: Translation (skip if already English)
            translated_text = original_text
            translation_time = 0
            
            if source_language != LanguageCode.ENGLISH:
                try:
                    translation_result = await self.translate_text(
                        original_text,
                        source_language,
                        LanguageCode.ENGLISH
                    )
                    translated_text = translation_result["translated_text"]
                    
                except Exception as e:
                    return PipelineResult(
                        success=False,
                        original_text=original_text,
                        error=f"Translation failed: {str(e)}",
                        error_type=ErrorType.TRANSLATION_FAILED.value
                    )
            else:
                logger.info("✓ Translation Skipped (source is English)")
            
            # Step 3: LLaMA Enhancement
            try:
                llama_result = await self.llama_inference(translated_text)
                model_response = llama_result["response"]
                
            except ConnectionError:
                return PipelineResult(
                    success=False,
                    original_text=original_text,
                    translated_text=translated_text,
                    error="Local AI model is offline. Please ensure Ollama is running.",
                    error_type=ErrorType.LLAMA_OFFLINE.value
                )
            except Exception as e:
                return PipelineResult(
                    success=False,
                    original_text=original_text,
                    translated_text=translated_text,
                    error=f"LLaMA inference failed: {str(e)}",
                    error_type=ErrorType.API_FAILURE.value
                )
            
            # Success!
            total_time = (datetime.now() - start_time).total_seconds()
            logger.info("=" * 50)
            logger.info(f"✓ PIPELINE COMPLETE in {total_time:.2f}s")
            logger.info("=" * 50)
            
            return PipelineResult(
                success=True,
                original_text=original_text,
                translated_text=translated_text,
                model_response=model_response,
                source_language=source_language.value,
                processing_time=total_time,
                metadata={
                    "model": self.llama_model
                }
            )
            
        except asyncio.TimeoutError:
            return PipelineResult(
                success=False,
                error="Request timed out",
                error_type=ErrorType.API_TIMEOUT.value
            )
        except Exception as e:
            logger.exception("Unexpected pipeline error")
            return PipelineResult(
                success=False,
                error=f"Unexpected error: {str(e)}",
                error_type=ErrorType.API_FAILURE.value
            )

    def _clean_llama_output(self, text: str) -> str:
        """Clean LLaMA output removing markdown and formatting"""
        import re
        text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
        text = re.sub(r'^#+\s+', '', text, flags=re.MULTILINE)
        text = re.sub(r'^\s*[-*]\s+', '', text, flags=re.MULTILINE)
        text = re.sub(r'\n{3,}', '\n\n', text)
        return text.strip()


# Global pipeline instance for Flask
_pipeline_instance = None

def get_pipeline() -> AI4BharatSpeechPipeline:
    """Get or create global pipeline instance"""
    global _pipeline_instance
    if _pipeline_instance is None:
        _pipeline_instance = AI4BharatSpeechPipeline()
    return _pipeline_instance
