
import re
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def _normalize_line_breaks(text: str) -> str:
    """
    Test version of _normalize_line_breaks
    """
    # 줄바꿈 삽입 패턴들 (순서 중요 - 먼저 블록 단위, 그 다음 개별 패턴)
    result = text

    try:
        # 1. 해시태그 섹션 앞에 줄바꿈 (예: #청소 로봇 > 인기 추천)
        result = re.sub(r'\s+(#[가-힣A-Za-z]+\s*[>»›])', r'\n\n\1', result)

        # 2. "더보기" 뒤에 줄바꿈
        result = re.sub(r'(더\s*보기)\s+', r'\1\n\n', result)

        # 3. 카테고리 나열 패턴 앞뒤에 줄바꿈
        # "카테고리별 스토어 바로가기" 앞에 줄바꿈
        result = re.sub(r'\s+(카테고리별\s*스토어?\s*바로\s*가기)', r'\n\n\1', result, flags=re.IGNORECASE)

        # 4. 가격 패턴 앞에 줄바꿈 (상품명과 가격 분리)
        # "[업계 최저가]" 앞에 줄바꿈
        result = re.sub(r'\s+(\[업계\s*최저가\])', r'\n\1', result)
        # "원 " 다음에 새로운 항목 시작 가능성
        result = re.sub(r'(\d{1,3}(,\d{3})+\s*원)\s+(?=[가-힣A-Za-z\[])', r'\1\n', result)

        # 5. 견적문의/장바구니 등 쇼핑 버튼 뒤에 줄바꿈
        result = re.sub(r'(견적문의|장바구니|구매하기)\s*(\d*\s*점)?\s+', r'\1\n', result)

        # 6. 폼 레이블 앞에 줄바꿈 (뉴스레터, 소속, 이름, 연락처 등)
        form_labels = r'뉴스레터\s*구독|개인\s*정보\s*수집|소속|이름|연락처|이메일|문의\s*내용'
        print(f"Testing regex 6 with: {form_labels}")
        result = re.sub(rf'\s+({form_labels})', r'\n\1', result, flags=re.IGNORECASE)

        # 7. 섹션 헤더 앞에 줄바꿈 (대문자로 시작하는 영어 섹션)
        result = re.sub(r'\s+(WHY|ABOUT|SERVICE|PRODUCT|CONTACT|FAQ)', r'\n\n\1', result)

        # 8. 한국어 문장 끝 + 새로운 문장 시작 패턴
        # "다." 또는 "요." 다음에 한글이 오면 줄바꿈
        result = re.sub(r'([다요니까죠]\.)\s+(?=[가-힣])', r'\1\n', result)

        # 9. 연속된 짧은 항목들 분리 (로봇 종류 나열 등)
        # "휴머노이드 산업용로봇 협동로봇 청소로봇" 같은 패턴
        robot_types = r'휴머노이드|산업용\s*로봇|협동\s*로봇|청소\s*로봇|물류\s*로봇|서비스\s*로봇|교육용\s*로봇|ROS\s*지원'
        print(f"Testing regex 9 with: {robot_types}")
        result = re.sub(rf'({robot_types})\s+(?={robot_types})', r'\1\n', result, flags=re.IGNORECASE)

        # 10. 저작권/사업자 정보 앞에 줄바꿈
        result = re.sub(r'\s+([©ⓒ]|사업자\s*등록\s*번호|통신\s*판매)', r'\n\n\1', result)

        # 11. 긴 연속 공백을 줄바꿈으로 변환 (3개 이상 연속 공백)
        result = re.sub(r'\s{3,}', '\n', result)

        # 12. 연속된 줄바꿈 정리 (3개 이상 -> 2개)
        result = re.sub(r'\n{3,}', '\n\n', result)

        return result
    except Exception as e:
        print(f"Regex error: {e}")
        raise

# Test with sample text
sample_text = "카테고리별 스토어 바로가기 휴머노이드 산업용로봇 협동로봇 ROS 지원로봇 주변기기/그리퍼 청소로봇 물류로봇 무인지게차 배송로봇 안내로봇 중고로봇 서비스 로봇 적용사례 청소로봇·안내로봇 도입으로 달라진 밀양초등학교 🏫 # 마로솔 # 빅웨이브로보틱스 # Phantas # 판타스 # 청소로봇 # 솔링크 # 가우시움 # 습건식 청소 # 안내로봇 청소 인력 없이 1,000평 청소 완료? 과천과학관 산업용 청소로봇 SC75 도입 후기 😎 # 바닥청소 # SC75 # 청소로봇 # 과천과학관 # 산업용청소로봇 # 마로솔 # 빅웨이브로보틱스 # SOLlink # 스마트미화 # 로봇자동화 # 청소자동화 의약품 물류창고도 깨끗하게! 산업용 청소로봇 판타스(Phantas) 도입 사례 💊🧹 # 마로솔 # 빅웨이브로보틱스 # Phantas # 판타스 # 청소로봇 # 솔링크 # 가우시움 # 습건식 청소 제조공장 바닥 청소, 산업용 청소로봇으로 자동화 성공 😎 # 산업용청소로봇 # 공장청소 # 제조시설 # 청소"

try:
    normalized = _normalize_line_breaks(sample_text)
    print("Normalization successful")
    print(normalized[:200])
except Exception as e:
    print(f"FAILED: {e}")
