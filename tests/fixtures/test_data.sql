-- ============================================
-- Sparklio QA 테스트 픽스처 데이터
-- ============================================
-- 작성일: 2025-11-15
-- 목적: Playwright E2E 테스트용 초기 데이터
-- 참고: docs/A_TEAM_QA_WORK_ORDER.md
-- ============================================

-- 기존 테스트 데이터 삭제
TRUNCATE TABLE concept_tiles CASCADE;
TRUNCATE TABLE concept_boards CASCADE;
TRUNCATE TABLE documents CASCADE;
TRUNCATE TABLE templates CASCADE;
TRUNCATE TABLE brand_visual_styles CASCADE;
TRUNCATE TABLE brands CASCADE;
TRUNCATE TABLE users CASCADE;

-- ============================================
-- 1. 테스트 사용자
-- ============================================

INSERT INTO users (id, email, password_hash, role, name, created_at, updated_at)
VALUES
  (
    'user-test-001',
    'qa@sparklio.ai',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GZy7gY6HqVAm', -- 'testpassword'
    'admin',
    'QA Admin User',
    NOW(),
    NOW()
  ),
  (
    'user-test-002',
    'qa2@sparklio.ai',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GZy7gY6HqVAm', -- 'testpassword'
    'editor',
    'QA Editor User',
    NOW(),
    NOW()
  ),
  (
    'user-test-003',
    'qa-viewer@sparklio.ai',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GZy7gY6HqVAm', -- 'testpassword'
    'viewer',
    'QA Viewer User',
    NOW(),
    NOW()
  );

-- ============================================
-- 2. 테스트 브랜드
-- ============================================

INSERT INTO brands (id, name, primary_color, secondary_color, font_family, owner_id, created_at, updated_at)
VALUES
  (
    'brand-test-001',
    'Test Brand Alpha',
    '#FF6B35',
    '#F7931E',
    'Inter',
    'user-test-001',
    NOW(),
    NOW()
  ),
  (
    'brand-test-002',
    'Test Brand Beta',
    '#4A90E2',
    '#5AB9EA',
    'Roboto',
    'user-test-001',
    NOW(),
    NOW()
  ),
  (
    'brand-test-003',
    'Test Brand Gamma',
    '#2ECC71',
    '#27AE60',
    'Poppins',
    'user-test-002',
    NOW(),
    NOW()
  );

-- ============================================
-- 3. 브랜드 비주얼 스타일 (Concept Board용)
-- ============================================

INSERT INTO brand_visual_styles (id, brand_id, style_name, color_palette, keywords, created_at)
VALUES
  (
    'style-test-001',
    'brand-test-001',
    'Modern Minimalist',
    '["#FF6B35", "#F7931E", "#FFFFFF", "#F5F5F5", "#333333"]'::jsonb,
    '["minimalist", "modern", "clean", "professional"]'::jsonb,
    NOW()
  ),
  (
    'style-test-002',
    'brand-test-002',
    'Tech Startup',
    '["#4A90E2", "#5AB9EA", "#FFFFFF", "#E8F4F8", "#2C3E50"]'::jsonb,
    '["technology", "innovation", "startup", "dynamic"]'::jsonb,
    NOW()
  );

-- ============================================
-- 4. 테스트 템플릿
-- ============================================

-- Concept Board Template
INSERT INTO templates (id, name, template_type, mode, canvas_json, thumbnail_url, is_public, created_by, created_at)
VALUES
  (
    'template-concept-001',
    'Test Concept Board Template',
    'concept_board',
    'concept_board',
    '{
      "version": "1.0",
      "mode": "concept_board",
      "objects": [],
      "viewport": {
        "zoom": 1,
        "x": 0,
        "y": 0
      }
    }'::jsonb,
    'https://cdn.sparklio.ai/templates/concept-001-thumb.jpg',
    true,
    'user-test-001',
    NOW()
  ),

