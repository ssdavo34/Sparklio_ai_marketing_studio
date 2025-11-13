# Sparklio – Data Pipeline & RAG System Plan

**Version:** 1.0
**Date:** 2025-11-13
**Status:** Design Approved
**Phase:** 0 (Foundation)

---

## 📋 Overview

This document outlines the data pipeline architecture for Sparklio, focusing on:
1. **Resource Collection**: File uploads, parsing, and metadata extraction
2. **RAG (Retrieval-Augmented Generation)**: Embedding, indexing, and semantic search
3. **Data Flow**: End-to-end data processing from upload to agent context
4. **Storage Strategy**: Database, object storage, and vector storage

---

## 🎯 Objectives

### Primary Goals
1. Enable users to upload brand materials (PDFs, PPTs, DOCX, images) for AI analysis
2. Extract and index content for semantic search (RAG)
3. Provide relevant context to agents for content generation
4. Maintain brand knowledge across all modules

### Success Criteria
- Support 15+ file formats
- Index 100MB file in < 2 minutes
- Search latency < 500ms
- Relevance score > 85%

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     User Upload Interface                   │
│              (Drag & Drop, File Picker, URL)                │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Upload API (FastAPI)                     │
│  - Validate file type, size                                 │
│  - Generate presigned S3 URL                                │
│  - Upload to MinIO/S3                                       │
│  - Create resource record                                   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              DataCollectorAgent (Celery Task)               │
│  - Download file from S3                                    │
│  - Parse file (PDF, PPT, DOCX, images)                      │
│  - Extract text, images, metadata                           │
│  - Chunk text into segments                                 │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    RAGAgent (Celery Task)                   │
│  - Generate embeddings (OpenAI, Gemini)                     │
│  - Store embeddings in pgvector                             │
│  - Index for similarity search                              │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│               PostgreSQL (pgvector storage)                 │
│  - resources table (metadata)                               │
│  - embeddings table (vectors + text chunks)                 │
│  - IVFFlat index for fast similarity search                 │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Semantic Search API                        │
│  - Query: "brand tone and voice"                            │
│  - Embed query → similarity search                          │
│  - Return top K relevant chunks                             │
│  - Provide to agents as context                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Data Flow Stages

### Stage 1: File Upload

#### 1.1 Client Upload
**Process**:
1. User selects file(s) via drag-and-drop or file picker
2. Frontend validates file type and size (client-side)
3. Frontend calls `POST /api/v1/resources/upload-url` to get presigned URL
4. Frontend uploads directly to S3 using presigned URL
5. Frontend calls `POST /api/v1/resources/confirm` to confirm upload

**API Endpoints**:
```python
@router.post("/upload-url")
async def get_upload_url(
    file_name: str,
    file_type: str,
    file_size: int,
    user_id: UUID
) -> UploadURLResponse:
    """
    Generate presigned S3 URL for client upload
    """
    # Validate file type and size
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(400, "File too large")

    # Generate S3 key
    s3_key = f"uploads/{user_id}/{uuid4()}/{file_name}"

    # Generate presigned URL (valid for 15 minutes)
    presigned_url = s3_client.generate_presigned_post(
        Bucket="sparklio-uploads",
        Key=s3_key,
        ExpiresIn=900
    )

    return UploadURLResponse(
        upload_url=presigned_url['url'],
        fields=presigned_url['fields'],
        s3_key=s3_key
    )

@router.post("/confirm")
async def confirm_upload(
    s3_key: str,
    file_name: str,
    file_type: str,
    file_size: int,
    user_id: UUID,
    brand_id: Optional[UUID] = None
) -> ResourceResponse:
    """
    Confirm file upload and trigger processing
    """
    # Create resource record
    resource = Resource(
        id=uuid4(),
        user_id=user_id,
        brand_id=brand_id,
        file_name=file_name,
        file_type=file_type,
        file_url=f"s3://sparklio-uploads/{s3_key}",
        file_size=file_size,
        status="uploaded",
        created_at=datetime.now()
    )
    db.add(resource)
    db.commit()

    # Trigger DataCollectorAgent asynchronously
    data_collector_agent.apply_async(
        args=[resource.id],
        queue="default"
    )

    return ResourceResponse.from_orm(resource)
```

#### 1.2 Supported File Types

