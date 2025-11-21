"""
Sparklio Editor API 테스트 스크립트

C팀 지원용 Editor API 테스트

작성일: 2025-11-20
작성자: B팀 (Backend)
"""

import asyncio
import httpx
import json
from typing import Dict, Any
import sys

# API 서버 URL
BASE_URL = "http://localhost:8001/api/v1/sparklio"


async def test_template_list():
    """템플릿 목록 조회 테스트"""
    print("\n🔍 템플릿 목록 조회")
    print("-" * 40)

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{BASE_URL}/templates")

            if response.status_code == 200:
                data = response.json()
                print(f"✅ 템플릿 조회 성공")
                print(f"   총 템플릿 수: {data.get('total', 0)}")

                templates = data.get('templates', [])
                for template in templates[:3]:  # 처음 3개만 표시
                    print(f"   - {template.get('name')}: {template.get('kind')}")

                return True
            else:
                print(f"❌ 템플릿 조회 실패: {response.status_code}")
                print(f"   응답: {response.text[:200]}")
                return False

        except Exception as e:
            print(f"❌ API 호출 오류: {str(e)}")
            return False


async def test_document_conversion():
    """문서 변환 API 테스트"""
    print("\n🔍 문서 변환 테스트")
    print("-" * 40)

    # Polotno 형식 샘플 문서
    polotno_doc = {
        "name": "테스트 문서",
        "pages": [{
            "id": "page1",
            "name": "첫 페이지",
            "width": 1920,
            "height": 1080,
            "background": "#FFFFFF",
            "children": [
                {
                    "id": "text1",
                    "type": "text",
                    "x": 100,
                    "y": 100,
                    "width": 400,
                    "height": 100,
                    "text": "Sparklio Editor 테스트",
                    "fontSize": 32,
                    "fontFamily": "Pretendard",
                    "fill": "#333333"
                }
            ]
        }]
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            # Polotno -> Sparklio 변환
            response = await client.post(
                f"{BASE_URL}/convert",
                json={
                    "sourceFormat": "polotno",
                    "targetFormat": "sparklio",
                    "data": polotno_doc
                }
            )

            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    print("✅ 문서 변환 성공 (Polotno -> Sparklio)")
                    sparklio_doc = data.get('data', {})
                    print(f"   제목: {sparklio_doc.get('title')}")
                    print(f"   페이지 수: {len(sparklio_doc.get('pages', []))}")

                    # 역변환 테스트
                    reverse_response = await client.post(
                        f"{BASE_URL}/convert",
                        json={
                            "sourceFormat": "sparklio",
                            "targetFormat": "polotno",
                            "data": sparklio_doc
                        }
                    )

                    if reverse_response.status_code == 200:
                        reverse_data = reverse_response.json()
                        if reverse_data.get('success'):
                            print("✅ 역변환 성공 (Sparklio -> Polotno)")
                            return True

                else:
                    print(f"❌ 변환 실패: {data.get('error')}")
            else:
                print(f"❌ API 호출 실패: {response.status_code}")
                print(f"   응답: {response.text[:200]}")

            return False

        except Exception as e:
            print(f"❌ API 호출 오류: {str(e)}")
            return False


async def test_document_crud_with_auth():
    """문서 CRUD 테스트 (인증 필요)"""
    print("\n🔍 문서 CRUD 테스트")
    print("-" * 40)
    print("⚠️  이 테스트는 JWT 토큰이 필요합니다")

    # 테스트용 JWT 토큰 (실제로는 로그인 API에서 받아야 함)
    # TODO: 실제 토큰으로 교체 필요
    test_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

    headers = {
        "Authorization": f"Bearer {test_token}"
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            # 1. 문서 생성 테스트
            create_response = await client.post(
                f"{BASE_URL}/documents",
                headers=headers,
                json={
                    "title": "C팀 테스트 문서",
                    "kind": "concept_board",
                    "pages": []
                }
            )

            if create_response.status_code == 401:
                print("⚠️  인증 필요 - JWT 토큰을 설정하세요")
                return False
            elif create_response.status_code == 200:
                document = create_response.json()
                doc_id = document.get('id')
                print(f"✅ 문서 생성 성공: {doc_id}")

                # 2. 문서 조회 테스트
                get_response = await client.get(
                    f"{BASE_URL}/documents/{doc_id}",
                    headers=headers
                )

                if get_response.status_code == 200:
                    print(f"✅ 문서 조회 성공")

                    # 3. 문서 업데이트 테스트
                    update_response = await client.put(
                        f"{BASE_URL}/documents/{doc_id}",
                        headers=headers,
                        json={
                            "title": "업데이트된 문서",
                            "pages": [{
                                "id": "page1",
                                "name": "새 페이지",
                                "elements": [],
                                "width": 1920,
                                "height": 1080,
                                "backgroundColor": "#F0F0F0"
                            }]
                        }
                    )

                    if update_response.status_code == 200:
                        print(f"✅ 문서 업데이트 성공")

                        # 4. 문서 삭제 테스트
                        delete_response = await client.delete(
                            f"{BASE_URL}/documents/{doc_id}",
                            headers=headers
                        )

                        if delete_response.status_code == 200:
                            print(f"✅ 문서 삭제 성공")
                            return True
                        else:
                            print(f"❌ 문서 삭제 실패: {delete_response.status_code}")
                    else:
                        print(f"❌ 문서 업데이트 실패: {update_response.status_code}")
                else:
                    print(f"❌ 문서 조회 실패: {get_response.status_code}")
            else:
                print(f"❌ 문서 생성 실패: {create_response.status_code}")
                print(f"   응답: {create_response.text[:200]}")

            return False

        except Exception as e:
            print(f"❌ API 호출 오류: {str(e)}")
            return False


async def test_ai_command():
    """AI 명령 테스트 (Mock)"""
    print("\n🔍 AI 명령 테스트")
    print("-" * 40)

    # 테스트용 JWT 토큰 (실제로는 로그인 API에서 받아야 함)
    test_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    headers = {
        "Authorization": f"Bearer {test_token}"
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            # AI로 제안 생성
            response = await client.post(
                f"{BASE_URL}/ai/command",
                headers=headers,
                json={
                    "type": "suggest",
                    "prompt": "모던한 배너 디자인 아이디어 5개",
                    "context": None
                }
            )

            if response.status_code == 401:
                print("⚠️  인증 필요 - JWT 토큰을 설정하세요")
                return False
            elif response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    print("✅ AI 제안 생성 성공")
                    suggestions = data.get('suggestions', [])
                    for i, suggestion in enumerate(suggestions[:3], 1):
                        print(f"   {i}. {suggestion}")
                    return True
                else:
                    print(f"❌ AI 제안 생성 실패: {data.get('message')}")
            else:
                print(f"❌ API 호출 실패: {response.status_code}")
                print(f"   응답: {response.text[:200]}")

            return False

        except Exception as e:
            print(f"❌ API 호출 오류: {str(e)}")
            return False


async def main():
    """메인 테스트 실행"""
    print("=" * 50)
    print("🚀 Sparklio Editor API 테스트")
    print("=" * 50)
    print("\n📌 C팀 지원용 Editor API 구현 완료")
    print("   - 문서 CRUD (생성/조회/수정/삭제)")
    print("   - AI 명령 처리 (생성/수정/제안)")
    print("   - 문서 변환 (Polotno/LayerHub/Konva)")
    print("   - 템플릿 시스템")
    print("   - 문서 내보내기 (PDF/PNG/SVG)")

    results = []

    # 1. 템플릿 테스트 (인증 불필요)
    print("\n📋 테스트 1: 템플릿 시스템")
    results.append(await test_template_list())

    # 2. 문서 변환 테스트 (인증 불필요)
    print("\n📋 테스트 2: 문서 변환")
    results.append(await test_document_conversion())

    # 3. 문서 CRUD 테스트 (인증 필요)
    print("\n📋 테스트 3: 문서 CRUD (인증 필요)")
    results.append(await test_document_crud_with_auth())

    # 4. AI 명령 테스트 (인증 필요)
    print("\n📋 테스트 4: AI 명령 (인증 필요)")
    results.append(await test_ai_command())

    # 결과 요약
    print("\n" + "=" * 50)
    print("📊 테스트 결과 요약")
    print("=" * 50)

    success_count = sum(1 for r in results if r)
    total_count = len(results)

    print(f"\n성공: {success_count}/{total_count}")

    if success_count == total_count:
        print("✅ 모든 테스트 통과!")
    elif success_count >= total_count // 2:
        print("⚠️  일부 테스트 실패 (인증 필요할 수 있음)")
    else:
        print("❌ 대부분의 테스트 실패")

    print("\n📝 다음 단계:")
    print("1. JWT 토큰 획득을 위한 로그인 구현")
    print("2. 실제 LLM 연동 (현재 Mock)")
    print("3. 파일 업로드/다운로드 구현")
    print("4. WebSocket 실시간 동기화")

    return success_count == total_count


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)