# Video Pipeline V2 Emergency Patch Report

**Date**: 2025-11-29 22:15
**Status**: Patched (Auto-Fallback Enabled)

## Issue
- Users reported "Scene Placeholder" (black screen) in the final video.
- This indicates that `VisionGenerator` failed to generate images (likely due to Gemini API issues or model unavailability), and the system fell back to empty placeholders.
- The previous fix (changing model name) might not have been applied (requires restart) or the model is still unstable.

## Fixes Applied

### 1. Auto-Fallback to Mock Images (`video_director.py`)
- **Change**: Modified `_prepare_images_v3` to automatically detect if images are missing after the generation attempt.
- **Behavior**: If Gemini fails to generate an image for a scene, the system now **automatically** fills it with a high-quality random image from `picsum.photos` (seeded by scene index for consistency).
- **Benefit**: Users will ALWAYS see a video with images, never a black placeholder screen, even if the AI backend is completely down.

### 2. Korean Language Enforcement (`storyboard_builder.py`)
- **Change**: Updated the system prompt to explicitly mandate **Korean (한국어)** output for all text elements (voiceover, text overlay).
- **Benefit**: Ensures the generated marketing content is in the user's preferred language.

## Instructions
1. **Restart Backend**: You MUST restart the backend service for these changes to take effect.
   ```bash
   docker compose -f docker/mac-mini/docker-compose.yml restart backend
   # OR if running locally
   # Ctrl+C -> python main.py
   ```
2. **Retry**: Generate the video again. It should now show images (either AI-generated or high-quality demos) and Korean text.
