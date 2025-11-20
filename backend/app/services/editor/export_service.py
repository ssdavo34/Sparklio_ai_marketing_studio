"""
Document Export Service

문서를 PDF, PNG, JPG, SVG, JSON으로 내보내기

작성일: 2025-11-20
작성자: B팀 (Backend)
"""

from sqlalchemy.orm import Session
from fastapi import BackgroundTasks
from typing import Optional, List, Dict, Any
from uuid import UUID
import json
import base64
import logging
from datetime import datetime
import asyncio
import hashlib

from app.models.sparklio_document import SparklioDocument
from app.services.storage_service import StorageService

logger = logging.getLogger(__name__)


class ExportService:
    """문서 내보내기 서비스"""

    def __init__(self, db: Session):
        self.db = db
        self.storage_service = StorageService()
        self.export_tasks = {}  # 진행 중인 작업 추적

    async def start_export(
        self,
        document_id: UUID,
        format: str,
        pages: Optional[List[str]] = None,
        quality: Optional[int] = 90,
        scale: Optional[float] = 1.0,
        user_id: UUID = None,
        background_tasks: BackgroundTasks = None
    ) -> str:
        """내보내기 작업 시작"""
        try:
            # 작업 ID 생성
            task_id = self._generate_task_id(document_id, format)

            # 작업 상태 초기화
            self.export_tasks[task_id] = {
                "status": "processing",
                "progress": 0,
                "created_at": datetime.utcnow().isoformat()
            }

            # 백그라운드 작업 시작
            if background_tasks:
                background_tasks.add_task(
                    self._process_export,
                    task_id,
                    document_id,
                    format,
                    pages,
                    quality,
                    scale,
                    user_id
                )
            else:
                # 동기 처리 (테스트용)
                await self._process_export(
                    task_id,
                    document_id,
                    format,
                    pages,
                    quality,
                    scale,
                    user_id
                )

            logger.info(f"내보내기 작업 시작: {task_id}")
            return task_id

        except Exception as e:
            logger.error(f"내보내기 작업 시작 실패: {str(e)}")
            raise e

    async def _process_export(
        self,
        task_id: str,
        document_id: UUID,
        format: str,
        pages: Optional[List[str]],
        quality: int,
        scale: float,
        user_id: UUID
    ):
        """내보내기 처리 (백그라운드)"""
        try:
            # 문서 조회
            document = self.db.query(SparklioDocument).filter(
                SparklioDocument.id == document_id
            ).first()

            if not document:
                self.export_tasks[task_id] = {
                    "status": "failed",
                    "error": "문서를 찾을 수 없습니다"
                }
                return

            # 권한 확인
            if document.created_by_id != user_id:
                self.export_tasks[task_id] = {
                    "status": "failed",
                    "error": "권한이 없습니다"
                }
                return

            # 형식별 처리
            if format == "json":
                result = await self._export_to_json(document, pages)
            elif format == "pdf":
                result = await self._export_to_pdf(document, pages, scale)
            elif format in ["png", "jpg"]:
                result = await self._export_to_image(document, pages, format, quality, scale)
            elif format == "svg":
                result = await self._export_to_svg(document, pages, scale)
            else:
                raise ValueError(f"지원하지 않는 형식: {format}")

            # 결과 저장
            self.export_tasks[task_id] = {
                "status": "completed",
                "progress": 100,
                "result": result,
                "completed_at": datetime.utcnow().isoformat()
            }

            logger.info(f"내보내기 완료: {task_id}")

        except Exception as e:
            logger.error(f"내보내기 처리 실패: {str(e)}")
            self.export_tasks[task_id] = {
                "status": "failed",
                "error": str(e)
            }

    async def _export_to_json(
        self,
        document: SparklioDocument,
        pages: Optional[List[str]]
    ) -> Dict[str, Any]:
        """JSON 형식으로 내보내기"""
        doc_data = {
            "title": document.title,
            "kind": document.kind,
            "pages": document.pages,
            "metadata": document.metadata,
            "exportedAt": datetime.utcnow().isoformat()
        }

        # 특정 페이지만 선택
        if pages:
            filtered_pages = [
                page for page in doc_data["pages"]
                if page.get("id") in pages
            ]
            doc_data["pages"] = filtered_pages

        # JSON 문자열로 변환
        json_str = json.dumps(doc_data, ensure_ascii=False, indent=2)

        # Base64 인코딩 (다운로드용)
        encoded = base64.b64encode(json_str.encode()).decode()

        return {
            "format": "json",
            "data": encoded,
            "filename": f"{document.title}.json"
        }

    async def _export_to_pdf(
        self,
        document: SparklioDocument,
        pages: Optional[List[str]],
        scale: float
    ) -> Dict[str, Any]:
        """PDF 형식으로 내보내기"""
        # TODO: 실제 PDF 렌더링 구현
        # 현재는 Mock 데이터 반환

        # 임시 PDF 생성 (실제로는 puppeteer 또는 wkhtmltopdf 사용)
        pdf_content = await self._render_to_pdf(document, pages, scale)

        # S3에 업로드
        file_key = f"exports/{document.id}/export_{datetime.utcnow().timestamp()}.pdf"
        url = await self.storage_service.upload_file(
            file_content=pdf_content,
            file_key=file_key,
            content_type="application/pdf"
        )

        return {
            "format": "pdf",
            "url": url,
            "filename": f"{document.title}.pdf"
        }

    async def _export_to_image(
        self,
        document: SparklioDocument,
        pages: Optional[List[str]],
        format: str,
        quality: int,
        scale: float
    ) -> Dict[str, Any]:
        """이미지 형식으로 내보내기"""
        # TODO: 실제 이미지 렌더링 구현
        # 현재는 Mock 데이터 반환

        results = []
        page_list = document.pages
        if pages:
            page_list = [p for p in page_list if p.get("id") in pages]

        for i, page in enumerate(page_list):
            # 임시 이미지 생성 (실제로는 canvas 또는 playwright 사용)
            image_content = await self._render_to_image(page, format, quality, scale)

            # S3에 업로드
            file_key = f"exports/{document.id}/page_{i+1}.{format}"
            url = await self.storage_service.upload_file(
                file_content=image_content,
                file_key=file_key,
                content_type=f"image/{format}"
            )

            results.append({
                "pageId": page.get("id"),
                "url": url,
                "filename": f"{document.title}_page_{i+1}.{format}"
            })

        return {
            "format": format,
            "pages": results
        }

    async def _export_to_svg(
        self,
        document: SparklioDocument,
        pages: Optional[List[str]],
        scale: float
    ) -> Dict[str, Any]:
        """SVG 형식으로 내보내기"""
        # TODO: 실제 SVG 생성 구현
        # 현재는 Mock 데이터 반환

        results = []
        page_list = document.pages
        if pages:
            page_list = [p for p in page_list if p.get("id") in pages]

        for i, page in enumerate(page_list):
            # SVG 생성
            svg_content = await self._render_to_svg(page, scale)

            # Base64 인코딩
            encoded = base64.b64encode(svg_content.encode()).decode()

            results.append({
                "pageId": page.get("id"),
                "data": encoded,
                "filename": f"{document.title}_page_{i+1}.svg"
            })

        return {
            "format": "svg",
            "pages": results
        }

    async def get_export_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """내보내기 작업 상태 조회"""
        return self.export_tasks.get(task_id)

    def _generate_task_id(self, document_id: UUID, format: str) -> str:
        """작업 ID 생성"""
        timestamp = datetime.utcnow().timestamp()
        data = f"{document_id}_{format}_{timestamp}"
        return hashlib.md5(data.encode()).hexdigest()

    # ============================================================================
    # 렌더링 헬퍼 (Mock 구현)
    # ============================================================================

    async def _render_to_pdf(
        self,
        document: SparklioDocument,
        pages: Optional[List[str]],
        scale: float
    ) -> bytes:
        """PDF로 렌더링 (Mock)"""
        # TODO: 실제 구현 필요
        # - puppeteer 또는 playwright 사용
        # - HTML/CSS로 변환 후 PDF 생성
        mock_pdf = b"%PDF-1.4\n% Mock PDF content"
        await asyncio.sleep(1)  # 처리 시간 시뮬레이션
        return mock_pdf

    async def _render_to_image(
        self,
        page: Dict[str, Any],
        format: str,
        quality: int,
        scale: float
    ) -> bytes:
        """이미지로 렌더링 (Mock)"""
        # TODO: 실제 구현 필요
        # - canvas API 또는 playwright 사용
        # - 각 요소를 이미지로 렌더링
        if format == "png":
            mock_image = b"\x89PNG\r\n\x1a\n"  # PNG 헤더
        else:
            mock_image = b"\xff\xd8\xff"  # JPEG 헤더

        await asyncio.sleep(0.5)  # 처리 시간 시뮬레이션
        return mock_image

    async def _render_to_svg(
        self,
        page: Dict[str, Any],
        scale: float
    ) -> str:
        """SVG로 렌더링"""
        # SVG 생성
        width = page.get("width", 1920) * scale
        height = page.get("height", 1080) * scale
        bg_color = page.get("backgroundColor", "#FFFFFF")

        svg_elements = []
        svg_elements.append(f'<svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">')
        svg_elements.append(f'<rect width="{width}" height="{height}" fill="{bg_color}"/>')

        # 각 요소를 SVG로 변환
        for element in page.get("elements", []):
            svg_element = self._element_to_svg(element, scale)
            if svg_element:
                svg_elements.append(svg_element)

        svg_elements.append('</svg>')

        return '\n'.join(svg_elements)

    def _element_to_svg(self, element: Dict[str, Any], scale: float) -> str:
        """요소를 SVG로 변환"""
        element_type = element.get("type")
        props = element.get("props", {})

        x = element.get("x", 0) * scale
        y = element.get("y", 0) * scale
        width = element.get("width", 100) * scale
        height = element.get("height", 100) * scale

        if element_type == "text":
            text = props.get("text", "")
            font_size = props.get("fontSize", 16) * scale
            fill = props.get("color", "#000000")
            return f'<text x="{x}" y="{y + font_size}" font-size="{font_size}" fill="{fill}">{text}</text>'

        elif element_type == "shape":
            fill = props.get("fill", "#000000")
            stroke = props.get("stroke", "none")
            stroke_width = props.get("strokeWidth", 1) * scale
            return f'<rect x="{x}" y="{y}" width="{width}" height="{height}" fill="{fill}" stroke="{stroke}" stroke-width="{stroke_width}"/>'

        elif element_type == "image":
            src = props.get("src", "")
            return f'<image x="{x}" y="{y}" width="{width}" height="{height}" href="{src}"/>'

        return ""