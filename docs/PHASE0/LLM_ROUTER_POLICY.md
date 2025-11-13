# Sparklio – LLM Router Policy & Configuration

**Version:** 1.0
**Date:** 2025-11-13
**Status:** Active
**Owner:** Engineering Team

---

## 📋 Overview

The LLM Router intelligently selects the optimal language model for each task based on:
- **Task Complexity**: Simple, medium, or complex
- **Cost Budget**: User budget constraints
- **Speed Requirements**: Real-time vs batch processing
- **Quality Target**: Draft, standard, or production quality

This document defines the routing policy, model configurations, and cost optimization strategies.

---

## 🎯 Routing Decision Matrix

### Primary Decision Factors

| Factor | Weight | Values | Impact |
|--------|--------|--------|--------|
| **Task Complexity** | 40% | Simple, Medium, Complex | Higher complexity → more capable models |
| **Cost Budget** | 30% | Low, Standard, Premium | Lower budget → cheaper models |
| **Speed Requirement** | 20% | Real-time (<3s), Standard (<10s), Batch | Speed priority → faster models |
| **Quality Target** | 10% | Draft, Standard, Production | Higher quality → premium models |

### Routing Algorithm

```python
def select_model(task_type, complexity, budget, speed, quality):
    # 1. Check user budget constraints
    if budget == "low":
        candidates = [local_models, gemini_flash]
    elif budget == "standard":
        candidates = [gemini_pro, gpt_4, claude_sonnet]
    else:  # premium
        candidates = [gpt_4_turbo, claude_opus]

    # 2. Filter by task complexity
    if complexity == "complex":
        candidates = filter_complex_capable(candidates)

    # 3. Filter by speed requirement
    if speed == "real_time":
        candidates = filter_fast_models(candidates)

    # 4. Select best model by quality score
    return max(candidates, key=lambda m: m.quality_score)
```

---

## 🤖 Model Catalog & Specifications

### Text Generation Models

#### GPT-4 Turbo (OpenAI)
- **Use Cases**: Complex strategy, high-quality copywriting, multi-step reasoning
- **Strengths**: Excellent reasoning, consistent quality, large context (128K)
- **Weaknesses**: Higher cost, moderate speed
- **Cost**: $10/1M input tokens, $30/1M output tokens
- **Speed**: ~5-10s for 500 token output
- **Context**: 128,000 tokens
- **Quality Score**: 9.5/10

#### GPT-4 (OpenAI)
- **Use Cases**: Standard copywriting, brief generation, analysis
- **Strengths**: Reliable, good quality, well-tested
- **Weaknesses**: Moderate cost and speed
- **Cost**: $30/1M input tokens, $60/1M output tokens
- **Speed**: ~3-7s for 500 token output
- **Context**: 8,000 tokens
- **Quality Score**: 9/10

#### GPT-3.5 Turbo (OpenAI)
- **Use Cases**: Simple tasks, templates, quick responses
- **Strengths**: Fast, affordable
- **Weaknesses**: Lower quality for complex tasks
- **Cost**: $0.50/1M input tokens, $1.50/1M output tokens
- **Speed**: ~1-2s for 500 token output
- **Context**: 16,000 tokens
- **Quality Score**: 7/10

#### Claude 3.5 Sonnet (Anthropic)
- **Use Cases**: High-quality copywriting, creative content, nuanced tone
- **Strengths**: Excellent writing quality, good at following instructions
- **Weaknesses**: Moderate cost
- **Cost**: $3/1M input tokens, $15/1M output tokens
- **Speed**: ~4-8s for 500 token output
- **Context**: 200,000 tokens
- **Quality Score**: 9.5/10

#### Claude 3 Opus (Anthropic)
- **Use Cases**: Premium quality, complex reasoning, long-form content
- **Strengths**: Best-in-class quality, large context
- **Weaknesses**: High cost, slower
- **Cost**: $15/1M input tokens, $75/1M output tokens
- **Speed**: ~8-15s for 500 token output
- **Context**: 200,000 tokens
- **Quality Score**: 10/10

