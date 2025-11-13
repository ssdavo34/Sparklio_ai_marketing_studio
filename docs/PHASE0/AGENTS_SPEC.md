# Sparklio – Multi-Agent System Specification

**Version:** 1.0
**Date:** 2025-11-13
**Status:** Design Approved
**Phase:** 0 (Foundation)

---

## 📋 Overview

This document specifies the Multi-Agent System architecture for Sparklio, including:
- Agent-to-Agent (A2A) communication protocol
- Agent catalog and responsibilities
- Workflow patterns
- Implementation guidelines

---

## 🤖 Agent Catalog (16 Agents)

### Core Orchestration

#### 1. PM Agent (Project Manager)
**Role**: Workflow orchestration and task coordination

**Responsibilities**:
- Receive user requests and break down into agent tasks
- Route tasks to appropriate agents
- Collect and aggregate agent outputs
- Handle errors and retries
- Maintain workflow state

**Triggers**:
- All user-initiated workflows
- Cross-agent coordination needed

**Primary Models**: GPT-4 (for complex orchestration)

**Input Example**:
```json
{
  "user_request": "Create a brand kit from uploaded files",
  "files": ["logo.png", "brand_guide.pdf"],
  "user_id": "uuid"
}
```

**Output Example**:
```json
{
  "workflow_id": "uuid",
  "status": "in_progress",
  "tasks": [
    {"agent": "VisionAnalyzerAgent", "status": "in_progress"},
    {"agent": "RAGAgent", "status": "pending"}
  ]
}
```

**Dependencies**: All agents

---

### Strategy & Content

#### 2. StrategistAgent
**Role**: Campaign strategy and content structure design

**Responsibilities**:
- Generate marketing brief questions
- Design campaign structures
- Create presentation outlines
- Provide strategic recommendations

**Triggers**:
- Marketing brief creation
- Presentation outline needed
- Campaign planning

**Primary Models**: GPT-4, Claude 3.5 Sonnet

**Input Example**:
```json
{
  "task": "create_brief_questions",
  "context": {
    "industry": "SaaS",
    "previous_answers": ["B2B", "Enterprise"]
  }
}
```

**Output Example**:
```json
{
  "next_question": "What is your primary campaign objective?",
  "options": ["Awareness", "Conversion", "Engagement", "Retention"],
  "reasoning": "Understanding the objective helps tailor the campaign structure."
}
```

---

#### 3. CopywriterAgent
**Role**: Content writing and copywriting

**Responsibilities**:
- Write headlines, taglines, body copy
- Generate SNS captions
- Create email content
- Write blog posts
- Adapt tone/voice to brand guidelines

**Triggers**:
- Any text generation request
- SNS, blog, email, product description modules

**Primary Models**: GPT-4, Claude 3.5 Sonnet, Gemini Pro

**Input Example**:
```json
{
  "task": "write_instagram_caption",
  "product_name": "CloudSync Pro",
  "features": ["Real-time sync", "End-to-end encryption"],
  "tone": "friendly, tech-savvy",
  "brand_guidelines": {"brand_id": "uuid"}
}
```

**Output Example**:
```json
{
  "caption": "Keep your files in perfect sync, anywhere, anytime ☁️✨ CloudSync Pro keeps your data secure with end-to-end encryption. #CloudSync #SecureStorage #Productivity",
  "hashtags": ["#CloudSync", "#SecureStorage", "#Productivity"],
  "character_count": 187
}
```

---

### Vision & Media

#### 4. VisionGeneratorAgent
**Role**: Image generation

**Responsibilities**:
- Generate images from text prompts
- Create brand-aligned visuals
- Generate product mockups
- Create social media graphics

**Triggers**:
- Image needed for content
- Custom graphic requests

**Primary Models**: DALL-E 3, Stable Diffusion, NanoBanana

**Input Example**:
```json
{
  "task": "generate_hero_image",
  "prompt": "Modern SaaS dashboard with analytics charts, blue and white color scheme",
  "style": "clean, professional, tech",
  "dimensions": "1920x1080",
  "brand_colors": ["#3498db", "#ffffff"]
}
```

**Output Example**:
```json
{
  "image_url": "s3://sparklio-outputs/hero_image_uuid.png",
  "prompt_used": "Modern SaaS dashboard...",
  "model": "dall-e-3",
  "cost": 0.04
}
```

---

#### 5. VisionAnalyzerAgent
**Role**: Image analysis and quality assessment

**Responsibilities**:
- Extract colors from logos/images
- Analyze visual style
- Quality check generated images
- Detect inappropriate content

**Triggers**:
- Brand analysis (logo/image upload)
- Image quality check
- Content moderation

**Primary Models**: GPT-4V, Gemini Vision

