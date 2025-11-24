"""
Image Text Extractor

이미지 파일에서 텍스트를 추출하는 서비스 (OCR)

작성일: 2025-11-24
작성자: B팀 (Backend)
참조: SPARKLIO_MVP_MASTER_TRACKER.md - P0-1 Brand OS Module
"""

import logging
from typing import Dict, Any, Optional
from pathlib import Path

try:
    from PIL import Image
    import pytesseract
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False

logger = logging.getLogger(__name__)


class ImageExtractorError(Exception):
    """이미지 텍스트 추출 에러"""
    pass


class ImageExtractor:
    """
    이미지 텍스트 추출 서비스 (OCR)

    Tesseract OCR을 사용하여 이미지에서 텍스트를 추출합니다.

    Features:
    - JPEG, PNG, GIF, WEBP 지원
    - 한글 + 영어 OCR
    - 이미지 메타데이터 추출
    - 신뢰도 점수

    Requirements:
    - Tesseract OCR 설치 필요 (시스템 레벨)
    - Windows: https://github.com/UB-Mannheim/tesseract/wiki
    - Linux: apt-get install tesseract-ocr tesseract-ocr-kor
    """

    def __init__(self, tesseract_cmd: Optional[str] = None):
        """
        Args:
            tesseract_cmd: Tesseract 실행 파일 경로 (optional)
        """
        if not TESSERACT_AVAILABLE:
            raise ImportError(
                "PIL and pytesseract are required for image OCR. "
                "Install them with: pip install pillow pytesseract"
            )

        # Tesseract 경로 설정 (Windows의 경우)
        if tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

    def extract(self, file_path: str, lang: str = 'kor+eng') -> Dict[str, Any]:
        """
        이미지 파일에서 텍스트 추출 (OCR)

        Args:
            file_path: 이미지 파일 경로
            lang: OCR 언어 ('kor+eng' = 한글+영어)

        Returns:
            Dict with:
                - extracted_text: 추출된 텍스트
                - confidence: 신뢰도 점수 (0-100)
                - metadata: 이미지 메타데이터

        Raises:
            ImageExtractorError: 텍스트 추출 실패 시
        """
        try:
            path = Path(file_path)
            if not path.exists():
                raise ImageExtractorError(f"File not found: {file_path}")

            # 지원 포맷 확인
            supported_formats = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'}
            if path.suffix.lower() not in supported_formats:
                raise ImageExtractorError(
                    f"Unsupported image format: {path.suffix}. "
                    f"Supported: {supported_formats}"
                )

            # 이미지 열기
            with Image.open(file_path) as img:
                # 이미지 메타데이터
                metadata = self._extract_metadata(img)

                # OCR 실행
                try:
                    # 텍스트 추출
                    extracted_text = pytesseract.image_to_string(img, lang=lang)

                    # 상세 데이터 추출 (신뢰도 포함)
                    data = pytesseract.image_to_data(img, lang=lang, output_type=pytesseract.Output.DICT)

                    # 평균 신뢰도 계산 (confidence가 -1이 아닌 것들만)
                    confidences = [conf for conf in data['conf'] if conf != -1]
                    avg_confidence = sum(confidences) / len(confidences) if confidences else 0

                    logger.info(
                        f"Successfully extracted text from image: {file_path}, "
                        f"chars: {len(extracted_text.strip())}, confidence: {avg_confidence:.1f}"
                    )

                    return {
                        "extracted_text": extracted_text.strip(),
                        "confidence": round(avg_confidence, 1),
                        "metadata": metadata
                    }

                except pytesseract.TesseractNotFoundError:
                    raise ImageExtractorError(
                        "Tesseract is not installed or not in PATH. "
                        "Please install Tesseract OCR first."
                    )
                except pytesseract.TesseractError as e:
                    raise ImageExtractorError(f"Tesseract OCR failed: {str(e)}")

        except ImageExtractorError:
            raise
        except Exception as e:
            logger.error(f"Error extracting text from image {file_path}: {str(e)}")
            raise ImageExtractorError(f"Image extraction failed: {str(e)}")

    def _extract_metadata(self, img: Image.Image) -> Dict[str, Any]:
        """이미지 메타데이터 추출"""
        metadata = {
            "format": img.format,
            "mode": img.mode,
            "size": img.size,  # (width, height)
            "width": img.width,
            "height": img.height,
        }

        # EXIF 데이터 (있는 경우)
        try:
            exif = img._getexif()
            if exif:
                metadata['has_exif'] = True
                # 주요 EXIF 태그만 추출
                # (전체 EXIF는 너무 많아서 필요한 것만)
        except Exception:
            metadata['has_exif'] = False

        return metadata


# Singleton instance
_extractor_instance: Optional[ImageExtractor] = None


def get_image_extractor(tesseract_cmd: Optional[str] = None) -> ImageExtractor:
    """
    ImageExtractor 싱글톤 인스턴스 반환

    Args:
        tesseract_cmd: Tesseract 실행 파일 경로 (optional)

    Returns:
        ImageExtractor 인스턴스
    """
    global _extractor_instance
    if _extractor_instance is None:
        _extractor_instance = ImageExtractor(tesseract_cmd=tesseract_cmd)
    return _extractor_instance