#### Gemini 2.0 Pro (Google)
- **Use Cases**: General purpose, analysis, medium complexity
- **Strengths**: Good quality, competitive pricing, large context
- **Weaknesses**: Less consistent than GPT-4/Claude for some tasks
- **Cost**: $1.25/1M input tokens, $5/1M output tokens
- **Speed**: ~3-6s for 500 token output
- **Context**: 1,000,000 tokens (!)
- **Quality Score**: 8.5/10

#### Gemini 2.0 Flash (Google)
- **Use Cases**: Real-time chat, simple tasks, high-speed processing
- **Strengths**: Very fast, very cheap, large context
- **Weaknesses**: Lower quality for complex tasks
- **Cost**: $0.075/1M input tokens, $0.30/1M output tokens
- **Speed**: ~0.5-1.5s for 500 token output
- **Context**: 1,000,000 tokens
- **Quality Score**: 7.5/10

#### Qwen 2.5 (Local - Ollama)
- **Use Cases**: Simple tasks, templates, cost-sensitive operations
- **Strengths**: Free (local), good for structured tasks
- **Weaknesses**: Lower quality, requires GPU
- **Cost**: $0 (compute only)
- **Speed**: ~2-5s for 500 token output (on RTX 4070 SUPER)
- **Context**: 32,000 tokens
- **Quality Score**: 7/10

#### Llama 3.2 (Local - Ollama)
- **Use Cases**: Multilingual, general purpose, local processing
- **Strengths**: Free, multilingual, good quality for local model
- **Weaknesses**: Requires GPU, slower than cloud models
- **Cost**: $0 (compute only)
- **Speed**: ~3-6s for 500 token output
- **Context**: 8,000 tokens
- **Quality Score**: 7.5/10

#### Mistral 7B (Local - Ollama)
- **Use Cases**: Efficient general purpose, code, local processing
- **Strengths**: Fast for local, good efficiency
- **Weaknesses**: Smaller model, lower quality than cloud
- **Cost**: $0 (compute only)
- **Speed**: ~1-3s for 500 token output
- **Context**: 8,000 tokens
- **Quality Score**: 6.5/10

---

### Vision Models

#### GPT-4V (Vision)
- **Use Cases**: Image analysis, brand kit extraction, quality check
- **Cost**: $10/1M input tokens + $0.01275/image
- **Speed**: ~5-10s per image
- **Quality Score**: 9/10

#### Gemini 2.0 Vision
- **Use Cases**: Image analysis, multi-modal tasks
- **Cost**: $1.25/1M input tokens (includes image)
- **Speed**: ~3-7s per image
- **Quality Score**: 8.5/10

---

### Image Generation Models

#### DALL-E 3 (OpenAI)
- **Use Cases**: High-quality image generation, brand visuals
- **Cost**: $0.040/image (1024x1024), $0.080/image (1792x1024)
- **Speed**: ~10-30s per image
- **Quality Score**: 9/10

#### Stable Diffusion (Local)
- **Use Cases**: Bulk image generation, cost-sensitive projects
- **Cost**: $0 (compute only)
- **Speed**: ~5-15s per image (RTX 4070 SUPER)
- **Quality Score**: 7.5/10

#### NanoBanana (Hypothetical)
- **Use Cases**: Rapid prototyping, simple graphics
- **Cost**: $0.01/image
- **Speed**: ~3-8s per image
- **Quality Score**: 7/10

---

### Embedding Models

#### OpenAI text-embedding-3-small
- **Use Cases**: RAG, semantic search
- **Cost**: $0.00002/1K tokens
- **Dimensions**: 1536
- **Speed**: <100ms for 512 tokens
- **Quality Score**: 9/10

#### OpenAI text-embedding-3-large
- **Use Cases**: High-precision RAG
- **Cost**: $0.00013/1K tokens
- **Dimensions**: 3072
- **Quality Score**: 9.5/10

#### Gemini Embeddings
- **Use Cases**: Multimodal embeddings
- **Cost**: Free (currently)
- **Dimensions**: 768
- **Quality Score**: 8/10

---

## 📊 Task-to-Model Routing Policy

### By Task Type

