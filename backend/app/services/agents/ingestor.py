"""
Ingestor Agent - 데이터 저장 및 관리 전문 에이전트

이 에이전트는 다양한 스토리지 시스템에 데이터를 저장하고 관리합니다.

주요 기능:
1. PostgreSQL 데이터 저장
2. Redis 캐싱
3. S3 파일 업로드
4. 배치 저장 처리
5. 트랜잭션 관리
"""

import json
import hashlib
import asyncio
from typing import Dict, Any, List, Optional, Union
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, ValidationError
import logging

from app.services.agents.base import AgentBase, AgentRequest, AgentResponse, AgentError
from app.services.llm import LLMGateway as LLMService

logger = logging.getLogger(__name__)

# ==================== Enums ====================

class StorageDestination(str, Enum):
    """저장소 종류"""
    POSTGRESQL = "postgresql"
    REDIS = "redis"
    S3 = "s3"
    ELASTICSEARCH = "elasticsearch"
    MONGODB = "mongodb"

class DataType(str, Enum):
    """데이터 타입"""
    DOCUMENT = "document"
    EMBEDDING = "embedding"
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    METADATA = "metadata"
    LOG = "log"
    METRIC = "metric"

class StorageStrategy(str, Enum):
    """저장 전략"""
    IMMEDIATE = "immediate"
    BATCH = "batch"
    ASYNC = "async"
    TRANSACTIONAL = "transactional"

class ConflictResolution(str, Enum):
    """충돌 해결 방식"""
    REPLACE = "replace"
    SKIP = "skip"
    MERGE = "merge"
    VERSION = "version"
    ERROR = "error"

# ==================== Input/Output Schemas ====================

class IngestRequest(BaseModel):
    """데이터 저장 요청"""
    data: List[Dict[str, Any]] = Field(..., description="저장할 데이터")
    destination: StorageDestination = Field(..., description="저장소")
    data_type: DataType = Field(..., description="데이터 타입")
    options: Optional[Dict[str, Any]] = Field(default_factory=dict, description="저장 옵션")

class BatchIngestRequest(BaseModel):
    """배치 저장 요청"""
    items: List[IngestRequest] = Field(..., description="저장 항목들")
    batch_size: int = Field(default=1000, description="배치 크기")
    strategy: StorageStrategy = Field(
        default=StorageStrategy.BATCH,
        description="저장 전략"
    )
    conflict_resolution: ConflictResolution = Field(
        default=ConflictResolution.REPLACE,
        description="충돌 해결 방식"
    )

class CacheRequest(BaseModel):
    """캐시 저장 요청"""
    key: str = Field(..., description="캐시 키")
    value: Any = Field(..., description="캐시 값")
    ttl: Optional[int] = Field(None, description="TTL (초)")
    tags: Optional[List[str]] = Field(None, description="태그")

class FileUploadRequest(BaseModel):
    """파일 업로드 요청"""
    file_path: Optional[str] = Field(None, description="로컬 파일 경로")
    file_content: Optional[bytes] = Field(None, description="파일 내용")
    file_name: str = Field(..., description="파일명")
    bucket: str = Field(default="sparklio-storage", description="S3 버킷")
    folder: Optional[str] = Field(None, description="폴더 경로")
    metadata: Optional[Dict[str, Any]] = Field(None, description="파일 메타데이터")

class QueryRequest(BaseModel):
    """데이터 조회 요청"""
    destination: StorageDestination = Field(..., description="조회 대상")
    query: Dict[str, Any] = Field(..., description="쿼리 조건")
    limit: int = Field(default=100, description="결과 제한")
    offset: int = Field(default=0, description="오프셋")

class DeleteRequest(BaseModel):
    """데이터 삭제 요청"""
    destination: StorageDestination = Field(..., description="삭제 대상")
    conditions: Dict[str, Any] = Field(..., description="삭제 조건")
    soft_delete: bool = Field(default=True, description="소프트 삭제 여부")

# ==================== Output Schemas ====================

class IngestResult(BaseModel):
    """저장 결과"""
    success: bool = Field(..., description="성공 여부")
    inserted_count: int = Field(..., description="저장된 개수")
    failed_count: int = Field(..., description="실패한 개수")
    duration: float = Field(..., description="처리 시간(초)")
    errors: Optional[List[str]] = Field(None, description="에러 메시지")