| Category | Formats | Parser |
|----------|---------|--------|
| **Documents** | PDF | PyPDF2, pdfplumber |
| | DOCX | python-docx |
| | TXT | built-in |
| | MD | built-in |
| **Presentations** | PPTX | python-pptx |
| **Spreadsheets** | XLSX, CSV | pandas |
| **Images** | PNG, JPG, WEBP | PIL, OpenCV |
| | SVG | svglib |
| **Archives** | ZIP | zipfile |

#### 1.3 File Size Limits
- **Per File**: 100 MB (MVP), 500 MB (roadmap)
- **Total per User**: 5 GB (free), 50 GB (premium)

---

### Stage 2: Parsing & Extraction

#### 2.1 DataCollectorAgent

**Responsibilities**:
- Download file from S3
- Detect file type (MIME type + extension)
- Route to appropriate parser
- Extract text, images, metadata
- Chunk text for embedding
- Store parsed data

**Implementation**:
```python
class DataCollectorAgent:
    def process_file(self, resource_id: UUID):
        # 1. Load resource from DB
        resource = db.query(Resource).get(resource_id)

        # 2. Download file from S3
        file_path = self.download_from_s3(resource.file_url)

        # 3. Detect file type
        file_type = self.detect_file_type(file_path)

        # 4. Parse based on type
        if file_type == "pdf":
            parsed_data = self.parse_pdf(file_path)
        elif file_type == "docx":
            parsed_data = self.parse_docx(file_path)
        elif file_type == "pptx":
            parsed_data = self.parse_pptx(file_path)
        elif file_type in ["png", "jpg", "webp"]:
            parsed_data = self.parse_image(file_path)
        else:
            raise UnsupportedFileType(file_type)

        # 5. Extract text chunks
        chunks = self.chunk_text(parsed_data['text'])

        # 6. Store parsed data
        resource.metadata = {
            "pages": parsed_data.get('pages'),
            "images_extracted": len(parsed_data.get('images', [])),
            "chunks": len(chunks)
        }
        resource.status = "parsed"
        db.commit()

        # 7. Trigger RAGAgent for embedding
        rag_agent.apply_async(
            args=[resource_id, chunks],
            queue="default"
        )
```

#### 2.2 PDF Parsing
**Libraries**: PyPDF2, pdfplumber

**Process**:
1. Extract text page by page
2. Extract images (if any)
3. Preserve formatting (headings, lists)
4. Extract metadata (author, title, creation date)

**Example**:
```python
def parse_pdf(self, file_path: str) -> dict:
    import pdfplumber

    chunks = []
    images = []

    with pdfplumber.open(file_path) as pdf:
        for page_num, page in enumerate(pdf.pages):
            # Extract text
            text = page.extract_text()
            chunks.append({
                "page": page_num + 1,
                "text": text
            })

            # Extract images
            for img in page.images:
                images.append({
                    "page": page_num + 1,
                    "bbox": img['bbox']
                })

    return {
        "text": "\n\n".join([c['text'] for c in chunks]),
        "pages": len(pdf.pages),
        "images": images,
        "chunks": chunks
    }
```

#### 2.3 DOCX Parsing
**Library**: python-docx

**Process**:
1. Extract paragraphs
2. Preserve headings and styles
3. Extract images
4. Extract tables (if any)

#### 2.4 PPTX Parsing
**Library**: python-pptx

**Process**:
1. Extract text from each slide
2. Extract images
3. Preserve slide structure
4. Extract speaker notes

#### 2.5 Image Parsing
**Libraries**: PIL, OpenCV, Tesseract (OCR)

**Process**:
1. Resize/optimize image
2. OCR text extraction (if text present)
3. Send to VisionAnalyzerAgent for visual analysis
4. Extract colors, objects, style

#### 2.6 Text Chunking Strategy

**Chunking Method**: Sliding window with overlap

**Parameters**:
- **Chunk Size**: 512 tokens (~400 words)
- **Overlap**: 50 tokens (~40 words)
- **Splitter**: Sentence boundaries (using spaCy or nltk)

**Rationale**:
- 512 tokens is optimal for embedding models (OpenAI limit: 8191)
- Overlap ensures context continuity
- Sentence boundaries preserve semantic coherence