**Input Example**:
```json
{
  "task": "analyze_brand_logo",
  "image_url": "s3://uploads/logo.png"
}
```

**Output Example**:
```json
{
  "colors": {
    "primary": ["#3498db", "#2c3e50"],
    "secondary": ["#ecf0f1"],
    "accent": ["#e74c3c"]
  },
  "style": "modern, minimalist, tech",
  "dominant_shapes": ["rounded rectangle", "geometric"],
  "recommendations": "Use primary blue for main CTAs, dark gray for text"
}
```

---

### Video Production

#### 6. ScenePlannerAgent
**Role**: Video scene planning and structure

**Responsibilities**:
- Break video into scenes
- Design video flow (hook → problem → solution → CTA)
- Determine scene duration and transitions

**Triggers**:
- Video brief received
- Video production started

**Primary Models**: GPT-4

**Input Example**:
```json
{
  "task": "plan_video_scenes",
  "duration": 30,
  "product": "CloudSync Pro",
  "key_message": "Sync files effortlessly",
  "platform": "instagram_reels"
}
```

**Output Example**:
```json
{
  "scenes": [
    {
      "scene_number": 1,
      "duration": 3,
      "description": "Hook: Person frustrated with unsync'd files",
      "shot_type": "close-up"
    },
    {
      "scene_number": 2,
      "duration": 10,
      "description": "Show CloudSync Pro dashboard syncing files in real-time",
      "shot_type": "screen recording"
    },
    {
      "scene_number": 3,
      "duration": 12,
      "description": "Highlight features: real-time sync, encryption, multi-device",
      "shot_type": "animated graphics"
    },
    {
      "scene_number": 4,
      "duration": 5,
      "description": "CTA: Try CloudSync Pro free for 30 days",
      "shot_type": "text overlay + logo"
    }
  ],
  "total_duration": 30
}
```

---

#### 7. StoryboardBuilderAgent
**Role**: Storyboard creation

**Responsibilities**:
- Generate visual storyboard from scene plan
- Create scene thumbnails
- Add visual notes and directions

**Triggers**:
- Scene plan approved
- Storyboard requested

**Primary Models**: GPT-4 + DALL-E

**Input Example**:
```json
{
  "task": "create_storyboard",
  "scenes": [...] // from ScenePlannerAgent
}
```

**Output Example**:
```json
{
  "storyboard_frames": [
    {
      "scene_number": 1,
      "image_url": "s3://storyboards/frame_1.png",
      "description": "Frustrated person at laptop",
      "notes": "Emphasize frustration with unsync'd files"
    },
    ...
  ]
}
```

---

#### 8. VideoDirectorAgent
**Role**: Video production coordination

**Responsibilities**:
- Coordinate video generation
- Assemble timeline from scenes
- Add transitions, effects, music
- Render final video

**Triggers**:
- Storyboard approved
- Video rendering requested

**Primary Models**: GPT-4 (coordination), Sora2 (video gen, roadmap)

**Input Example**:
```json
{
  "task": "produce_video",
  "storyboard": {...},
  "music": "upbeat_corporate",
  "voiceover": null
}
```

**Output Example**:
```json
{
  "timeline": {...},
  "render_job_id": "uuid",
  "estimated_render_time": 300
}
```

---

#### 9. VideoReviewerAgent
**Role**: Video quality assurance

**Responsibilities**:
- Check video quality (resolution, clarity)
- Verify brand consistency
- Detect errors (audio sync, cuts)
- Suggest improvements

**Triggers**:
- Video rendered
- Quality check requested

**Primary Models**: GPT-4V

**Input Example**:
```json
{
  "task": "review_video",
  "video_url": "s3://outputs/video_uuid.mp4"
}
```

**Output Example**:
```json
{
  "quality_score": 8.5,
  "issues": [
    "Audio slightly out of sync at 15s mark",
    "CTA text could be larger for mobile viewing"
  ],
  "approved": false,
  "suggestions": "Increase CTA text size by 20%, adjust audio sync"
}
```

---

### Templates & Resources

#### 10. TemplateAgent
**Role**: Template generation and selection

**Responsibilities**:
- Generate content templates
- Select appropriate templates
- Customize templates to brand

**Triggers**:
- Template creation request
- Content generation (selects template)

**Primary Models**: GPT-4, Local LLMs

**Input Example**:
```json
{
  "task": "generate_template",
  "content_type": "email",
  "industry": "SaaS",
  "goal": "product_launch"
}
```