| Task Type | Complexity | Primary Model | Fallback 1 | Fallback 2 |
|-----------|------------|---------------|------------|------------|
| **Chat Response** | Simple | Gemini Flash | GPT-3.5 Turbo | Qwen 2.5 |
| **Brief Questions** | Medium | GPT-4 | Claude Sonnet | Gemini Pro |
| **Copywriting (Standard)** | Medium | Claude Sonnet | GPT-4 | Gemini Pro |
| **Copywriting (Premium)** | Complex | Claude Opus | GPT-4 Turbo | Claude Sonnet |
| **Strategy Planning** | Complex | GPT-4 Turbo | Claude Opus | GPT-4 |
| **Template Generation** | Simple | Qwen 2.5 | Gemini Flash | GPT-3.5 |
| **Trend Analysis** | Medium | Gemini Pro | GPT-4 | Claude Sonnet |
| **Image Analysis** | Medium | GPT-4V | Gemini Vision | - |
| **Image Generation (Quality)** | - | DALL-E 3 | - | - |
| **Image Generation (Bulk)** | - | Stable Diffusion | DALL-E 3 | - |
| **Code Generation** | Medium | GPT-4 | Qwen Coder | Gemini Pro |
| **Translation** | Simple | Gemini Pro | GPT-3.5 | Llama 3.2 |
| **Embeddings (RAG)** | - | OpenAI text-emb-3-small | Gemini | - |

---

### By Budget Tier

#### Low Budget ($0-$50/month)
- **Primary**: Local models (Qwen, Llama, Mistral), Gemini Flash
- **Occasional**: Gemini Pro (for complex tasks)
- **Avoid**: GPT-4, Claude, DALL-E
- **Expected Quality**: Draft to standard

#### Standard Budget ($50-$200/month)
- **Primary**: Gemini Pro, GPT-4, Claude Sonnet
- **Occasional**: GPT-4 Turbo, DALL-E 3
- **Avoid**: Claude Opus
- **Expected Quality**: Standard to production

#### Premium Budget ($200+/month)
- **Primary**: GPT-4 Turbo, Claude Opus, DALL-E 3
- **No Restrictions**: Use best model for each task
- **Expected Quality**: Production, highest quality

---

### By Speed Requirement

#### Real-time (<3s response)
- Gemini Flash
- GPT-3.5 Turbo
- Mistral 7B (local)

#### Standard (<10s response)
- GPT-4
- Claude Sonnet
- Gemini Pro
- Qwen 2.5 (local)

#### Batch (no time constraint)
- GPT-4 Turbo
- Claude Opus
- Stable Diffusion (bulk images)

---

## 💰 Cost Optimization Strategies

### 1. Caching
- **Strategy**: Cache LLM responses for repeated queries
- **Implementation**: Redis with TTL (24 hours for static content, 1 hour for dynamic)
- **Expected Savings**: 20-30%

**Example**:
```python
cache_key = f"llm:{model}:{hash(prompt)}"
cached_response = redis.get(cache_key)
if cached_response:
    return cached_response
else:
    response = llm.complete(prompt)
    redis.setex(cache_key, ttl=86400, value=response)
    return response
```

### 2. Prompt Optimization
- **Strategy**: Minimize prompt length without sacrificing quality
- **Techniques**:
  - Use concise system prompts
  - Avoid redundant context
  - Use structured formats (JSON) for clarity
- **Expected Savings**: 15-25%

### 3. Model Selection
- **Strategy**: Use cheaper models for simple tasks
- **Implementation**: Router automatically selects based on complexity
- **Expected Savings**: 30-50%

### 4. Batch Processing
- **Strategy**: Batch multiple requests to same model
- **Implementation**: Queue requests, send in batches of 5-10
- **Expected Savings**: 10-15% (reduced overhead)

### 5. Local Models for High-Volume Tasks
- **Strategy**: Use local models (Qwen, Llama) for repetitive, simple tasks
- **Implementation**: Ollama on Desktop (RTX 4070 SUPER)
- **Expected Savings**: 70-90% for applicable tasks

### 6. User Budget Alerts
- **Strategy**: Alert users at 80% budget usage
- **Implementation**: BudgetAgent monitors, sends email/notification
- **Impact**: Prevents overspending, encourages optimization

---

## 📈 Cost Estimation Examples

