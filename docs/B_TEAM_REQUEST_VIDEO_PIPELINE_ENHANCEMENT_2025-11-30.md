# B Team Request: Video Pipeline Enhancement (2025-11-30)

## 1. Problem Analysis
Based on the recent pipeline test failures and output quality issues, we have identified the following critical areas for improvement.

| Issue | Root Cause | Proposed Solution |
| :--- | :--- | :--- |
| **Low Image Quality** | `image_prompt_hint` is too brief/vague. | Change to detailed `image_prompt` field + Strengthen LLM instructions for visual details (lighting, style). |
| **Text in Images** | Gemini renders prompt text into the image. | Add explicit "NO TEXT" instructions and negative prompts. |
| **Subtitle Quality** | `text_overlay` missing causes fallback to full `voiceover`. | Enforce separate `subtitle_text` (short) and `voiceover` (long). |
| **Rendering Instability** | External placeholder URLs (placehold.co) may timeout/fail. | Use local placeholder images or robust retry logic. |

## 2. Action Items (P0 - Immediate)

### 2.1. Enhance StoryboardBuilderAgent (LLM Prompt)
*   **Objective**: Generate high-quality image prompts and separate subtitles from voiceovers.
*   **Tasks**:
    1.  Update `SYSTEM_PROMPT` in `storyboard_builder.py`.
    2.  Explicitly instruct to generate **detailed visual descriptions** (lighting, composition, mood) for `image_prompt`.
    3.  Add negative constraints: "Do not include text, sign, or logo in the image."
    4.  Ensure `text_overlay` is short (max 20 chars) for subtitles.
    5.  Ensure `voiceover` is natural spoken Korean.

### 2.2. Improve VisionGeneratorAgent
*   **Objective**: Prevent text rendering in images.
*   **Tasks**:
    1.  Inject default negative prompts: "text, watermark, signature, writing, letters" into the image generation request.

### 2.3. Robust Fallback
*   **Objective**: Ensure video renders even if external placeholders fail.
*   **Tasks**:
    1.  (Optional) Download a local placeholder image during container startup or use a solid color generator if possible. *For now, we will rely on the redirect fix implemented in Step 213, but keep this in mind.*

## 3. Expected Outcome
*   Images will look more professional and cinematic.
*   Images will be free of random gibberish text.
*   Video subtitles will be readable and distinct from the narration.
