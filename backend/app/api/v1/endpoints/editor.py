"""
Editor Action API 엔드포인트

Editor Document Action 처리 기능
SYSTEM_ARCHITECTURE.md 섹션 5.3.2 기반 구현
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from uuid import UUID
from datetime import datetime

from app.core.database import get_db
from app.models.user import User
from app.models.document import Document
from app.auth.jwt import get_current_user
from pydantic import BaseModel, Field

router = APIRouter()


# ========================================
# Request/Response Schemas
# ========================================

class ActionTarget(BaseModel):
    """
    Action 대상 지정

    role 또는 id로 대상 Object 선택
    """
    role: str | None = Field(None, description="Object role (TITLE, HEADLINE, BODY 등)")
    id: str | None = Field(None, description="Object ID")
    pageId: str | None = Field(None, description="Page ID (다중 페이지 시)")


class EditorAction(BaseModel):
    """
    Editor Action 정의

    ONE_PAGE_EDITOR_SPEC.md 섹션 8.1 기반
    """
    type: str = Field(..., description="Action 유형 (update_object, replace_text, add_object, delete_object)")
    target: ActionTarget = Field(..., description="Action 대상")
    payload: Dict[str, Any] = Field(..., description="Action 페이로드")


class EditorActionRequest(BaseModel):
    """
    Editor Action 요청

    POST /api/v1/editor/action
    """
    documentId: UUID = Field(..., description="Document ID")
    actions: List[EditorAction] = Field(..., description="적용할 Action 목록")


class EditorActionResponse(BaseModel):
    """
    Editor Action 응답
    """
    documentId: UUID
    appliedActions: int
    updatedDocument: Dict[str, Any]
    version: int


# ========================================
# Action Handlers
# ========================================

def apply_update_object(document_json: Dict[str, Any], action: EditorAction) -> Dict[str, Any]:
    """
    update_object Action 적용

    Object의 props를 부분 업데이트합니다.

    Args:
        document_json: Editor Document JSON
        action: Action 정의

    Returns:
        수정된 Document JSON
    """
    target = action.target
    payload = action.payload

    # Page 찾기
    pages = document_json.get("pages", [])
    target_page_id = target.pageId or (pages[0]["id"] if pages else None)

    for page in pages:
        if page["id"] != target_page_id:
            continue

        # Object 찾기
        for obj in page.get("objects", []):
            # role 또는 id로 매칭
            if (target.role and obj.get("role") == target.role) or (target.id and obj.get("id") == target.id):
                # props 병합 업데이트
                if "props" in payload:
                    obj["props"] = {**obj.get("props", {}), **payload["props"]}

                # bounds 업데이트
                if "bounds" in payload:
                    obj["bounds"] = {**obj.get("bounds", {}), **payload["bounds"]}

                break

    return document_json


def apply_replace_text(document_json: Dict[str, Any], action: EditorAction) -> Dict[str, Any]:
    """
    replace_text Action 적용

    Text Object의 text 속성을 교체합니다.

    Args:
        document_json: Editor Document JSON
        action: Action 정의

    Returns:
        수정된 Document JSON
    """
    target = action.target
    payload = action.payload
    new_text = payload.get("text", "")

    pages = document_json.get("pages", [])
    target_page_id = target.pageId or (pages[0]["id"] if pages else None)

    for page in pages:
        if page["id"] != target_page_id:
            continue

        for obj in page.get("objects", []):
            if (target.role and obj.get("role") == target.role) or (target.id and obj.get("id") == target.id):
                if obj.get("type") == "text":
                    obj["props"]["text"] = new_text
                break

    return document_json


def apply_add_object(document_json: Dict[str, Any], action: EditorAction) -> Dict[str, Any]:
    """
    add_object Action 적용

    새로운 Object를 Page에 추가합니다.

    Args:
        document_json: Editor Document JSON
        action: Action 정의

    Returns:
        수정된 Document JSON
    """
    target = action.target
    payload = action.payload
    new_object = payload.get("object", {})

    pages = document_json.get("pages", [])
    target_page_id = target.pageId or (pages[0]["id"] if pages else None)

    for page in pages:
        if page["id"] == target_page_id:
            page.setdefault("objects", []).append(new_object)
            break

    return document_json


def apply_delete_object(document_json: Dict[str, Any], action: EditorAction) -> Dict[str, Any]:
    """
    delete_object Action 적용

    Object를 Page에서 삭제합니다.

    Args:
        document_json: Editor Document JSON
        action: Action 정의

    Returns:
        수정된 Document JSON
    """
    target = action.target

    pages = document_json.get("pages", [])
    target_page_id = target.pageId or (pages[0]["id"] if pages else None)

    for page in pages:
        if page["id"] != target_page_id:
            continue

        # Object 삭제
        page["objects"] = [
            obj for obj in page.get("objects", [])
            if not ((target.role and obj.get("role") == target.role) or (target.id and obj.get("id") == target.id))
        ]

    return document_json


# Action 핸들러 매핑
ACTION_HANDLERS = {
    "update_object": apply_update_object,
    "replace_text": apply_replace_text,
    "add_object": apply_add_object,
    "delete_object": apply_delete_object,
}


# ========================================
# Endpoints
# ========================================

@router.post("/action", response_model=EditorActionResponse)
async def apply_editor_actions(
    request: EditorActionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Editor Action을 적용합니다.

    Document JSON에 Action을 적용하고 저장합니다.

    Args:
        request: Editor Action 요청
        current_user: 현재 인증된 사용자
        db: 데이터베이스 세션

    Returns:
        수정된 Document 정보
    """
    # Document 조회
    doc = db.query(Document).filter(Document.id == request.documentId).first()

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    # 권한 확인
    if doc.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to modify this document"
        )

    # Document JSON 복사
    updated_document = doc.document_json.copy()

    # Action 적용
    applied_count = 0
    for action in request.actions:
        handler = ACTION_HANDLERS.get(action.type)

        if not handler:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown action type: {action.type}"
            )

        try:
            updated_document = handler(updated_document, action)
            applied_count += 1
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to apply action {action.type}: {str(e)}"
            )

    # Document 저장
    doc.document_json = updated_document
    doc.version += 1
    doc.updated_at = datetime.utcnow()

    # 메타데이터 업데이트
    if not doc.document_metadata:
        doc.document_metadata = {}

    doc.document_metadata["last_action"] = request.actions[-1].type if request.actions else None
    doc.document_metadata["total_edits"] = doc.document_metadata.get("total_edits", 0) + applied_count

    db.commit()
    db.refresh(doc)

    return EditorActionResponse(
        documentId=doc.id,
        appliedActions=applied_count,
        updatedDocument=updated_document,
        version=doc.version
    )