-- Pitch Deck Template
  (
    'template-pitch-001',
    'Test Pitch Deck Template',
    'pitch_deck',
    'pitch_deck',
    '{
      "version": "1.0",
      "mode": "pitch_deck",
      "objects": [
        {
          "id": "obj-title-001",
          "type": "text",
          "name": "Title",
          "text": "Company Name",
          "props": {
            "fontSize": 64,
            "fontFamily": "Inter",
            "fontWeight": "bold",
            "fill": "#FF6B35",
            "left": 100,
            "top": 100
          }
        },
        {
          "id": "obj-subtitle-001",
          "type": "text",
          "name": "Subtitle",
          "text": "Tagline goes here",
          "props": {
            "fontSize": 32,
            "fontFamily": "Inter",
            "fill": "#333333",
            "left": 100,
            "top": 200
          }
        },
        {
          "id": "obj-background-001",
          "type": "rect",
          "name": "Background",
          "props": {
            "fill": "#F5F5F5",
            "width": 1920,
            "height": 1080,
            "left": 0,
            "top": 0
          }
        }
      ],
      "viewport": {
        "zoom": 1,
        "x": 0,
        "y": 0
      }
    }'::jsonb,
    'https://cdn.sparklio.ai/templates/pitch-001-thumb.jpg',
    true,
    'user-test-001',
    NOW()
  ),

-- Product Story Template
  (
    'template-story-001',
    'Test Product Story Template',
    'product_story',
    'product_story',
    '{
      "version": "1.0",
      "mode": "product_story",
      "objects": [
        {
          "id": "obj-header-001",
          "type": "text",
          "name": "Header",
          "text": "Product Story",
          "props": {
            "fontSize": 48,
            "fontFamily": "Poppins",
            "fill": "#2ECC71",
            "left": 50,
            "top": 50
          }
        }
      ],
      "viewport": {
        "zoom": 1,
        "x": 0,
        "y": 0
      }
    }'::jsonb,
    'https://cdn.sparklio.ai/templates/story-001-thumb.jpg',
    true,
    'user-test-001',
    NOW()
  );

-- ============================================
-- 5. 테스트 문서 (픽스처용)
-- ============================================

-- Concept Board 문서
INSERT INTO documents (id, name, document_type, brand_id, owner_id, document_json, status, version, created_at, updated_at)
VALUES
  (
    'doc-concept-fixture-001',
    'Fixture Concept Board',
    'concept_board',
    'brand-test-001',
    'user-test-001',
    '{
      "version": "1.0",
      "mode": "concept_board",
      "objects": [],
      "viewport": {
        "zoom": 1,
        "x": 0,
        "y": 0
      }
    }'::jsonb,
    'draft',
    1,
    NOW(),
    NOW()
  ),

-- Pitch Deck 문서
  (
    'doc-pitch-fixture-001',
    'Fixture Pitch Deck',
    'pitch_deck',
    'brand-test-001',
    'user-test-001',
    '{
      "version": "1.0",
      "mode": "pitch_deck",
      "objects": [
        {
          "id": "obj-text-001",
          "type": "text",
          "name": "Main Title",
          "text": "Welcome",
          "props": {
            "fontSize": 32,
            "fill": "#FF6B35",
            "left": 100,
            "top": 100
          }
        }
      ],
      "viewport": {
        "zoom": 1,
        "x": 0,
        "y": 0
      }
    }'::jsonb,
    'draft',
    1,
    NOW(),
    NOW()
  ),

-- 성능 테스트용 문서 (100개 객체)
  (
    'doc-performance-100-objects',
    'Performance Test - 100 Objects',
    'concept_board',
    'brand-test-001',
    'user-test-001',
    (
      SELECT jsonb_build_object(
        'version', '1.0',
        'mode', 'concept_board',
        'objects', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', 'obj-perf-' || i,
              'type', 'rect',
              'name', 'Rectangle ' || i,
              'props', jsonb_build_object(
                'fill', '#' || lpad(to_hex((i * 1664525 + 1013904223) % 16777216), 6, '0'),
                'width', 80,
                'height', 80,
                'left', (i % 10) * 100,
                'top', (i / 10) * 100
              )
            )
          )
          FROM generate_series(0, 99) AS i
        ),
        'viewport', jsonb_build_object(
          'zoom', 1,
          'x', 0,
          'y', 0
        )
      )
    ),
    'draft',
    1,
    NOW(),
    NOW()
  );