**Example**:
```python
def chunk_text(self, text: str, chunk_size: int = 512, overlap: int = 50) -> list:
    import tiktoken

    enc = tiktoken.get_encoding("cl100k_base")
    tokens = enc.encode(text)

    chunks = []
    start = 0

    while start < len(tokens):
        end = start + chunk_size
        chunk_tokens = tokens[start:end]
        chunk_text = enc.decode(chunk_tokens)

        chunks.append({
            "text": chunk_text,
            "start_token": start,
            "end_token": end,
            "token_count": len(chunk_tokens)
        })

        start += (chunk_size - overlap)

    return chunks
```

---

### Stage 3: Embedding & Indexing

#### 3.1 RAGAgent

**Responsibilities**:
- Generate embeddings for text chunks
- Store embeddings in pgvector
- Create vector index for similarity search

**Implementation**:
```python
class RAGAgent:
    def embed_chunks(self, resource_id: UUID, chunks: list):
        # 1. Load resource
        resource = db.query(Resource).get(resource_id)

        # 2. Generate embeddings (batch processing)
        embeddings = []
        batch_size = 100

        for i in range(0, len(chunks), batch_size):
            batch = chunks[i:i+batch_size]
            texts = [c['text'] for c in batch]

            # Call OpenAI Embeddings API
            response = openai.embeddings.create(
                model="text-embedding-3-small",
                input=texts
            )

            for j, embedding in enumerate(response.data):
                embeddings.append({
                    "resource_id": resource_id,
                    "chunk_text": batch[j]['text'],
                    "chunk_index": i + j,
                    "embedding": embedding.embedding,
                    "token_count": batch[j]['token_count'],
                    "metadata": {
                        "file_name": resource.file_name,
                        "start_token": batch[j]['start_token']
                    }
                })

        # 3. Store in database
        for emb_data in embeddings:
            embedding_record = Embedding(
                id=uuid4(),
                resource_id=resource_id,
                chunk_text=emb_data['chunk_text'],
                chunk_index=emb_data['chunk_index'],
                embedding=emb_data['embedding'],
                metadata=emb_data['metadata'],
                created_at=datetime.now()
            )
            db.add(embedding_record)

        db.commit()

        # 4. Update resource status
        resource.status = "indexed"
        db.commit()
```

#### 3.2 Embedding Model

**Model**: OpenAI `text-embedding-3-small`
- **Dimensions**: 1536
- **Cost**: $0.00002 per 1K tokens
- **Speed**: <100ms for 512 tokens

**Fallback**: Google Gemini embeddings (free, 768 dimensions)

#### 3.3 Vector Storage (pgvector)

**Table Schema**:
```sql
CREATE TABLE embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    embedding vector(1536) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create IVFFlat index for fast similarity search
CREATE INDEX ON embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

**Index Strategy**:
- **IVFFlat**: Fast approximate nearest neighbor search
- **Lists**: 100 (for ~10K-100K vectors)
- **Distance Metric**: Cosine similarity

---

### Stage 4: Semantic Search

#### 4.1 Search API

**Endpoint**: `POST /api/v1/resources/search`

**Request**:
```json
{
  "query": "brand tone and voice guidelines",
  "user_id": "uuid",
  "brand_id": "uuid",  // optional, filter by brand
  "top_k": 5,
  "threshold": 0.7  // minimum similarity score
}
```

**Response**:
```json
{
  "results": [
    {
      "chunk_text": "Our brand voice is friendly, approachable...",
      "resource_id": "uuid",
      "file_name": "brand_guide.pdf",
      "similarity_score": 0.94,
      "metadata": {
        "page": 3,
        "start_token": 512
      }
    },
    ...
  ],
  "query_time_ms": 120
}
```

**Implementation**:
```python
@router.post("/search")
async def semantic_search(
    query: str,
    user_id: UUID,
    brand_id: Optional[UUID] = None,
    top_k: int = 5,
    threshold: float = 0.7
) -> SearchResponse:
    # 1. Embed query
    query_embedding = openai.embeddings.create(
        model="text-embedding-3-small",
        input=query
    ).data[0].embedding

    # 2. Similarity search in pgvector
    sql = """
    SELECT
        e.id,
        e.chunk_text,
        e.resource_id,
        r.file_name,
        e.metadata,
        1 - (e.embedding <=> %s::vector) AS similarity
    FROM embeddings e
    JOIN resources r ON e.resource_id = r.id
    WHERE r.user_id = %s
    """

    params = [query_embedding, user_id]

    if brand_id:
        sql += " AND r.brand_id = %s"
        params.append(brand_id)

    sql += """
    AND 1 - (e.embedding <=> %s::vector) >= %s
    ORDER BY similarity DESC
    LIMIT %s
    """
    params.extend([query_embedding, threshold, top_k])

    results = db.execute(sql, params).fetchall()

    return SearchResponse(
        results=[
            SearchResult(
                chunk_text=r.chunk_text,
                resource_id=r.resource_id,
                file_name=r.file_name,
                similarity_score=r.similarity,
                metadata=r.metadata
            )
            for r in results
        ],
        query_time_ms=...
    )