class BatchIngestResult(BaseModel):
    """배치 저장 결과"""
    total: int = Field(..., description="전체 항목 수")
    successful: int = Field(..., description="성공한 항목 수")
    failed: int = Field(..., description="실패한 항목 수")
    duration: float = Field(..., description="전체 처리 시간(초)")
    results: List[IngestResult] = Field(..., description="개별 결과")

class CacheResult(BaseModel):
    """캐시 결과"""
    success: bool = Field(..., description="성공 여부")
    key: str = Field(..., description="캐시 키")
    cached_at: datetime = Field(..., description="캐시 시간")
    expires_at: Optional[datetime] = Field(None, description="만료 시간")

class FileUploadResult(BaseModel):
    """파일 업로드 결과"""
    success: bool = Field(..., description="성공 여부")
    file_url: str = Field(..., description="파일 URL")
    file_size: int = Field(..., description="파일 크기(bytes)")
    uploaded_at: datetime = Field(..., description="업로드 시간")

class QueryResult(BaseModel):
    """조회 결과"""
    success: bool = Field(..., description="성공 여부")
    data: List[Dict[str, Any]] = Field(..., description="조회된 데이터")
    total_count: int = Field(..., description="전체 개수")
    query_time: float = Field(..., description="쿼리 시간(ms)")

class DeleteResult(BaseModel):
    """삭제 결과"""
    success: bool = Field(..., description="성공 여부")
    deleted_count: int = Field(..., description="삭제된 개수")
    duration: float = Field(..., description="처리 시간(초)")

# ==================== Main Agent Class ====================