### Example 1: Brand Analysis
- **Steps**:
  1. Upload logo (1 image)
  2. Analyze logo with GPT-4V: $0.01
  3. Parse brand guide (10 pages, 5K tokens)
  4. Embed with OpenAI: $0.0001
  5. Generate Brand Kit with GPT-4 (500 tokens): $0.03
- **Total**: ~$0.04

### Example 2: SNS Post Set (5 posts)
- **Steps**:
  1. Brief analysis with Gemini Pro (1K tokens): $0.001
  2. Copywriting (5 captions, 500 tokens each) with Claude Sonnet: $0.04
  3. Image generation (5 images) with Stable Diffusion (local): $0
  4. Trend hashtags with Gemini Flash: $0.0001
- **Total**: ~$0.04 (vs $0.24 with DALL-E 3)

### Example 3: Blog Post
- **Steps**:
  1. Outline with GPT-4 (1K tokens): $0.06
  2. Write 2000 words with Claude Sonnet (3K tokens): $0.05
  3. Generate featured image with DALL-E 3: $0.04
  4. SEO optimization with Gemini Pro: $0.01
- **Total**: ~$0.16

### Example 4: 30s Video
- **Steps**:
  1. Scene planning with GPT-4: $0.03
  2. Storyboard (4 frames) with DALL-E 3: $0.16
  3. Script with Gemini Pro: $0.01
  4. Video generation (Sora2, roadmap): ~$1.00 (estimated)
- **Total**: ~$1.20

---

## 🔄 Fallback & Retry Logic

### Fallback Chain
If primary model fails (timeout, API error, rate limit), try fallback models in order.

**Example**: Copywriting task
1. **Primary**: Claude Sonnet
2. **Fallback 1**: GPT-4 (if Claude fails)
3. **Fallback 2**: Gemini Pro (if GPT-4 fails)
4. **Fallback 3**: Qwen 2.5 local (if all cloud models fail)

### Retry Strategy
- **Transient Errors**: Retry 3 times with exponential backoff (1s, 2s, 4s)
- **Rate Limits**: Wait for rate limit reset (header: `Retry-After`)
- **Permanent Errors**: Log and return error to user

---

## 🧪 A/B Testing & Model Evaluation

### Continuous Evaluation
- **Strategy**: Randomly route 5% of requests to alternative models
- **Metrics**: Quality (user feedback), cost, speed
- **Goal**: Identify better models for each task type

### Quality Feedback Loop
- **User Ratings**: Ask users to rate outputs (1-5 stars)
- **Analysis**: Correlate ratings with model used
- **Adjustment**: Update routing policy based on data

---

## 📊 Monitoring & Metrics

### Key Metrics
- **Cost per task type**: Track average cost for each module
- **Cost per user**: Monitor user spending
- **Model usage distribution**: % of requests per model
- **Fallback rate**: How often fallbacks are triggered
- **Quality scores**: User ratings per model

### Dashboards
- Real-time cost monitoring (Grafana)
- Model performance comparison
- User budget tracking
- Alerts for anomalies (sudden cost spike)

---

## 🚀 Implementation (Phase 0)

### Week 1: Router Core
- [ ] Implement `LLMRouter` class
- [ ] Model client wrappers (OpenAI, Gemini, Claude, Ollama)
- [ ] Routing decision logic
- [ ] Fallback and retry logic

### Week 1: Cost Tracking
- [ ] Implement `BudgetAgent`
- [ ] Track usage in `llm_usage` table
- [ ] Calculate costs per request
- [ ] User budget monitoring

### Week 2: Optimization
- [ ] Implement caching (Redis)
- [ ] Prompt optimization templates
- [ ] A/B testing framework
- [ ] Monitoring dashboard

---

## 📚 References

- [OpenAI Pricing](https://openai.com/pricing)
- [Anthropic Pricing](https://www.anthropic.com/pricing)
- [Google Gemini Pricing](https://ai.google.dev/pricing)
- [Ollama Documentation](https://ollama.ai/docs)

---

## 🔄 Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-13 | Initial policy document |

---

**Status**: Active
**Next Review**: Monthly (adjust routing policy based on data)