@router.get("/actions/supported")
async def get_supported_actions():
    """
    지원하는 Action 목록을 조회합니다.

    Returns:
        지원 Action 목록
    """
    return {
        "actions": [
            {
                "type": "update_object",
                "description": "Object의 props를 부분 업데이트",
                "example": {
                    "type": "update_object",
                    "target": {"role": "TITLE"},
                    "payload": {"props": {"fontSize": 60, "fill": "#FF0000"}}
                }
            },
            {
                "type": "replace_text",
                "description": "Text Object의 text 속성 교체",
                "example": {
                    "type": "replace_text",
                    "target": {"role": "HEADLINE"},
                    "payload": {"text": "새로운 헤드라인"}
                }
            },
            {
                "type": "add_object",
                "description": "새로운 Object 추가",
                "example": {
                    "type": "add_object",
                    "target": {"pageId": "page_1"},
                    "payload": {
                        "object": {
                            "id": "obj_new_1",
                            "type": "text",
                            "role": "CUSTOM",
                            "bounds": {"x": 100, "y": 100, "width": 400, "height": 60},
                            "props": {"text": "추가된 텍스트", "fontSize": 24}
                        }
                    }
                }
            },
            {
                "type": "delete_object",
                "description": "Object 삭제",
                "example": {
                    "type": "delete_object",
                    "target": {"role": "BADGE"},
                    "payload": {}
                }
            }
        ]
    }