class IngestorAgent(AgentBase):
    """데이터 저장 및 관리 에이전트"""

    def __init__(self, llm_service: Optional[LLMService] = None):
        super().__init__(
            llm_gateway=llm_service
        )

        # Mock 스토리지 (실제로는 DB 연결)
        self.postgresql_storage: Dict[str, List[Dict[str, Any]]] = {}
        self.redis_cache: Dict[str, Any] = {}
        self.s3_storage: Dict[str, bytes] = {}
        self.elasticsearch_storage: Dict[str, List[Dict[str, Any]]] = {}

        # 통계
        self.stats = {
            "total_ingested": 0,
            "total_cached": 0,
            "total_uploaded": 0,
            "total_errors": 0
        }

    @property
    def name(self) -> str:
        """Agent 이름 반환"""
        return "ingestor"

    async def execute(self, request: AgentRequest) -> AgentResponse:
        """에이전트 실행"""
        from app.services.agents.base import AgentOutput
        try:
            task = request.task

            if task == "ingest_data":
                result = await self._ingest_data(request.payload)
            elif task == "batch_ingest":
                result = await self._batch_ingest(request.payload)
            elif task == "cache_data":
                result = await self._cache_data(request.payload)
            elif task == "upload_file":
                result = await self._upload_file(request.payload)
            elif task == "query_data":
                result = await self._query_data(request.payload)
            elif task == "delete_data":
                result = await self._delete_data(request.payload)
            else:
                raise AgentError(f"Unknown task: {request.task}")

            return AgentResponse(
                agent=self.name,
                task=task.value if hasattr(task, 'value') else task,
                outputs=[AgentOutput(type="json", name="result", value=result)],
                usage={},
                meta={
                    "task": task,
                    "timestamp": datetime.now().isoformat(),
                    "stats": self.stats
                }
            )

        except ValidationError as e:
            logger.error(f"Validation error: {e}")
            return AgentResponse(
                agent=self.name,
                task=request.task,
                outputs=[AgentOutput(
                    type="json", name="error",
                    value={"error": f"입력 데이터 검증 실패: {str(e)}"}
                )],
                usage={},
                meta={}
            )
        except Exception as e:
            logger.error(f"Ingestor agent error: {e}")
            self.stats["total_errors"] += 1
            return AgentResponse(
                agent=self.name,
                task=request.task,
                outputs=[AgentOutput(
                    type="json", name="error",
                    value={"error": str(e)}
                )],
                usage={},
                meta={}
            )

    async def _ingest_data(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """데이터 저장"""
        input_data = IngestRequest(**payload)
        start_time = datetime.now()

        inserted_count = 0
        failed_count = 0
        errors = []

        try:
            if input_data.destination == StorageDestination.POSTGRESQL:
                # PostgreSQL 저장 시뮬레이션
                table_name = input_data.options.get("table", input_data.data_type.value)

                if table_name not in self.postgresql_storage:
                    self.postgresql_storage[table_name] = []

                for item in input_data.data:
                    try:
                        # ID 생성
                        if "id" not in item:
                            item["id"] = self._generate_id(item)

                        # 타임스탬프 추가
                        item["created_at"] = datetime.now().isoformat()

                        self.postgresql_storage[table_name].append(item)
                        inserted_count += 1
                    except Exception as e:
                        failed_count += 1
                        errors.append(str(e))

            elif input_data.destination == StorageDestination.ELASTICSEARCH:
                # Elasticsearch 저장 시뮬레이션
                index_name = input_data.options.get("index", input_data.data_type.value)

                if index_name not in self.elasticsearch_storage:
                    self.elasticsearch_storage[index_name] = []

                for item in input_data.data:
                    try:
                        # 인덱싱
                        self.elasticsearch_storage[index_name].append(item)
                        inserted_count += 1
                    except Exception as e:
                        failed_count += 1
                        errors.append(str(e))

            else:
                raise ValueError(f"지원하지 않는 destination: {input_data.destination}")

            self.stats["total_ingested"] += inserted_count
            duration = (datetime.now() - start_time).total_seconds()

            result = IngestResult(
                success=failed_count == 0,
                inserted_count=inserted_count,
                failed_count=failed_count,
                duration=duration,
                errors=errors if errors else None
            ).dict()

            # Add status/ingested for test compatibility
            result["status"] = "success" if failed_count == 0 else "partial_failure"
            result["ingested"] = inserted_count
            return result

        except Exception as e:
            duration = (datetime.now() - start_time).total_seconds()
            return IngestResult(
                success=False,
                inserted_count=inserted_count,
                failed_count=len(input_data.data) - inserted_count,
                duration=duration,
                errors=[str(e)]
            ).dict()

    async def _batch_ingest(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """배치 저장"""
        input_data = BatchIngestRequest(**payload)
        start_time = datetime.now()

        results = []
        successful = 0
        failed = 0

        # 배치 처리
        for i in range(0, len(input_data.items), input_data.batch_size):
            batch = input_data.items[i:i + input_data.batch_size]

            if input_data.strategy == StorageStrategy.ASYNC:
                # 비동기 병렬 처리
                tasks = [self._ingest_data(item.dict()) for item in batch]
                batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            else:
                # 순차 처리
                batch_results = []
                for item in batch:
                    result = await self._ingest_data(item.dict())
                    batch_results.append(result)

            # 결과 집계
            for result in batch_results:
                if isinstance(result, Exception):
                    failed += 1
                    results.append(IngestResult(
                        success=False,
                        inserted_count=0,
                        failed_count=1,
                        duration=0,
                        errors=[str(result)]
                    ))
                else:
                    result_obj = IngestResult(**result)
                    results.append(result_obj)
                    if result_obj.success:
                        successful += result_obj.inserted_count
                    else:
                        failed += result_obj.failed_count

        duration = (datetime.now() - start_time).total_seconds()

        return BatchIngestResult(
            total=len(input_data.items),
            successful=successful,
            failed=failed,
            duration=duration,
            results=results
        ).dict()

    async def _cache_data(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """캐시 저장"""
        input_data = CacheRequest(**payload)

        # Redis 캐시 시뮬레이션
        cached_at = datetime.now()
        expires_at = None

        if input_data.ttl:
            from datetime import timedelta
            expires_at = cached_at + timedelta(seconds=input_data.ttl)

        # 캐시 저장
        cache_entry = {
            "value": input_data.value,
            "cached_at": cached_at.isoformat(),
            "expires_at": expires_at.isoformat() if expires_at else None,
            "tags": input_data.tags or []
        }

        self.redis_cache[input_data.key] = cache_entry
        self.stats["total_cached"] += 1

        return CacheResult(
            success=True,
            key=input_data.key,
            cached_at=cached_at,
            expires_at=expires_at
        ).dict()

    async def _upload_file(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """파일 업로드"""
        input_data = FileUploadRequest(**payload)

        # S3 업로드 시뮬레이션
        uploaded_at = datetime.now()

        # 파일 내용 준비
        if input_data.file_content:
            file_content = input_data.file_content
        elif input_data.file_path:
            # 실제로는 파일을 읽음
            file_content = b"mock_file_content"
        else:
            raise ValueError("file_content 또는 file_path가 필요합니다")

        # S3 경로 생성
        folder = input_data.folder or "uploads"
        s3_key = f"{folder}/{input_data.file_name}"

        # 저장
        self.s3_storage[s3_key] = file_content
        self.stats["total_uploaded"] += 1

        # URL 생성
        file_url = f"s3://{input_data.bucket}/{s3_key}"

        return FileUploadResult(
            success=True,
            file_url=file_url,
            file_size=len(file_content),
            uploaded_at=uploaded_at
        ).dict()

    async def _query_data(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """데이터 조회"""
        input_data = QueryRequest(**payload)
        start_time = datetime.now()

        results = []

        try:
            if input_data.destination == StorageDestination.POSTGRESQL:
                # PostgreSQL 쿼리 시뮬레이션
                table_name = input_data.query.get("table", "documents")

                if table_name in self.postgresql_storage:
                    all_data = self.postgresql_storage[table_name]

                    # 필터링 (간단한 구현)
                    filtered_data = all_data
                    if "filters" in input_data.query:
                        filters = input_data.query["filters"]
                        filtered_data = [
                            item for item in all_data
                            if all(item.get(k) == v for k, v in filters.items())
                        ]

                    # 페이징
                    results = filtered_data[input_data.offset:input_data.offset + input_data.limit]

            elif input_data.destination == StorageDestination.REDIS:
                # Redis 조회
                key_pattern = input_data.query.get("key")
                if key_pattern and key_pattern in self.redis_cache:
                    cache_entry = self.redis_cache[key_pattern]
                    results = [cache_entry]

            query_time = (datetime.now() - start_time).total_seconds() * 1000

            return QueryResult(
                success=True,
                data=results,
                total_count=len(results),
                query_time=query_time
            ).dict()

        except Exception as e:
            query_time = (datetime.now() - start_time).total_seconds() * 1000
            return QueryResult(
                success=False,
                data=[],
                total_count=0,
                query_time=query_time
            ).dict()

    async def _delete_data(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """데이터 삭제"""
        input_data = DeleteRequest(**payload)
        start_time = datetime.now()

        deleted_count = 0

        try:
            if input_data.destination == StorageDestination.POSTGRESQL:
                table_name = input_data.conditions.get("table", "documents")

                if table_name in self.postgresql_storage:
                    filters = input_data.conditions.get("filters", {})

                    if input_data.soft_delete:
                        # 소프트 삭제
                        for item in self.postgresql_storage[table_name]:
                            if all(item.get(k) == v for k, v in filters.items()):
                                item["deleted_at"] = datetime.now().isoformat()
                                deleted_count += 1
                    else:
                        # 하드 삭제
                        original_count = len(self.postgresql_storage[table_name])
                        self.postgresql_storage[table_name] = [
                            item for item in self.postgresql_storage[table_name]
                            if not all(item.get(k) == v for k, v in filters.items())
                        ]
                        deleted_count = original_count - len(self.postgresql_storage[table_name])

            elif input_data.destination == StorageDestination.REDIS:
                # Redis 삭제
                key = input_data.conditions.get("key")
                if key and key in self.redis_cache:
                    del self.redis_cache[key]
                    deleted_count = 1

            duration = (datetime.now() - start_time).total_seconds()

            return DeleteResult(
                success=True,
                deleted_count=deleted_count,
                duration=duration
            ).dict()

        except Exception as e:
            duration = (datetime.now() - start_time).total_seconds()
            return DeleteResult(
                success=False,
                deleted_count=0,
                duration=duration
            ).dict()

    # ==================== Helper Methods ====================

    def _generate_id(self, data: Dict[str, Any]) -> str:
        """데이터 기반 ID 생성"""
        content = json.dumps(data, sort_keys=True)
        return hashlib.md5(content.encode()).hexdigest()[:16]

    def get_capabilities(self) -> Dict[str, Any]:
        """에이전트 능력 정보 반환"""
        return {
            "supported_destinations": [dest.value for dest in StorageDestination],
            "supported_data_types": [dtype.value for dtype in DataType],
            "storage_strategies": [strategy.value for strategy in StorageStrategy],
            "conflict_resolutions": [res.value for res in ConflictResolution],
            "features": {
                "batch_processing": True,
                "async_ingestion": True,
                "caching": True,
                "file_upload": True,
                "query": True,
                "soft_delete": True,
                "transaction": True
            },
            "stats": self.stats,
            "storage_status": {
                "postgresql_tables": len(self.postgresql_storage),
                "redis_keys": len(self.redis_cache),
                "s3_files": len(self.s3_storage),
                "elasticsearch_indices": len(self.elasticsearch_storage)
            }
        }

# ==================== Factory Function ====================

def create_ingestor_agent(llm_service: Optional[LLMService] = None) -> IngestorAgent:
    """IngestorAgent 인스턴스 생성"""
    return IngestorAgent(llm_service=llm_service)

# ==================== Example Usage ====================

if __name__ == "__main__":
    async def test_ingestor_agent():
        # 에이전트 생성
        agent = create_ingestor_agent()

        # 1. 데이터 저장
        ingest_request = AgentRequest(
            task="ingest_data",
            payload={
                "data": [
                    {
                        "title": "마케팅 가이드",
                        "content": "AI 마케팅 자동화...",
                        "category": "guide"
                    },
                    {
                        "title": "브랜드 가이드라인",
                        "content": "브랜드 톤앤매너...",
                        "category": "guideline"
                    }
                ],
                "destination": "postgresql",
                "data_type": "document",
                "options": {"table": "documents"}
            }
        )

        result = await agent.execute(ingest_request)
        print(f"데이터 저장 결과: {result.status}")
        if result.status == "success":
            print(f"  - 저장된 개수: {result.result['inserted_count']}")
            print(f"  - 처리 시간: {result.result['duration']:.2f}초")

        # 2. 캐시 저장
        cache_request = AgentRequest(
            task="cache_data",
            payload={
                "key": "trend_data_2025",
                "value": {"trend": "AI 마케팅", "score": 95},
                "ttl": 3600,
                "tags": ["trend", "2025"]
            }
        )

        result = await agent.execute(cache_request)
        print(f"\n캐시 저장 결과: {result.status}")
        if result.status == "success":
            print(f"  - 캐시 키: {result.result['key']}")
            print(f"  - 만료 시간: {result.result.get('expires_at', 'N/A')}")

        # 3. 파일 업로드
        upload_request = AgentRequest(
            task="upload_file",
            payload={
                "file_content": b"test file content",
                "file_name": "test.txt",
                "bucket": "sparklio-storage",
                "folder": "documents"
            }
        )

        result = await agent.execute(upload_request)
        print(f"\n파일 업로드 결과: {result.status}")
        if result.status == "success":
            print(f"  - 파일 URL: {result.result['file_url']}")
            print(f"  - 파일 크기: {result.result['file_size']} bytes")

        # 4. 데이터 조회
        query_request = AgentRequest(
            task="query_data",
            payload={
                "destination": "postgresql",
                "query": {
                    "table": "documents",
                    "filters": {"category": "guide"}
                },
                "limit": 10
            }
        )

        result = await agent.execute(query_request)
        print(f"\n데이터 조회 결과: {result.status}")
        if result.status == "success":
            print(f"  - 조회된 개수: {result.result['total_count']}")
            print(f"  - 쿼리 시간: {result.result['query_time']:.2f}ms")

        # 5. 배치 저장
        batch_request = AgentRequest(
            task="batch_ingest",
            payload={
                "items": [
                    {
                        "data": [{"id": i, "value": f"data_{i}"}],
                        "destination": "postgresql",
                        "data_type": "metadata",
                        "options": {"table": "batch_data"}
                    }
                    for i in range(10)
                ],
                "batch_size": 5,
                "strategy": "batch"
            }
        )

        result = await agent.execute(batch_request)
        print(f"\n배치 저장 결과: {result.status}")
        if result.status == "success":
            print(f"  - 전체: {result.result['total']}")
            print(f"  - 성공: {result.result['successful']}")
            print(f"  - 처리 시간: {result.result['duration']:.2f}초")

        # 능력 정보
        capabilities = agent.get_capabilities()
        print(f"\n에이전트 통계:")
        print(f"  - 총 저장: {capabilities['stats']['total_ingested']}")
        print(f"  - 총 캐시: {capabilities['stats']['total_cached']}")
        print(f"  - 총 업로드: {capabilities['stats']['total_uploaded']}")

    # 테스트 실행
    asyncio.run(test_ingestor_agent())
