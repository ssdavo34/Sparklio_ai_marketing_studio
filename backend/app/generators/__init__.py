"""
Generators 패키지

Generator는 Chat 입력을 받아 Draft(textBlocks + editorDocument)를 생성하는 통합 오케스트레이터입니다.
"""

from app.generators.base import BaseGenerator, GenerationRequest, GenerationResult

__all__ = [
    "BaseGenerator",
    "GenerationRequest",
    "GenerationResult",
]