```

#### 4.2 Context Retrieval for Agents

**Use Case**: Provide relevant context to CopywriterAgent

**Example**:
```python
# In CopywriterAgent
def write_headline(self, product_name: str, brand_id: UUID):
    # 1. Retrieve brand context via RAG
    context = rag_agent.search(
        query="brand tone, voice, key messages",
        brand_id=brand_id,
        top_k=3
    )

    # 2. Build prompt with context
    prompt = f"""
    Brand Context:
    {context['results'][0]['chunk_text']}
    {context['results'][1]['chunk_text']}

    Task: Write a compelling headline for {product_name} that aligns with the brand voice.
    """

    # 3. Call LLM
    response = llm_router.complete(
        prompt=prompt,
        task_type="copywriting",
        complexity="medium"
    )

    return response
```

---

## 📊 Database Schema

### resources Table
```sql
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_url TEXT NOT NULL,  -- S3 URL
    file_size INTEGER NOT NULL,  -- bytes
    status VARCHAR(50) DEFAULT 'uploaded',  -- uploaded, parsing, parsed, indexed, error
    metadata JSONB,  -- pages, images_extracted, chunks, etc.
    error TEXT,  -- error message if processing failed
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_resources_user_id ON resources(user_id);
CREATE INDEX idx_resources_brand_id ON resources(brand_id);
CREATE INDEX idx_resources_status ON resources(status);
```

### embeddings Table
```sql
CREATE TABLE embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    embedding vector(1536) NOT NULL,
    metadata JSONB,  -- file_name, page, start_token, etc.
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_embeddings_resource_id ON embeddings(resource_id);
CREATE INDEX idx_embeddings_vector ON embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

---

## 🚀 Performance Optimization

### 1. Parallel Processing
- Process multiple files concurrently (Celery workers)
- Batch embed chunks (100 at a time)

### 2. Caching
- Cache search results (Redis, TTL: 1 hour)
- Cache embeddings for repeated queries

### 3. Indexing
- Use IVFFlat index for fast vector search
- Adjust `lists` parameter based on dataset size

### 4. Cost Optimization
- Use local models for simple parsing (no API cost)
- Batch embeddings to reduce API calls
- Use Gemini embeddings as free fallback

---

## 🧪 Testing Plan

### Unit Tests
- File parsing (PDF, DOCX, PPTX, images)
- Text chunking
- Embedding generation
- Similarity search

### Integration Tests
- End-to-end: Upload → Parse → Embed → Search
- Multi-file processing
- Error handling (corrupt files, API failures)

### Performance Tests
- Index 10K chunks, measure search latency
- Test concurrent uploads (10 files simultaneously)

---

## 📈 Monitoring & Metrics

### Key Metrics
- **Processing Time**: Upload → Indexed (target: <2 min for 100MB)
- **Search Latency**: Query → Results (target: <500ms)
- **Relevance Score**: Average similarity score (target: >0.85)
- **Error Rate**: % of failed processing (target: <1%)

### Alerts
- Processing time >5 min
- Search latency >1s
- Error rate >5%

---

## 🔄 Roadmap

### Phase 0 (MVP)
- [x] Upload API
- [ ] DataCollectorAgent (PDF, DOCX, TXT)
- [ ] RAGAgent (OpenAI embeddings)
- [ ] Semantic search API
- [ ] Basic frontend (upload, search)

### Phase 1
- [ ] Support more formats (PPTX, XLSX, images)
- [ ] OCR for images (Tesseract)
- [ ] Optimize chunking strategy
- [ ] Caching layer

### Phase 2
- [ ] Web scraping (URL upload)
- [ ] Email integration (parse attachments)
- [ ] Advanced search (filters, facets)
- [ ] Hybrid search (keyword + semantic)

---

**Status**: Ready for Implementation
**Next Review**: End of Week 2 (Day 10)