-- ============================================
-- 6. Concept Board 데이터
-- ============================================

INSERT INTO concept_boards (id, brand_id, name, base_prompt, status, owner_id, created_at)
VALUES
  (
    'board-fixture-001',
    'brand-test-001',
    'Fixture Concept Board',
    'Modern minimalist office design with clean lines',
    'draft',
    'user-test-001',
    NOW()
  );

-- Concept Tiles (Mock Provider로 생성된 타일 3개)
INSERT INTO concept_tiles (
  id,
  board_id,
  image_url,
  thumb_url,
  x,
  y,
  width,
  height,
  z_index,
  source_type,
  prompt,
  tags,
  palette,
  created_at
)
VALUES
  (
    'tile-fixture-001',
    'board-fixture-001',
    'https://cdn.sparklio.ai/test/tiles/tile-001.png',
    'https://cdn.sparklio.ai/test/tiles/tile-001-thumb.png',
    100,
    100,
    200,
    200,
    1,
    'mock',
    'minimalist office interior',
    '["minimalist", "office", "interior"]'::jsonb,
    '["#E8D5C4", "#A8DADC", "#F4A261"]'::jsonb,
    NOW()
  ),
  (
    'tile-fixture-002',
    'board-fixture-001',
    'https://cdn.sparklio.ai/test/tiles/tile-002.png',
    'https://cdn.sparklio.ai/test/tiles/tile-002-thumb.png',
    350,
    100,
    200,
    200,
    2,
    'mock',
    'modern workspace',
    '["modern", "workspace"]'::jsonb,
    '["#F5F5DC", "#B0C4DE", "#FFE4B5"]'::jsonb,
    NOW()
  ),
  (
    'tile-fixture-003',
    'board-fixture-001',
    'https://cdn.sparklio.ai/test/tiles/tile-003.png',
    'https://cdn.sparklio.ai/test/tiles/tile-003-thumb.png',
    100,
    350,
    200,
    200,
    3,
    'mock',
    'clean desk setup',
    '["clean", "desk"]'::jsonb,
    '["#FAEBD7", "#D3D3D3", "#F0E68C"]'::jsonb,
    NOW()
  );

-- ============================================
-- 7. 테스트 데이터 검증
-- ============================================

-- 사용자 수 확인
DO $$
DECLARE
  user_count INT;
BEGIN
  SELECT COUNT(*) INTO user_count FROM users WHERE id LIKE 'user-test-%';
  RAISE NOTICE '테스트 사용자 생성: % 명', user_count;
END $$;

-- 브랜드 수 확인
DO $$
DECLARE
  brand_count INT;
BEGIN
  SELECT COUNT(*) INTO brand_count FROM brands WHERE id LIKE 'brand-test-%';
  RAISE NOTICE '테스트 브랜드 생성: % 개', brand_count;
END $$;

-- 템플릿 수 확인
DO $$
DECLARE
  template_count INT;
BEGIN
  SELECT COUNT(*) INTO template_count FROM templates WHERE id LIKE 'template-%';
  RAISE NOTICE '테스트 템플릿 생성: % 개', template_count;
END $$;

-- 문서 수 확인
DO $$
DECLARE
  doc_count INT;
BEGIN
  SELECT COUNT(*) INTO doc_count FROM documents WHERE id LIKE 'doc-%fixture%';
  RAISE NOTICE '테스트 문서 생성: % 개', doc_count;
END $$;

-- Concept Tile 수 확인
DO $$
DECLARE
  tile_count INT;
BEGIN
  SELECT COUNT(*) INTO tile_count FROM concept_tiles WHERE id LIKE 'tile-fixture-%';
  RAISE NOTICE '테스트 타일 생성: % 개', tile_count;
END $$;

-- ============================================
-- 완료
-- ============================================

RAISE NOTICE '=========================================';
RAISE NOTICE '✅ 테스트 픽스처 데이터 초기화 완료';
RAISE NOTICE '=========================================';
