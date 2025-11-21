"""
PM Agent - 워크플로우 조율 및 태스크 분배 에이전트

이 에이전트는 전체 워크플로우를 관리하고 다른 에이전트들에게
태스크를 분배하는 PM(Project Manager) 역할을 수행합니다.

주요 기능:
1. 사용자 요청 분석 및 워크플로우 계획
2. 태스크 분해 및 우선순위 결정
3. 에이전트 선택 및 태스크 할당
4. 실행 순서 결정 (병렬/순차)
5. 진행 상황 모니터링 및 조율
"""

import json
import asyncio
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, ValidationError
import logging
from collections import defaultdict

from app.services.agents.base import AgentBase, AgentRequest, AgentResponse, AgentError
from app.services.llm import LLMGateway as LLMService

logger = logging.getLogger(__name__)

# ==================== Enums ====================

class TaskPriority(str, Enum):
    """태스크 우선순위"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class ExecutionMode(str, Enum):
    """실행 모드"""
    SEQUENTIAL = "sequential"
    PARALLEL = "parallel"
    MIXED = "mixed"

class TaskStatus(str, Enum):
    """태스크 상태"""
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    BLOCKED = "blocked"

class AgentCategory(str, Enum):
    """에이전트 카테고리"""
    CREATION = "creation"
    INTELLIGENCE = "intelligence"
    SYSTEM = "system"
    ORCHESTRATION = "orchestration"

# ==================== Input/Output Schemas ====================

class UserRequest(BaseModel):
    """사용자 요청"""
    request_text: str = Field(..., description="자연어 요청")
    context: Optional[Dict[str, Any]] = Field(None, description="요청 컨텍스트")
    constraints: Optional[Dict[str, Any]] = Field(None, description="제약 조건")
    preferences: Optional[Dict[str, Any]] = Field(None, description="선호 설정")

class Task(BaseModel):
    """태스크"""
    task_id: str = Field(..., description="태스크 ID")
    description: str = Field(..., description="태스크 설명")
    agent_type: str = Field(..., description="담당 에이전트 타입")
    priority: TaskPriority = Field(..., description="우선순위")
    dependencies: List[str] = Field(default_factory=list, description="의존 태스크 ID")
    estimated_duration: float = Field(..., description="예상 소요 시간(초)")
    payload: Dict[str, Any] = Field(default_factory=dict, description="태스크 페이로드")

class WorkflowPlan(BaseModel):
    """워크플로우 계획"""
    workflow_id: str = Field(..., description="워크플로우 ID")
    tasks: List[Task] = Field(..., description="태스크 목록")
    execution_mode: ExecutionMode = Field(..., description="실행 모드")
    total_estimated_time: float = Field(..., description="총 예상 시간(초)")
    resource_requirements: Dict[str, Any] = Field(default_factory=dict, description="리소스 요구사항")

class TaskAssignment(BaseModel):
    """태스크 할당"""
    task_id: str = Field(..., description="태스크 ID")
    agent_id: str = Field(..., description="에이전트 ID")
    assigned_at: datetime = Field(..., description="할당 시간")
    status: TaskStatus = Field(default=TaskStatus.ASSIGNED, description="상태")

class ExecutionStatus(BaseModel):
    """실행 상태"""
    workflow_id: str = Field(..., description="워크플로우 ID")
    total_tasks: int = Field(..., description="전체 태스크 수")
    completed_tasks: int = Field(..., description="완료된 태스크 수")
    failed_tasks: int = Field(..., description="실패한 태스크 수")
    in_progress_tasks: int = Field(..., description="진행 중인 태스크 수")
    progress_percentage: float = Field(..., description="진행률")
    elapsed_time: float = Field(..., description="경과 시간(초)")

class WorkflowResult(BaseModel):
    """워크플로우 결과"""
    workflow_id: str = Field(..., description="워크플로우 ID")
    status: str = Field(..., description="전체 상태")
    task_results: Dict[str, Any] = Field(..., description="태스크별 결과")
    execution_time: float = Field(..., description="실행 시간(초)")
    success_rate: float = Field(..., description="성공률")

# ==================== Main Agent Class ====================

class PMAgent(AgentBase):
    """워크플로우 조율 및 태스크 분배 에이전트"""

    def __init__(self, llm_service: Optional[LLMService] = None):
        super().__init__(
            agent_id="pm",
            name="PM Agent",
            description="워크플로우를 계획하고 태스크를 에이전트에게 분배합니다",
            category="system",
            llm_service=llm_service
        )

        # 에이전트 레지스트리
        self.agent_registry = {
            # Creation Agents
            "copy_writer": {"category": "creation", "capabilities": ["text_generation"]},
            "image_generator": {"category": "creation", "capabilities": ["image_generation"]},
            "video_producer": {"category": "creation", "capabilities": ["video_generation"]},
            "vision_analyzer": {"category": "creation", "capabilities": ["image_analysis"]},
            "scene_planner": {"category": "creation", "capabilities": ["scene_planning"]},

            # Intelligence Agents
            "trend_collector": {"category": "intelligence", "capabilities": ["data_collection"]},
            "data_cleaner": {"category": "intelligence", "capabilities": ["data_cleaning"]},
            "embedder": {"category": "intelligence", "capabilities": ["embedding"]},
            "rag": {"category": "intelligence", "capabilities": ["search", "generation"]},
            "ingestor": {"category": "intelligence", "capabilities": ["data_storage"]},
            "performance_analyzer": {"category": "intelligence", "capabilities": ["analysis"]},
            "self_learning": {"category": "intelligence", "capabilities": ["learning"]},

            # System Agents
            "qa": {"category": "system", "capabilities": ["quality_check"]},
            "error_handler": {"category": "system", "capabilities": ["error_handling"]},
            "logger": {"category": "system", "capabilities": ["logging"]},
        }

        # 실행 중인 워크플로우
        self.active_workflows: Dict[str, Dict[str, Any]] = {}

        # 태스크 할당 기록
        self.task_assignments: Dict[str, List[TaskAssignment]] = defaultdict(list)

    async def execute(self, request: AgentRequest) -> AgentResponse:
        """에이전트 실행"""
        try:
            task = request.task

            if task == "plan_workflow":
                result = await self._plan_workflow(request.payload)
            elif task == "execute_workflow":
                result = await self._execute_workflow(request.payload)
            elif task == "assign_task":
                result = await self._assign_task(request.payload)
            elif task == "monitor_progress":
                result = await self._monitor_progress(request.payload)
            elif task == "optimize_workflow":
                result = await self._optimize_workflow(request.payload)
            else:
                raise AgentError(f"Unknown task: {request.task}")

            return AgentResponse(
                agent_id=self.agent_id,
                status="success",
                result=result,
                metadata={
                    "task": task,
                    "timestamp": datetime.now().isoformat(),
                    "active_workflows": len(self.active_workflows)
                }
            )

        except ValidationError as e:
            logger.error(f"Validation error: {e}")
            return AgentResponse(
                agent_id=self.agent_id,
                status="error",
                error=f"입력 데이터 검증 실패: {str(e)}"
            )
        except Exception as e:
            logger.error(f"PM agent error: {e}")
            return AgentResponse(
                agent_id=self.agent_id,
                status="error",
                error=str(e)
            )

    async def _plan_workflow(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """워크플로우 계획"""
        user_request = UserRequest(**payload)

        # 자연어 요청 분석
        intent = self._analyze_intent(user_request.request_text)

        # 태스크 분해
        tasks = self._decompose_tasks(intent, user_request.context)

        # 의존성 분석
        tasks = self._analyze_dependencies(tasks)

        # 우선순위 결정
        tasks = self._prioritize_tasks(tasks)

        # 실행 모드 결정
        execution_mode = self._determine_execution_mode(tasks)

        # 예상 시간 계산
        total_time = sum(task.estimated_duration for task in tasks)

        # 리소스 요구사항
        resource_requirements = self._calculate_resources(tasks)

        # 워크플로우 ID 생성
        workflow_id = f"wf_{datetime.now().strftime('%Y%m%d%H%M%S')}"

        workflow_plan = WorkflowPlan(
            workflow_id=workflow_id,
            tasks=tasks,
            execution_mode=execution_mode,
            total_estimated_time=total_time,
            resource_requirements=resource_requirements
        )

        # 워크플로우 저장
        self.active_workflows[workflow_id] = {
            "plan": workflow_plan,
            "status": "planned",
            "created_at": datetime.now()
        }

        return workflow_plan.dict()

    async def _execute_workflow(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """워크플로우 실행"""
        workflow_id = payload.get("workflow_id")

        if workflow_id not in self.active_workflows:
            raise ValueError(f"Workflow not found: {workflow_id}")

        workflow = self.active_workflows[workflow_id]
        plan: WorkflowPlan = WorkflowPlan(**workflow["plan"])

        start_time = datetime.now()
        workflow["status"] = "executing"

        task_results = {}

        if plan.execution_mode == ExecutionMode.SEQUENTIAL:
            # 순차 실행
            for task in plan.tasks:
                result = await self._execute_task(task, workflow_id)
                task_results[task.task_id] = result

        elif plan.execution_mode == ExecutionMode.PARALLEL:
            # 병렬 실행
            task_coroutines = [
                self._execute_task(task, workflow_id)
                for task in plan.tasks
            ]
            results = await asyncio.gather(*task_coroutines, return_exceptions=True)

            for task, result in zip(plan.tasks, results):
                task_results[task.task_id] = result

        else:  # MIXED
            # 의존성 기반 혼합 실행
            task_results = await self._execute_mixed(plan.tasks, workflow_id)

        # 실행 완료
        execution_time = (datetime.now() - start_time).total_seconds()
        workflow["status"] = "completed"

        # 성공률 계산
        successful_tasks = sum(
            1 for result in task_results.values()
            if not isinstance(result, Exception)
        )
        success_rate = successful_tasks / len(task_results) if task_results else 0

        return WorkflowResult(
            workflow_id=workflow_id,
            status="completed",
            task_results=task_results,
            execution_time=execution_time,
            success_rate=success_rate
        ).dict()

    async def _execute_task(self, task: Task, workflow_id: str) -> Dict[str, Any]:
        """태스크 실행"""
        # 에이전트에게 할당
        assignment = TaskAssignment(
            task_id=task.task_id,
            agent_id=task.agent_type,
            assigned_at=datetime.now(),
            status=TaskStatus.IN_PROGRESS
        )

        self.task_assignments[workflow_id].append(assignment)

        # Mock 실행 (실제로는 해당 에이전트 호출)
        await asyncio.sleep(0.1)  # 실행 시뮬레이션

        # Mock 결과
        result = {
            "task_id": task.task_id,
            "status": "success",
            "output": f"Result from {task.agent_type}",
            "execution_time": task.estimated_duration
        }

        assignment.status = TaskStatus.COMPLETED

        return result

    async def _execute_mixed(
        self,
        tasks: List[Task],
        workflow_id: str
    ) -> Dict[str, Any]:
        """의존성 기반 혼합 실행"""
        completed_tasks = set()
        task_results = {}
        tasks_dict = {task.task_id: task for task in tasks}

        while len(completed_tasks) < len(tasks):
            # 실행 가능한 태스크 찾기
            ready_tasks = [
                task for task in tasks
                if task.task_id not in completed_tasks
                and all(dep in completed_tasks for dep in task.dependencies)
            ]

            if not ready_tasks:
                break

            # 병렬 실행
            results = await asyncio.gather(*[
                self._execute_task(task, workflow_id)
                for task in ready_tasks
            ], return_exceptions=True)

            for task, result in zip(ready_tasks, results):
                task_results[task.task_id] = result
                completed_tasks.add(task.task_id)

        return task_results

    async def _assign_task(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """태스크 할당"""
        task = Task(**payload["task"])
        workflow_id = payload.get("workflow_id", "default")

        # 최적 에이전트 선택
        selected_agent = self._select_agent(task)

        assignment = TaskAssignment(
            task_id=task.task_id,
            agent_id=selected_agent,
            assigned_at=datetime.now(),
            status=TaskStatus.ASSIGNED
        )

        self.task_assignments[workflow_id].append(assignment)

        return assignment.dict()

    async def _monitor_progress(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """진행 상황 모니터링"""
        workflow_id = payload.get("workflow_id")

        if workflow_id not in self.active_workflows:
            raise ValueError(f"Workflow not found: {workflow_id}")

        workflow = self.active_workflows[workflow_id]
        plan = WorkflowPlan(**workflow["plan"])

        assignments = self.task_assignments.get(workflow_id, [])

        # 상태별 집계
        status_counts = defaultdict(int)
        for assignment in assignments:
            status_counts[assignment.status] += 1

        total_tasks = len(plan.tasks)
        completed = status_counts[TaskStatus.COMPLETED]
        failed = status_counts[TaskStatus.FAILED]
        in_progress = status_counts[TaskStatus.IN_PROGRESS]

        progress_percentage = (completed / total_tasks * 100) if total_tasks > 0 else 0

        elapsed_time = (datetime.now() - workflow["created_at"]).total_seconds()

        return ExecutionStatus(
            workflow_id=workflow_id,
            total_tasks=total_tasks,
            completed_tasks=completed,
            failed_tasks=failed,
            in_progress_tasks=in_progress,
            progress_percentage=progress_percentage,
            elapsed_time=elapsed_time
        ).dict()

    async def _optimize_workflow(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """워크플로우 최적화"""
        workflow_id = payload.get("workflow_id")

        if workflow_id not in self.active_workflows:
            raise ValueError(f"Workflow not found: {workflow_id}")

        workflow = self.active_workflows[workflow_id]
        plan = WorkflowPlan(**workflow["plan"])

        # 최적화 제안
        suggestions = []

        # 1. 병렬화 가능 태스크 찾기
        parallel_candidates = self._find_parallelizable_tasks(plan.tasks)
        if parallel_candidates:
            suggestions.append({
                "type": "parallelization",
                "description": f"{len(parallel_candidates)}개 태스크를 병렬 실행 가능",
                "tasks": parallel_candidates,
                "expected_speedup": len(parallel_candidates) * 0.4
            })

        # 2. 불필요한 의존성 제거
        redundant_deps = self._find_redundant_dependencies(plan.tasks)
        if redundant_deps:
            suggestions.append({
                "type": "dependency_removal",
                "description": f"{len(redundant_deps)}개 불필요한 의존성 발견",
                "dependencies": redundant_deps
            })

        # 3. 리소스 최적화
        resource_suggestions = self._optimize_resources(plan)
        if resource_suggestions:
            suggestions.extend(resource_suggestions)

        return {
            "workflow_id": workflow_id,
            "optimization_suggestions": suggestions,
            "total_suggestions": len(suggestions)
        }

    # ==================== Helper Methods ====================

    def _analyze_intent(self, request_text: str) -> Dict[str, Any]:
        """요청 의도 분석"""
        # Mock 구현 (실제로는 LLM 사용)
        intent = {
            "goal": "content_creation",
            "content_types": ["text", "image"],
            "requirements": ["seo_optimized", "brand_aligned"]
        }

        # 키워드 기반 간단한 분석
        if "광고" in request_text or "캠페인" in request_text:
            intent["goal"] = "campaign_creation"
        elif "분석" in request_text:
            intent["goal"] = "data_analysis"
        elif "트렌드" in request_text:
            intent["goal"] = "trend_research"

        return intent

    def _decompose_tasks(
        self,
        intent: Dict[str, Any],
        context: Optional[Dict[str, Any]]
    ) -> List[Task]:
        """태스크 분해"""
        tasks = []

        goal = intent.get("goal", "content_creation")

        if goal == "content_creation":
            # 콘텐츠 생성 워크플로우
            tasks.extend([
                Task(
                    task_id="task_001",
                    description="트렌드 데이터 수집",
                    agent_type="trend_collector",
                    priority=TaskPriority.HIGH,
                    estimated_duration=5.0,
                    payload={}
                ),
                Task(
                    task_id="task_002",
                    description="콘텐츠 초안 작성",
                    agent_type="copy_writer",
                    priority=TaskPriority.HIGH,
                    dependencies=["task_001"],
                    estimated_duration=10.0,
                    payload={}
                ),
                Task(
                    task_id="task_003",
                    description="이미지 생성",
                    agent_type="image_generator",
                    priority=TaskPriority.MEDIUM,
                    dependencies=["task_002"],
                    estimated_duration=15.0,
                    payload={}
                ),
                Task(
                    task_id="task_004",
                    description="품질 검증",
                    agent_type="qa",
                    priority=TaskPriority.HIGH,
                    dependencies=["task_002", "task_003"],
                    estimated_duration=5.0,
                    payload={}
                )
            ])

        elif goal == "data_analysis":
            # 데이터 분석 워크플로우
            tasks.extend([
                Task(
                    task_id="task_001",
                    description="데이터 수집",
                    agent_type="trend_collector",
                    priority=TaskPriority.HIGH,
                    estimated_duration=10.0,
                    payload={}
                ),
                Task(
                    task_id="task_002",
                    description="데이터 정제",
                    agent_type="data_cleaner",
                    priority=TaskPriority.HIGH,
                    dependencies=["task_001"],
                    estimated_duration=8.0,
                    payload={}
                ),
                Task(
                    task_id="task_003",
                    description="성과 분석",
                    agent_type="performance_analyzer",
                    priority=TaskPriority.HIGH,
                    dependencies=["task_002"],
                    estimated_duration=12.0,
                    payload={}
                )
            ])

        return tasks

    def _analyze_dependencies(self, tasks: List[Task]) -> List[Task]:
        """의존성 분석 및 검증"""
        task_ids = {task.task_id for task in tasks}

        for task in tasks:
            # 유효하지 않은 의존성 제거
            task.dependencies = [
                dep for dep in task.dependencies
                if dep in task_ids
            ]

        return tasks

    def _prioritize_tasks(self, tasks: List[Task]) -> List[Task]:
        """태스크 우선순위 결정"""
        # 의존성과 우선순위 기반 정렬
        priority_map = {
            TaskPriority.CRITICAL: 4,
            TaskPriority.HIGH: 3,
            TaskPriority.MEDIUM: 2,
            TaskPriority.LOW: 1
        }

        tasks.sort(
            key=lambda t: (
                -priority_map[t.priority],
                len(t.dependencies)
            )
        )

        return tasks

    def _determine_execution_mode(self, tasks: List[Task]) -> ExecutionMode:
        """실행 모드 결정"""
        # 의존성이 있으면 MIXED, 없으면 PARALLEL
        has_dependencies = any(task.dependencies for task in tasks)

        if not has_dependencies:
            return ExecutionMode.PARALLEL
        elif all(task.dependencies for task in tasks):
            return ExecutionMode.SEQUENTIAL
        else:
            return ExecutionMode.MIXED

    def _calculate_resources(self, tasks: List[Task]) -> Dict[str, Any]:
        """리소스 요구사항 계산"""
        agent_counts = defaultdict(int)

        for task in tasks:
            agent_counts[task.agent_type] += 1

        return {
            "required_agents": dict(agent_counts),
            "estimated_memory_mb": len(tasks) * 100,
            "estimated_cpu_cores": min(len(tasks), 8)
        }

    def _select_agent(self, task: Task) -> str:
        """태스크에 최적 에이전트 선택"""
        # 이미 agent_type이 지정되어 있으면 그대로 사용
        return task.agent_type

    def _find_parallelizable_tasks(self, tasks: List[Task]) -> List[str]:
        """병렬화 가능한 태스크 찾기"""
        parallelizable = []

        for task in tasks:
            if not task.dependencies:
                parallelizable.append(task.task_id)

        return parallelizable

    def _find_redundant_dependencies(self, tasks: List[Task]) -> List[Dict[str, Any]]:
        """불필요한 의존성 찾기"""
        # 간단한 구현: 전이적 의존성 검사
        redundant = []

        task_deps = {task.task_id: set(task.dependencies) for task in tasks}

        for task in tasks:
            for dep in task.dependencies:
                # dep의 의존성도 현재 태스크의 의존성에 포함되어 있으면 중복
                if dep in task_deps:
                    indirect_deps = task_deps[dep]
                    redundant_in_task = indirect_deps & set(task.dependencies)

                    if redundant_in_task:
                        redundant.append({
                            "task": task.task_id,
                            "redundant_dep": list(redundant_in_task)
                        })

        return redundant

    def _optimize_resources(self, plan: WorkflowPlan) -> List[Dict[str, Any]]:
        """리소스 최적화 제안"""
        suggestions = []

        # 동일 에이전트 호출 횟수 확인
        agent_usage = defaultdict(int)
        for task in plan.tasks:
            agent_usage[task.agent_type] += 1

        # 3회 이상 사용되는 에이전트는 인스턴스 재사용 권장
        for agent_type, count in agent_usage.items():
            if count >= 3:
                suggestions.append({
                    "type": "agent_reuse",
                    "description": f"{agent_type} 에이전트 인스턴스 재사용 권장",
                    "agent": agent_type,
                    "usage_count": count,
                    "expected_savings": count * 0.2  # 20% 절감
                })

        return suggestions

    def get_capabilities(self) -> Dict[str, Any]:
        """에이전트 능력 정보 반환"""
        return {
            "registered_agents": list(self.agent_registry.keys()),
            "supported_execution_modes": [mode.value for mode in ExecutionMode],
            "task_priorities": [priority.value for priority in TaskPriority],
            "features": {
                "workflow_planning": True,
                "task_decomposition": True,
                "dependency_analysis": True,
                "parallel_execution": True,
                "progress_monitoring": True,
                "workflow_optimization": True,
                "resource_management": True
            },
            "active_workflows": len(self.active_workflows),
            "total_assignments": sum(len(a) for a in self.task_assignments.values())
        }

# ==================== Factory Function ====================

def create_pm_agent(llm_service: Optional[LLMService] = None) -> PMAgent:
    """PMAgent 인스턴스 생성"""
    return PMAgent(llm_service=llm_service)

# ==================== Example Usage ====================

if __name__ == "__main__":
    async def test_pm_agent():
        # 에이전트 생성
        agent = create_pm_agent()

        # 1. 워크플로우 계획
        plan_request = AgentRequest(
            task="plan_workflow",
            payload={
                "request_text": "비건 화장품 광고 캠페인을 만들어주세요",
                "context": {
                    "brand": "EcoBeauty",
                    "target_audience": "MZ세대"
                }
            }
        )

        result = await agent.execute(plan_request)
        print(f"워크플로우 계획: {result.status}")
        if result.status == "success":
            workflow_id = result.result["workflow_id"]
            print(f"  - Workflow ID: {workflow_id}")
            print(f"  - 태스크 수: {len(result.result['tasks'])}")
            print(f"  - 실행 모드: {result.result['execution_mode']}")
            print(f"  - 예상 시간: {result.result['total_estimated_time']:.1f}초")

            # 2. 워크플로우 실행
            execute_request = AgentRequest(
                task="execute_workflow",
                payload={"workflow_id": workflow_id}
            )

            result = await agent.execute(execute_request)
            print(f"\n워크플로우 실행: {result.status}")
            if result.status == "success":
                print(f"  - 실행 시간: {result.result['execution_time']:.1f}초")
                print(f"  - 성공률: {result.result['success_rate']:.1%}")

            # 3. 진행 상황 모니터링
            monitor_request = AgentRequest(
                task="monitor_progress",
                payload={"workflow_id": workflow_id}
            )

            result = await agent.execute(monitor_request)
            print(f"\n진행 상황: {result.status}")
            if result.status == "success":
                print(f"  - 진행률: {result.result['progress_percentage']:.1f}%")
                print(f"  - 완료: {result.result['completed_tasks']}/{result.result['total_tasks']}")

            # 4. 워크플로우 최적화
            optimize_request = AgentRequest(
                task="optimize_workflow",
                payload={"workflow_id": workflow_id}
            )

            result = await agent.execute(optimize_request)
            print(f"\n최적화 제안: {result.status}")
            if result.status == "success":
                print(f"  - 제안 수: {result.result['total_suggestions']}")
                for suggestion in result.result['optimization_suggestions']:
                    print(f"    - {suggestion['type']}: {suggestion['description']}")

    # 테스트 실행
    asyncio.run(test_pm_agent())
