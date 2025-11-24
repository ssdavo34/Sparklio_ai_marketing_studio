"""
PDF Text Extractor

PDF 파일에서 텍스트를 추출하는 서비스

작성일: 2025-11-24
작성자: B팀 (Backend)
참조: SPARKLIO_MVP_MASTER_TRACKER.md - P0-1 Brand OS Module
"""

import logging
from typing import Dict, Any, Optional
from pathlib import Path

try:
    import PyPDF2
    PYPDF2_AVAILABLE = True
except ImportError:
    PYPDF2_AVAILABLE = False

logger = logging.getLogger(__name__)


class PDFExtractorError(Exception):
    """PDF 텍스트 추출 에러"""
    pass


class PDFExtractor:
    """
    PDF 텍스트 추출 서비스

    PyPDF2를 사용하여 PDF 파일에서 텍스트를 추출합니다.

    Features:
    - 모든 페이지 텍스트 추출
    - 페이지별 텍스트 분리
    - 메타데이터 추출 (제목, 저자, 페이지 수)
    - 암호화된 PDF 지원 (빈 비밀번호)
    """

    def __init__(self):
        if not PYPDF2_AVAILABLE:
            raise ImportError(
                "PyPDF2 is required for PDF extraction. "
                "Install it with: pip install PyPDF2"
            )

    def extract(self, file_path: str) -> Dict[str, Any]:
        """
        PDF 파일에서 텍스트 추출

        Args:
            file_path: PDF 파일 경로

        Returns:
            Dict with:
                - extracted_text: 추출된 전체 텍스트
                - page_count: 페이지 수
                - metadata: PDF 메타데이터

        Raises:
            PDFExtractorError: 텍스트 추출 실패 시
        """
        try:
            path = Path(file_path)
            if not path.exists():
                raise PDFExtractorError(f"File not found: {file_path}")

            if not path.suffix.lower() == '.pdf':
                raise PDFExtractorError(f"Not a PDF file: {file_path}")

            # PDF 파일 열기
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)

                # 암호화 확인
                if pdf_reader.is_encrypted:
                    # 빈 비밀번호로 시도
                    try:
                        pdf_reader.decrypt('')
                    except Exception:
                        raise PDFExtractorError("PDF is encrypted and cannot be decrypted")

                # 페이지 수
                page_count = len(pdf_reader.pages)

                # 모든 페이지에서 텍스트 추출
                texts = []
                for page_num in range(page_count):
                    try:
                        page = pdf_reader.pages[page_num]
                        text = page.extract_text()
                        if text:
                            texts.append(text.strip())
                    except Exception as e:
                        logger.warning(f"Failed to extract text from page {page_num + 1}: {str(e)}")
                        continue

                # 전체 텍스트 합치기
                extracted_text = '\n\n'.join(texts)

                # 메타데이터 추출
                metadata = self._extract_metadata(pdf_reader)
                metadata['page_count'] = page_count

                logger.info(
                    f"Successfully extracted text from PDF: {file_path}, "
                    f"pages: {page_count}, chars: {len(extracted_text)}"
                )

                return {
                    "extracted_text": extracted_text,
                    "page_count": page_count,
                    "metadata": metadata
                }

        except PDFExtractorError:
            raise
        except Exception as e:
            logger.error(f"Error extracting text from PDF {file_path}: {str(e)}")
            raise PDFExtractorError(f"PDF extraction failed: {str(e)}")

    def _extract_metadata(self, pdf_reader: 'PyPDF2.PdfReader') -> Dict[str, Any]:
        """PDF 메타데이터 추출"""
        metadata = {}

        try:
            if pdf_reader.metadata:
                # 제목
                if pdf_reader.metadata.title:
                    metadata['title'] = pdf_reader.metadata.title

                # 저자
                if pdf_reader.metadata.author:
                    metadata['author'] = pdf_reader.metadata.author

                # 주제
                if pdf_reader.metadata.subject:
                    metadata['subject'] = pdf_reader.metadata.subject

                # 생성자
                if pdf_reader.metadata.creator:
                    metadata['creator'] = pdf_reader.metadata.creator

                # 생성일
                if pdf_reader.metadata.creation_date:
                    metadata['creation_date'] = str(pdf_reader.metadata.creation_date)

                # 수정일
                if pdf_reader.metadata.modification_date:
                    metadata['modification_date'] = str(pdf_reader.metadata.modification_date)

        except Exception as e:
            logger.warning(f"Failed to extract PDF metadata: {str(e)}")

        return metadata


# Singleton instance
_extractor_instance: Optional[PDFExtractor] = None


def get_pdf_extractor() -> PDFExtractor:
    """
    PDFExtractor 싱글톤 인스턴스 반환

    Returns:
        PDFExtractor 인스턴스
    """
    global _extractor_instance
    if _extractor_instance is None:
        _extractor_instance = PDFExtractor()
    return _extractor_instance
