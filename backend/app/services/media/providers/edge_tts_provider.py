"""
Edge TTS Provider (Microsoft Edge Text-to-Speech)

Uses the edge-tts library to generate high-quality speech from text.
"""
import logging
import os
import uuid
import tempfile
from typing import Dict, Any, Optional, Literal
import edge_tts

from .base import MediaProvider, MediaProviderResponse, MediaProviderOutput, ProviderError

logger = logging.getLogger(__name__)

class EdgeTTSProvider(MediaProvider):
    """Edge TTS Provider"""

    def __init__(self):
        super().__init__(
            vendor="edge-tts",
            base_url="https://speech.platform.bing.com/consumer/speech/synthesize/readaloud",
            timeout=60
        )
        # Default voice: Korean Female (SunHi)
        self.default_voice = "ko-KR-SunHiNeural" 

    async def generate(
        self,
        prompt: str,
        task: str,
        media_type: Literal["image", "video", "audio"],
        options: Optional[Dict[str, Any]] = None
    ) -> MediaProviderResponse:
        """
        Generate Audio (TTS)
        """
        if media_type != "audio":
            raise ProviderError(
                message=f"Edge TTS only supports 'audio', got '{media_type}'",
                provider=self.vendor,
                status_code=400
            )

        opts = options or {}
        voice = opts.get("voice", self.default_voice)
        rate = opts.get("rate", "+0%")
        volume = opts.get("volume", "+0%")
        pitch = opts.get("pitch", "+0Hz")

        logger.info(f"[EdgeTTS] Generating audio: voice={voice}, text_len={len(prompt)}")

        try:
            # Generate TTS
            communicate = edge_tts.Communicate(prompt, voice, rate=rate, volume=volume, pitch=pitch)
            
            # Save to temp file first
            temp_dir = tempfile.gettempdir()
            temp_filename = f"tts_{uuid.uuid4().hex}.mp3"
            temp_path = os.path.join(temp_dir, temp_filename)
            
            await communicate.save(temp_path)
            
            # Read file to bytes
            with open(temp_path, "rb") as f:
                audio_data = f.read()
                
            # Clean up temp file
            os.remove(temp_path)
            
            # Base64 encode
            import base64
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            
            return MediaProviderResponse(
                provider=self.vendor,
                model=voice,
                outputs=[
                    MediaProviderOutput(
                        type="audio",
                        format="mp3",
                        data=audio_base64,
                        width=0,
                        height=0
                    )
                ],
                meta={
                    "text": prompt,
                    "voice": voice
                }
            )

        except Exception as e:
            logger.error(f"[EdgeTTS] Generation failed: {e}", exc_info=True)
            raise ProviderError(
                message=f"Edge TTS failed: {str(e)}",
                provider=self.vendor,
                details={"text": prompt[:50]}
            )

    async def health_check(self) -> bool:
        return True

    def get_default_options(self, task: str, media_type: str) -> Dict[str, Any]:
        return {
            "voice": self.default_voice,
            "rate": "+0%",
            "volume": "+0%",
            "pitch": "+0Hz"
        }