**Output Example**:
```json
{
  "template_id": "uuid",
  "name": "SaaS Product Launch Email",
  "structure": {
    "sections": [
      {"type": "hero", "placeholders": ["headline", "subheadline", "cta"]},
      {"type": "features", "placeholders": ["feature1", "feature2", "feature3"]},
      {"type": "social_proof", "placeholders": ["testimonial"]},
      {"type": "footer", "placeholders": ["unsubscribe_link"]}
    ]
  }
}
```

---

#### 11. TrendAgent
**Role**: Trend analysis and recommendations

**Responsibilities**:
- Collect marketing/industry trends
- Analyze social media trends
- Recommend trending topics/hashtags
- Provide insights for campaigns

**Triggers**:
- Scheduled trend updates
- Brief creation (suggest trends)
- Hashtag recommendations

**Primary Models**: Gemini Pro, Web Search APIs

**Input Example**:
```json
{
  "task": "analyze_trends",
  "category": "SaaS marketing",
  "time_range": "last_7_days"
}
```

**Output Example**:
```json
{
  "trends": [
    {
      "topic": "AI-driven personalization",
      "relevance_score": 0.92,
      "sources": ["TechCrunch", "MarketingProfs"],
      "summary": "AI personalization is trending as marketers seek to deliver tailored experiences.",
      "hashtags": ["#AIMarketing", "#Personalization"],
      "recommendation": "Highlight CloudSync's AI-powered file organization feature"
    }
  ]
}
```

---

#### 12. DataCollectorAgent
**Role**: Resource collection and parsing

**Responsibilities**:
- Collect files from uploads
- Parse PDFs, PPTs, DOCX, images
- Extract text and metadata
- Queue for RAG indexing

**Triggers**:
- File uploaded
- Scheduled crawling (roadmap)

**Primary Models**: None (uses parsing libraries)

**Input Example**:
```json
{
  "task": "parse_file",
  "file_url": "s3://uploads/brand_guide.pdf"
}
```

**Output Example**:
```json
{
  "file_id": "uuid",
  "text_chunks": [
    {"page": 1, "text": "Brand Guidelines..."},
    {"page": 2, "text": "Color Palette..."}
  ],
  "images": ["s3://parsed/page1.png"],
  "metadata": {"pages": 20, "file_size": 2048000}
}
```

---

#### 13. RAGAgent
**Role**: Knowledge retrieval (RAG)

**Responsibilities**:
- Embed text chunks
- Store embeddings in pgvector
- Semantic search
- Provide context for other agents

**Triggers**:
- Content indexed
- Context needed for generation

**Primary Models**: OpenAI Embeddings, GPT-4

**Input Example**:
```json
{
  "task": "search",
  "query": "brand tone and voice guidelines",
  "top_k": 5
}
```

**Output Example**:
```json
{
  "results": [
    {
      "text": "Our brand voice is friendly, approachable, and tech-savvy...",
      "source": "brand_guide.pdf",
      "relevance_score": 0.94
    },
    ...
  ]
}
```

---

### Optimization & Governance

#### 14. ADAgent (Roadmap)
**Role**: Ad performance optimization

**Responsibilities**:
- Design PPC campaigns (Google Ads, Facebook Ads)
- Optimize ad spend
- A/B test ad creatives
- Monitor performance

**Triggers**:
- Ad campaign creation
- Performance review

**Primary Models**: GPT-4

---

#### 15. SecurityAgent
**Role**: Compliance and security checks

**Responsibilities**:
- Check for copyright violations
- Detect inappropriate content
- Verify brand guideline adherence
- GDPR/privacy compliance

**Triggers**:
- Pre-publish validation
- Content review

**Primary Models**: GPT-4V, Content moderation APIs

**Input Example**:
```json
{
  "task": "validate_content",
  "content_type": "image",
  "content_url": "s3://outputs/social_post.png"
}
```

**Output Example**:
```json
{
  "approved": true,
  "issues": [],
  "compliance": {
    "copyright": "pass",
    "brand_guidelines": "pass",
    "content_policy": "pass"
  }
}
```

---

#### 16. BudgetAgent
**Role**: Cost tracking and optimization

**Responsibilities**:
- Track LLM API usage
- Calculate costs per request
- Monitor user budgets
- Alert on budget thresholds
- Recommend cost optimizations

**Triggers**:
- Every LLM API call
- Budget check requests

**Primary Models**: None (uses logic + database)

**Input Example**:
```json
{
  "task": "track_usage",
  "user_id": "uuid",
  "model": "gpt-4",
  "tokens_input": 500,
  "tokens_output": 200
}
```

**Output Example**:
```json
{
  "cost": 0.042,
  "user_budget_remaining": 9.958,
  "alert": null
}
```

---

## 🔄 A2A Communication Protocol

### Message Format

