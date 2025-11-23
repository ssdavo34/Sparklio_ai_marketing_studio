"""
골든 세트 자동 검증 스크립트

CopywriterAgent의 출력을 골든 세트와 비교하여 품질을 검증합니다.

작성일: 2025-11-23
작성자: B팀 (Backend)

사용법:
  # CopywriterAgent 검증
  python tests/golden_set_validator.py --agent copywriter

  # 모든 Agent 검증
  python tests/golden_set_validator.py --all

  # HTML 리포트 생성
  python tests/golden_set_validator.py --agent copywriter --report html

  # 실패 케이스만 출력
  python tests/golden_set_validator.py --agent copywriter --only-failures
"""

import asyncio
import json
import sys
import argparse
from pathlib import Path
from typing import Dict, Any, List, Tuple
from datetime import datetime
from difflib import SequenceMatcher

# Semantic Similarity (A팀 Roadmap 2025-11-23)
try:
    from sentence_transformers import SentenceTransformer
    from sklearn.metrics.pairwise import cosine_similarity
    import numpy as np
    SEMANTIC_SIMILARITY_AVAILABLE = True
except ImportError:
    SEMANTIC_SIMILARITY_AVAILABLE = False

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.agents import get_copywriter_agent, AgentRequest


class GoldenSetValidator:
    """골든 세트 검증기"""

    def __init__(self, golden_set_path: str, agent_name: str):
        """
        Args:
            golden_set_path: 골든 세트 JSON 파일 경로
            agent_name: Agent 이름 (copywriter, reviewer, optimizer, designer)
        """
        self.golden_set_path = Path(golden_set_path)
        self.agent_name = agent_name
        self.golden_data = self._load_golden_set()
        self.results: List[Dict[str, Any]] = []

        # Semantic Similarity 모델 로드 (A팀 Roadmap 2025-11-23)
        if SEMANTIC_SIMILARITY_AVAILABLE:
            print("🔄 Loading semantic similarity model (paraphrase-multilingual-mpnet-base-v2)...")
            self.semantic_model = SentenceTransformer('paraphrase-multilingual-mpnet-base-v2')
            print("✅ Semantic model loaded\n")
        else:
            self.semantic_model = None
            print("⚠️ Semantic similarity not available (using SequenceMatcher)\n")

    def _load_golden_set(self) -> dict:
        """골든 세트 로드"""
        if not self.golden_set_path.exists():
            raise FileNotFoundError(f"Golden set not found: {self.golden_set_path}")

        with open(self.golden_set_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        print(f"✅ Loaded golden set: {self.golden_set_path}")
        print(f"   Agent: {data['meta']['agent']}")
        print(f"   Cases: {len(data['golden_cases'])}")
        print()

        return data

    async def validate_all(self) -> Dict[str, Any]:
        """모든 골든 케이스 검증

        Returns:
            검증 결과 딕셔너리
        """
        print(f"🔍 Validating {len(self.golden_data['golden_cases'])} golden cases...")
        print()

        for case in self.golden_data["golden_cases"]:
            result = await self._validate_case(case)
            self.results.append(result)

        # 요약 통계
        summary = self._generate_summary()

        return {
            "agent": self.agent_name,
            "timestamp": datetime.utcnow().isoformat(),
            "total_cases": len(self.results),
            "passed": summary["passed"],
            "failed": summary["failed"],
            "pass_rate": summary["pass_rate"],
            "average_score": summary["average_score"],
            "results": self.results,
            "summary": summary
        }

    async def _validate_case(self, case: Dict[str, Any]) -> Dict[str, Any]:
        """단일 케이스 검증

        Args:
            case: 골든 케이스

        Returns:
            검증 결과
        """
        case_id = case["id"]
        scenario = case["scenario"]

        print(f"📝 [{case_id}] {scenario}")

        try:
            # Agent 실행
            agent = get_copywriter_agent()
            request = AgentRequest(
                task=case["input"]["task"],
                payload=case["input"]["payload"],
                options=case["input"].get("options")
            )

            response = await agent.execute(request)

            # 출력 추출
            actual_output = None
            for output in response.outputs:
                if output.type == "json":
                    actual_output = output.value
                    break

            if not actual_output:
                return {
                    "case_id": case_id,
                    "scenario": scenario,
                    "passed": False,
                    "error": "No JSON output found",
                    "score": 0.0
                }

            # 검증
            validation_result = self._validate_output(
                actual_output,
                case["expected_output"],
                case["quality_metrics"]
            )

            # 결과
            passed = validation_result["overall_score"] >= case["quality_metrics"]["min_score"]

            result = {
                "case_id": case_id,
                "scenario": scenario,
                "passed": passed,
                "score": validation_result["overall_score"],
                "actual_output": actual_output,
                "expected_output": case["expected_output"],
                "validation_details": validation_result,
                "usage": {
                    "elapsed_seconds": response.usage.get("elapsed_seconds"),
                    "tokens": response.usage.get("total_tokens")
                }
            }

            # 출력
            if passed:
                print(f"   ✅ PASSED (Score: {result['score']:.1f}/10)")
            else:
                print(f"   ❌ FAILED (Score: {result['score']:.1f}/10)")
                print(f"      Expected score >= {case['quality_metrics']['min_score']}")

            print()

            return result

        except Exception as e:
            print(f"   ❌ ERROR: {str(e)}")
            print()

            return {
                "case_id": case_id,
                "scenario": scenario,
                "passed": False,
                "error": str(e),
                "score": 0.0
            }

    def _validate_output(
        self,
        actual: Dict[str, Any],
        expected: Dict[str, Any],
        metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """출력 검증

        Args:
            actual: 실제 출력
            expected: 기대 출력
            metrics: 품질 메트릭

        Returns:
            검증 결과 (점수, 세부사항)
        """
        scores = {}
        details = {}

        # 1. Headline 검증
        if "headline" in actual and "headline" in expected:
            scores["headline"] = self._score_text_similarity(
                actual["headline"],
                expected["headline"]
            )
            details["headline"] = {
                "actual": actual["headline"],
                "expected": expected["headline"],
                "length": len(actual["headline"]),
                "max_length": 20,
                "length_ok": len(actual["headline"]) <= 20
            }
        else:
            scores["headline"] = 0.0
            details["headline"] = {"error": "Missing headline"}

        # 2. Subheadline 검증
        if "subheadline" in actual and "subheadline" in expected:
            scores["subheadline"] = self._score_text_similarity(
                actual["subheadline"],
                expected["subheadline"]
            )
            details["subheadline"] = {
                "actual": actual["subheadline"],
                "expected": expected["subheadline"],
                "length": len(actual.get("subheadline", "")),
                "max_length": 30,
                "length_ok": len(actual.get("subheadline", "")) <= 30
            }
        else:
            scores["subheadline"] = 0.0
            details["subheadline"] = {"error": "Missing subheadline"}

        # 3. Body 검증
        if "body" in actual and "body" in expected:
            scores["body"] = self._score_text_similarity(
                actual["body"],
                expected["body"]
            )
            details["body"] = {
                "actual": actual["body"],
                "expected": expected["body"],
                "length": len(actual["body"]),
                "max_length": 80,
                "length_ok": len(actual["body"]) <= 80
            }
        else:
            scores["body"] = 0.0
            details["body"] = {"error": "Missing body"}

        # 4. Bullets 검증
        if "bullets" in actual and "bullets" in expected:
            bullets_ok = (
                isinstance(actual["bullets"], list) and
                len(actual["bullets"]) == 3 and
                all(len(b) <= 20 for b in actual["bullets"])
            )
            scores["bullets"] = 10.0 if bullets_ok else 5.0
            details["bullets"] = {
                "actual": actual["bullets"],
                "expected": expected["bullets"],
                "count": len(actual["bullets"]),
                "expected_count": 3,
                "lengths": [len(b) for b in actual["bullets"]],
                "max_item_length": 20,
                "all_ok": bullets_ok
            }
        else:
            scores["bullets"] = 0.0
            details["bullets"] = {"error": "Missing bullets"}

        # 5. CTA 검증
        if "cta" in actual and "cta" in expected:
            scores["cta"] = self._score_text_similarity(
                actual["cta"],
                expected["cta"]
            )
            details["cta"] = {
                "actual": actual["cta"],
                "expected": expected["cta"],
                "length": len(actual["cta"]),
                "max_length": 15,
                "length_ok": len(actual["cta"]) <= 15
            }
        else:
            scores["cta"] = 0.0
            details["cta"] = {"error": "Missing cta"}

        # 6. Tone 검증 (정성적)
        expected_tone = metrics.get("tone", "")
        details["tone"] = {
            "expected": expected_tone,
            "note": "Tone은 정성적 평가 필요"
        }

        # 전체 점수 (가중 평균)
        weights = {
            "headline": 0.25,
            "subheadline": 0.15,
            "body": 0.25,
            "bullets": 0.20,
            "cta": 0.15
        }

        overall_score = sum(
            scores.get(field, 0.0) * weight
            for field, weight in weights.items()
        )

        return {
            "overall_score": round(overall_score, 1),
            "field_scores": scores,
            "details": details
        }

    def _score_text_similarity(self, actual: str, expected: str) -> float:
        """텍스트 유사도 점수 계산 (0-10)

        A팀 Roadmap 2025-11-23: Semantic Similarity 도입
        - SequenceMatcher: 문자열 유사도 (표면적)
        - Sentence-Transformers: 의미 유사도 (semantic)

        Args:
            actual: 실제 텍스트
            expected: 기대 텍스트

        Returns:
            유사도 점수 (0-10)
        """
        # Semantic Similarity 사용 (모델 로드된 경우)
        if self.semantic_model is not None:
            try:
                # 임베딩 생성
                embeddings = self.semantic_model.encode([actual, expected])

                # Cosine Similarity 계산 (0-1)
                similarity = cosine_similarity(
                    embeddings[0].reshape(1, -1),
                    embeddings[1].reshape(1, -1)
                )[0][0]

                # 0-10 스케일로 변환
                score = float(similarity) * 10.0

                # 정확히 일치하면 10점
                if actual == expected:
                    score = 10.0

                return round(score, 1)

            except Exception as e:
                print(f"⚠️ Semantic similarity error: {e}, falling back to SequenceMatcher")
                # 에러 발생 시 fallback to SequenceMatcher

        # Fallback: SequenceMatcher (기존 방식)
        ratio = SequenceMatcher(None, actual, expected).ratio()

        # 0-10 스케일로 변환
        score = ratio * 10.0

        # 정확히 일치하면 10점
        if actual == expected:
            score = 10.0
        # 길이가 매우 다르면 감점
        elif abs(len(actual) - len(expected)) > 20:
            score *= 0.8

        return round(score, 1)

    def _generate_summary(self) -> Dict[str, Any]:
        """검증 결과 요약

        Returns:
            요약 통계
        """
        passed = sum(1 for r in self.results if r.get("passed", False))
        failed = len(self.results) - passed
        pass_rate = (passed / len(self.results) * 100) if self.results else 0

        scores = [r.get("score", 0.0) for r in self.results]
        average_score = sum(scores) / len(scores) if scores else 0

        return {
            "passed": passed,
            "failed": failed,
            "pass_rate": round(pass_rate, 1),
            "average_score": round(average_score, 1),
            "min_score": min(scores) if scores else 0,
            "max_score": max(scores) if scores else 0
        }

    def print_summary(self):
        """요약 출력"""
        summary = self._generate_summary()

        print()
        print("=" * 60)
        print("📊 VALIDATION SUMMARY")
        print("=" * 60)
        print(f"Agent: {self.agent_name}")
        print(f"Total Cases: {len(self.results)}")
        print(f"Passed: {summary['passed']}")
        print(f"Failed: {summary['failed']}")
        print(f"Pass Rate: {summary['pass_rate']}%")
        print(f"Average Score: {summary['average_score']}/10")
        print(f"Score Range: {summary['min_score']}-{summary['max_score']}")
        print("=" * 60)

        # 실패 케이스 상세
        if summary["failed"] > 0:
            print()
            print("❌ FAILED CASES:")
            for result in self.results:
                if not result.get("passed", False):
                    print(f"  - [{result['case_id']}] {result['scenario']}")
                    print(f"    Score: {result.get('score', 0)}/10")
                    if "error" in result:
                        print(f"    Error: {result['error']}")
            print()

    def save_report(self, output_path: str, format: str = "json"):
        """검증 리포트 저장

        Args:
            output_path: 출력 파일 경로
            format: json | html
        """
        summary_data = {
            "agent": self.agent_name,
            "timestamp": datetime.utcnow().isoformat(),
            "total_cases": len(self.results),
            "summary": self._generate_summary(),
            "results": self.results
        }

        output_path = Path(output_path)

        if format == "json":
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(summary_data, f, indent=2, ensure_ascii=False)
            print(f"✅ JSON report saved: {output_path}")

        elif format == "html":
            html = self._generate_html_report(summary_data)
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(html)
            print(f"✅ HTML report saved: {output_path}")

    def _generate_html_report(self, data: Dict[str, Any]) -> str:
        """HTML 리포트 생성"""
        summary = data["summary"]

        html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Golden Set Validation Report - {data['agent']}</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        h1 {{ color: #333; }}
        .summary {{ background: #f5f5f5; padding: 15px; border-radius: 5px; }}
        .passed {{ color: green; font-weight: bold; }}
        .failed {{ color: red; font-weight: bold; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
        th, td {{ border: 1px solid #ddd; padding: 12px; text-align: left; }}
        th {{ background-color: #4CAF50; color: white; }}
        tr:nth-child(even) {{ background-color: #f2f2f2; }}
        .score {{ font-weight: bold; }}
    </style>
</head>
<body>
    <h1>Golden Set Validation Report</h1>

    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Agent:</strong> {data['agent']}</p>
        <p><strong>Timestamp:</strong> {data['timestamp']}</p>
        <p><strong>Total Cases:</strong> {data['total_cases']}</p>
        <p class="passed">Passed: {summary['passed']}</p>
        <p class="failed">Failed: {summary['failed']}</p>
        <p><strong>Pass Rate:</strong> {summary['pass_rate']}%</p>
        <p><strong>Average Score:</strong> {summary['average_score']}/10</p>
    </div>

    <h2>Detailed Results</h2>
    <table>
        <tr>
            <th>Case ID</th>
            <th>Scenario</th>
            <th>Status</th>
            <th>Score</th>
        </tr>
"""

        for result in data["results"]:
            status = "✅ PASSED" if result.get("passed") else "❌ FAILED"
            status_class = "passed" if result.get("passed") else "failed"
            score = result.get("score", 0)

            html += f"""
        <tr>
            <td>{result['case_id']}</td>
            <td>{result['scenario']}</td>
            <td class="{status_class}">{status}</td>
            <td class="score">{score}/10</td>
        </tr>
"""

        html += """
    </table>
</body>
</html>
"""
        return html


async def main():
    """메인 함수"""
    parser = argparse.ArgumentParser(description="Golden Set Validator")
    parser.add_argument(
        "--agent",
        type=str,
        default="copywriter",
        help="Agent name (copywriter, reviewer, optimizer, designer)"
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Validate all agents"
    )
    parser.add_argument(
        "--report",
        type=str,
        choices=["json", "html"],
        help="Generate report (json or html)"
    )
    parser.add_argument(
        "--output",
        type=str,
        help="Report output path"
    )
    parser.add_argument(
        "--only-failures",
        action="store_true",
        help="Show only failed cases"
    )

    args = parser.parse_args()

    # 골든 세트 경로
    base_path = Path(__file__).parent / "golden_sets"

    # Agent 리스트
    agents = ["copywriter"] if not args.all else ["copywriter"]

    for agent_name in agents:
        golden_set_path = base_path / f"{agent_name}_golden_set.json"

        if not golden_set_path.exists():
            print(f"⚠️  Golden set not found for {agent_name}: {golden_set_path}")
            continue

        # 검증 실행
        validator = GoldenSetValidator(str(golden_set_path), agent_name)
        await validator.validate_all()

        # 요약 출력
        if not args.only_failures:
            validator.print_summary()
        else:
            # 실패 케이스만 출력
            failed = [r for r in validator.results if not r.get("passed", False)]
            if failed:
                print(f"\n❌ Failed cases for {agent_name}:")
                for result in failed:
                    print(f"  [{result['case_id']}] {result['scenario']}")
                    print(f"  Score: {result.get('score', 0)}/10")
                    if "error" in result:
                        print(f"  Error: {result['error']}")
                print()

        # 리포트 생성
        if args.report:
            output_path = args.output or f"golden_set_report_{agent_name}.{args.report}"
            validator.save_report(output_path, args.report)


if __name__ == "__main__":
    asyncio.run(main())