**Standard Message**
```json
{
  "message_id": "uuid-v4",
  "timestamp": "2025-11-13T10:30:00Z",
  "from_agent": "PMAgent",
  "to_agent": "CopywriterAgent",
  "workflow_id": "uuid-v4",
  "correlation_id": "uuid-v4",  // for request-response pairing
  "payload": {
    "task": "write_headline",
    "data": {
      "product_name": "CloudSync Pro",
      "target_audience": "SMB",
      "tone": "professional"
    }
  },
  "priority": "normal",  // low, normal, high
  "timeout": 60  // seconds
}
```

**Response Message**
```json
{
  "message_id": "uuid-v4",
  "timestamp": "2025-11-13T10:30:05Z",
  "in_reply_to": "original-message-id",
  "correlation_id": "uuid-v4",
  "from_agent": "CopywriterAgent",
  "to_agent": "PMAgent",
  "workflow_id": "uuid-v4",
  "status": "ok",  // ok, error, timeout
  "payload": {
    "headline": "CloudSync Pro: Your Files, Always in Sync",
    "alternatives": [
      "Sync Smarter with CloudSync Pro",
      "Never Lose a File Again"
    ]
  },
  "error": null,
  "execution_time_ms": 5200,
  "cost": 0.03
}
```

**Error Response**
```json
{
  "message_id": "uuid-v4",
  "timestamp": "2025-11-13T10:30:10Z",
  "in_reply_to": "original-message-id",
  "correlation_id": "uuid-v4",
  "from_agent": "CopywriterAgent",
  "to_agent": "PMAgent",
  "workflow_id": "uuid-v4",
  "status": "error",
  "payload": null,
  "error": {
    "code": "LLM_TIMEOUT",
    "message": "OpenAI API timeout after 60s",
    "retry_after": 30
  }
}
```

### Transport Mechanism

**Queue-Based (Celery)**
- Each agent is a Celery task
- PM Agent publishes tasks to Celery queues
- Agents consume tasks, process, and return results
- Results stored in Redis for PM Agent retrieval

**Example Flow**
```python
# PM Agent sends task to CopywriterAgent
task = copywriter_agent.apply_async(
    args=[message],
    queue='default',
    priority=5
)

# Wait for result
result = task.get(timeout=60)
```

### Workflow Orchestration

**PM Agent Responsibilities**
1. Receive user request
2. Determine required agents and task order
3. Send tasks to agents (parallel or sequential)
4. Collect results
5. Aggregate and format output
6. Handle errors and retries
7. Return final result to user

**Example Workflow: Generate SNS Post**
```
User Request: "Create Instagram post for CloudSync Pro"
    ↓
PM Agent
    ↓
├─→ StrategistAgent (analyze brief) → strategy
├─→ CopywriterAgent (write caption) → caption
├─→ VisionGeneratorAgent (create image) → image
├─→ TrendAgent (suggest hashtags) → hashtags
    ↓
PM Agent (aggregate)
    ↓
SecurityAgent (validate)
    ↓
Return to User
```

---

## 🧪 Agent Testing

### Unit Tests
- Test agent task processing
- Mock LLM responses
- Validate output format

### Integration Tests
- Test agent-to-agent communication
- Test workflow orchestration
- Test error handling and retries

### Performance Tests
- Measure agent response time
- Test concurrent agent execution
- Test queue throughput

---

## 📊 Agent Monitoring

### Metrics to Track
- **Agent execution time**: How long each agent takes
- **Success rate**: % of successful completions
- **Error rate**: % of errors per agent
- **Cost per agent**: LLM API costs
- **Queue depth**: Pending tasks per agent

### Logging
- All messages logged to `agent_logs` table
- Include: agent name, workflow ID, message ID, payload, status, error
- Use structured logging (JSON format)

### Alerts
- Agent failure rate > 5%
- Agent response time > 60s
- Queue depth > 100

---

## 🚀 Implementation Plan (Phase 0)

### Week 1: Framework
- [ ] Implement A2A protocol (message format)
- [ ] Create `BaseAgent` class
- [ ] Implement PM Agent
- [ ] Set up Celery queues
- [ ] Implement agent registry

### Week 2: Core Agents
- [ ] Implement VisionAnalyzerAgent
- [ ] Implement StrategistAgent
- [ ] Implement CopywriterAgent (basic)
- [ ] Implement RAGAgent
- [ ] Integration tests

---

## 📚 References

- [Celery Documentation](https://docs.celeryproject.org/)
- [A2A Pattern Examples](https://www.microsoft.com/en-us/research/publication/agent-to-agent-communication/)
- [Multi-Agent Systems](https://en.wikipedia.org/wiki/Multi-agent_system)

---

**Status**: Ready for Implementation
**Next Review**: End of Week 1 (Day 5)
