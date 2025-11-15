# Concept Board - B팀 (Backend) 작업 지시서

## 📋 Phase 1: Mock Provider 기반 MVP

### 목표
Mock ImageProvider를 사용하여 Concept Board의 핵심 백엔드 기능을 구현합니다. Real AI 연동 전에 전체 데이터 플로우와 비즈니스 로직을 검증합니다.

---

## 1. 데이터베이스 스키마 설계 및 마이그레이션

### 1.1 Prisma Schema 정의

**파일**: `prisma/schema.prisma`

```prisma
// ConceptBoard 모델
model ConceptBoard {
  id        String   @id @default(uuid())
  brandId   String
  prompt    String   @db.Text
  tiles     ConceptTile[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  brand     Brand    @relation(fields: [brandId], references: [id], onDelete: Cascade)
  visualStyles BrandVisualStyle[]

  @@index([brandId])
  @@index([createdAt])
}

// ConceptTile 모델
model ConceptTile {
  id              String   @id @default(uuid())
  conceptBoardId  String
  position        Int      // 0-8 (3x3 grid)
  imageUrl        String
  thumbnailUrl    String
  isSelected      Boolean  @default(false)
  metadata        Json?    // { width, height, format, size }
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  conceptBoard    ConceptBoard @relation(fields: [conceptBoardId], references: [id], onDelete: Cascade)

  @@index([conceptBoardId])
  @@index([isSelected])
}

// BrandVisualStyle 모델
model BrandVisualStyle {
  id              String   @id @default(uuid())
  brandId         String
  conceptBoardId  String
  colorPalette    Json     // { primary: [], secondary: [], accent: [] }
  toneAndManner   Json     // { mood: [], style: [], atmosphere: "" }
  visualKeywords  String[] // ["minimalist", "modern", ...]
  selectedTileIds String[] // 선택된 타일 ID 배열
  createdAt       DateTime @default(now())

  brand           Brand        @relation(fields: [brandId], references: [id], onDelete: Cascade)
  conceptBoard    ConceptBoard @relation(fields: [conceptBoardId], references: [id], onDelete: Cascade)

  @@index([brandId])
  @@index([conceptBoardId])
}
```

### 1.2 마이그레이션 실행

```bash
# 마이그레이션 생성
npx prisma migrate dev --name add_concept_board_models

# Prisma Client 재생성
npx prisma generate
```

### 1.3 검증 체크리스트
- [ ] schema.prisma에 3개 모델 추가 완료
- [ ] Brand 모델에 relations 추가 확인
- [ ] 마이그레이션 파일 생성 확인
- [ ] Prisma Client 타입 정의 업데이트 확인

---

## 2. Mock ImageProvider 구현

### 2.1 ImageProvider 인터페이스 정의

**파일**: `src/services/image/ImageProvider.interface.ts`

```typescript
export interface ImageGenerationOptions {
  prompt: string;
  count: number;        // 생성할 이미지 개수
  width?: number;       // 기본: 1024
  height?: number;      // 기본: 1024
}

export interface GeneratedImage {
  url: string;          // 원본 이미지 URL
  width: number;
  height: number;
  format: string;       // "jpg", "png", etc.
}

export interface ImageProvider {
  /**
   * 프롬프트 기반 이미지 생성
   */
  generateImages(options: ImageGenerationOptions): Promise<GeneratedImage[]>;

  /**
   * Provider 이름
   */
  getName(): string;
}
```

### 2.2 Mock ImageProvider 구현

**파일**: `src/services/image/MockImageProvider.ts`

```typescript
import { ImageProvider, ImageGenerationOptions, GeneratedImage } from './ImageProvider.interface';
import axios from 'axios';

/**
 * Phase 1용 Mock Provider
 * Unsplash API를 사용하여 랜덤 이미지 제공
 */
export class MockImageProvider implements ImageProvider {
  private readonly UNSPLASH_API_URL = 'https://api.unsplash.com';
  private readonly ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

  constructor() {
    if (!this.ACCESS_KEY) {
      console.warn('[MockImageProvider] UNSPLASH_ACCESS_KEY not set. Using random URLs.');
    }
  }

  async generateImages(options: ImageGenerationOptions): Promise<GeneratedImage[]> {
    const { prompt, count, width = 1024, height = 1024 } = options;

    console.log(`[MockImageProvider] Generating ${count} images for: "${prompt}"`);

    const images: GeneratedImage[] = [];

    for (let i = 0; i < count; i++) {
      try {
        // Unsplash에서 프롬프트 기반 랜덤 이미지 가져오기
        const image = await this.fetchUnsplashImage(prompt, width, height);
        images.push(image);
      } catch (error) {
        console.error(`[MockImageProvider] Failed to fetch image ${i + 1}:`, error);
        // Fallback: Placeholder 이미지
        images.push(this.getFallbackImage(width, height, i));
      }
    }

    return images;
  }

  private async fetchUnsplashImage(query: string, width: number, height: number): Promise<GeneratedImage> {
    if (!this.ACCESS_KEY) {
      return this.getFallbackImage(width, height);
    }

    const response = await axios.get(`${this.UNSPLASH_API_URL}/photos/random`, {
      params: {
        query: query,
        w: width,
        h: height,
        orientation: 'squarish'
      },
      headers: {
        'Authorization': `Client-ID ${this.ACCESS_KEY}`
      }
    });

    const photo = response.data;

    return {
      url: photo.urls.regular,
      width: photo.width,
      height: photo.height,
      format: 'jpg'
    };
  }

  private getFallbackImage(width: number, height: number, index: number = 0): GeneratedImage {
    // Placeholder.com 사용
    const seed = Date.now() + index;
    return {
      url: `https://picsum.photos/seed/${seed}/${width}/${height}`,
      width,
      height,
      format: 'jpg'
    };
  }

  getName(): string {
    return 'MockImageProvider (Unsplash)';
  }
}
```

### 2.3 ImageProvider Factory

**파일**: `src/services/image/ImageProviderFactory.ts`

```typescript
import { ImageProvider } from './ImageProvider.interface';
import { MockImageProvider } from './MockImageProvider';

export class ImageProviderFactory {
  static create(): ImageProvider {
    const provider = process.env.IMAGE_PROVIDER || 'mock';

    switch (provider) {
      case 'mock':
        return new MockImageProvider();
      // Phase 2에서 추가:
      // case 'dalle':
      //   return new DalleImageProvider();
      // case 'midjourney':
      //   return new MidjourneyImageProvider();
      default:
        console.warn(`Unknown IMAGE_PROVIDER: ${provider}. Using mock.`);
        return new MockImageProvider();
    }
  }
}
```

### 2.4 검증 체크리스트
- [ ] ImageProvider 인터페이스 정의 완료
- [ ] MockImageProvider 구현 완료
- [ ] Unsplash API 키 .env에 설정 (선택사항)
- [ ] ImageProviderFactory 구현 완료
- [ ] 이미지 생성 테스트 (9개) 성공

---

## 3. 이미지 처리 파이프라인

### 3.1 이미지 저장 및 썸네일 생성

**파일**: `src/services/image/ImageProcessor.ts`

```typescript
import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import axios from 'axios';

export interface ProcessedImage {
  originalUrl: string;      // S3 URL
  thumbnailUrl: string;     // S3 URL (200x200)
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;           // bytes
  };
}

export class ImageProcessor {
  private s3Client: S3Client;
  private bucketName: string;
  private cdnDomain: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'ap-northeast-2',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    });
    this.bucketName = process.env.S3_BUCKET_NAME || 'sparklio-concept-boards';
    this.cdnDomain = process.env.CDN_DOMAIN || `https://${this.bucketName}.s3.amazonaws.com`;
  }

  /**
   * 이미지 다운로드 -> 저장 -> 썸네일 생성
   */
  async processImage(imageUrl: string, conceptBoardId: string, position: number): Promise<ProcessedImage> {
    // 1. 이미지 다운로드
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(response.data);

    // 2. 이미지 메타데이터 추출
    const metadata = await sharp(imageBuffer).metadata();

    // 3. 원본 이미지 최적화 및 저장 (최대 2048x2048)
    const optimizedBuffer = await sharp(imageBuffer)
      .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();

    const originalKey = `concept-boards/${conceptBoardId}/tile-${position}-${uuidv4()}.jpg`;
    await this.uploadToS3(originalKey, optimizedBuffer, 'image/jpeg');
    const originalUrl = `${this.cdnDomain}/${originalKey}`;

    // 4. 썸네일 생성 및 저장 (200x200)
    const thumbnailBuffer = await sharp(imageBuffer)
      .resize(200, 200, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();

    const thumbnailKey = `concept-boards/${conceptBoardId}/thumb-${position}-${uuidv4()}.jpg`;
    await this.uploadToS3(thumbnailKey, thumbnailBuffer, 'image/jpeg');
    const thumbnailUrl = `${this.cdnDomain}/${thumbnailKey}`;

    return {
      originalUrl,
      thumbnailUrl,
      metadata: {
        width: metadata.width || 1024,
        height: metadata.height || 1024,
        format: 'jpeg',
        size: optimizedBuffer.length
      }
    };
  }

  private async uploadToS3(key: string, buffer: Buffer, contentType: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000' // 1년 캐싱
    });

    await this.s3Client.send(command);
  }
}
```

### 3.2 색상 팔레트 추출

**파일**: `src/services/image/ColorExtractor.ts`

```typescript
import Vibrant from 'node-vibrant';
import axios from 'axios';

export interface ColorPalette {
  primary: string[];      // 주색상 (2-3개)
  secondary: string[];    // 보조색상 (2-3개)
  accent: string[];       // 강조색상 (1-2개)
}

export class ColorExtractor {
  /**
   * 여러 이미지에서 통합 색상 팔레트 추출
   */
  async extractPaletteFromImages(imageUrls: string[]): Promise<ColorPalette> {
    const allColors: string[] = [];

    for (const url of imageUrls) {
      try {
        const colors = await this.extractColorsFromImage(url);
        allColors.push(...colors);
      } catch (error) {
        console.error(`[ColorExtractor] Failed to extract from ${url}:`, error);
      }
    }

    // 색상 빈도수 계산 및 상위 색상 선택
    const colorFrequency = this.getColorFrequency(allColors);
    const topColors = this.getTopColors(colorFrequency, 7);

    // Primary, Secondary, Accent로 분류
    return {
      primary: topColors.slice(0, 3),
      secondary: topColors.slice(3, 5),
      accent: topColors.slice(5, 7)
    };
  }

  private async extractColorsFromImage(imageUrl: string): Promise<string[]> {
    const palette = await Vibrant.from(imageUrl).getPalette();

    const colors: string[] = [];
    if (palette.Vibrant) colors.push(palette.Vibrant.hex);
    if (palette.DarkVibrant) colors.push(palette.DarkVibrant.hex);
    if (palette.LightVibrant) colors.push(palette.LightVibrant.hex);
    if (palette.Muted) colors.push(palette.Muted.hex);
    if (palette.DarkMuted) colors.push(palette.DarkMuted.hex);
    if (palette.LightMuted) colors.push(palette.LightMuted.hex);

    return colors;
  }

  private getColorFrequency(colors: string[]): Map<string, number> {
    const frequency = new Map<string, number>();

    colors.forEach(color => {
      frequency.set(color, (frequency.get(color) || 0) + 1);
    });

    return frequency;
  }

  private getTopColors(frequency: Map<string, number>, limit: number): string[] {
    return Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([color]) => color);
  }
}
```

### 3.3 검증 체크리스트
- [ ] Sharp 라이브러리 설치 및 테스트
- [ ] S3 버킷 생성 및 권한 설정
- [ ] 이미지 업로드 테스트 (원본 + 썸네일)
- [ ] node-vibrant 설치 및 색상 추출 테스트
- [ ] ColorExtractor 로직 검증

---

## 4. API 엔드포인트 구현

### 4.1 POST /api/brands/:brandId/concept-boards

**파일**: `src/routes/concept-boards.routes.ts`

```typescript
import { Router } from 'express';
import { ConceptBoardController } from '../controllers/ConceptBoardController';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateBrandAccess } from '../middleware/brand-access.middleware';

const router = Router();
const controller = new ConceptBoardController();

// 컨셉 보드 생성
router.post(
  '/brands/:brandId/concept-boards',
  authenticateToken,
  validateBrandAccess,
  controller.createConceptBoard
);

// 컨셉 보드 조회
router.get(
  '/brands/:brandId/concept-boards/:boardId',
  authenticateToken,
  validateBrandAccess,
  controller.getConceptBoard
);

// 타일 선택 상태 업데이트
router.patch(
  '/concept-boards/:boardId/tiles/:tileId',
  authenticateToken,
  controller.updateTileSelection
);

// Brand Visual Style 생성
router.post(
  '/brands/:brandId/visual-styles',
  authenticateToken,
  validateBrandAccess,
  controller.createVisualStyle
);

export default router;
```

### 4.2 ConceptBoardController 구현

**파일**: `src/controllers/ConceptBoardController.ts`

```typescript
import { Request, Response } from 'express';
import { ConceptBoardService } from '../services/ConceptBoardService';
import { z } from 'zod';

// 요청 검증 스키마
const CreateConceptBoardSchema = z.object({
  prompt: z.string().min(10).max(500)
});

const UpdateTileSelectionSchema = z.object({
  isSelected: z.boolean()
});

const CreateVisualStyleSchema = z.object({
  conceptBoardId: z.string().uuid(),
  selectedTileIds: z.array(z.string().uuid()).min(1).max(9)
});

export class ConceptBoardController {
  private service: ConceptBoardService;

  constructor() {
    this.service = new ConceptBoardService();
  }

  /**
   * POST /api/brands/:brandId/concept-boards
   */
  createConceptBoard = async (req: Request, res: Response) => {
    try {
      const { brandId } = req.params;
      const { prompt } = CreateConceptBoardSchema.parse(req.body);

      console.log(`[ConceptBoardController] Creating board for brand ${brandId}`);

      const conceptBoard = await this.service.createConceptBoard(brandId, prompt);

      return res.status(201).json(conceptBoard);
    } catch (error) {
      console.error('[ConceptBoardController] Create failed:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request', details: error.errors });
      }

      return res.status(500).json({ error: 'Failed to create concept board' });
    }
  };

  /**
   * GET /api/brands/:brandId/concept-boards/:boardId
   */
  getConceptBoard = async (req: Request, res: Response) => {
    try {
      const { brandId, boardId } = req.params;

      const conceptBoard = await this.service.getConceptBoard(boardId, brandId);

      if (!conceptBoard) {
        return res.status(404).json({ error: 'Concept board not found' });
      }

      return res.status(200).json(conceptBoard);
    } catch (error) {
      console.error('[ConceptBoardController] Get failed:', error);
      return res.status(500).json({ error: 'Failed to get concept board' });
    }
  };

  /**
   * PATCH /api/concept-boards/:boardId/tiles/:tileId
   */
  updateTileSelection = async (req: Request, res: Response) => {
    try {
      const { tileId } = req.params;
      const { isSelected } = UpdateTileSelectionSchema.parse(req.body);

      const updatedTile = await this.service.updateTileSelection(tileId, isSelected);

      if (!updatedTile) {
        return res.status(404).json({ error: 'Tile not found' });
      }

      return res.status(200).json(updatedTile);
    } catch (error) {
      console.error('[ConceptBoardController] Update tile failed:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request', details: error.errors });
      }

      return res.status(500).json({ error: 'Failed to update tile' });
    }
  };

  /**
   * POST /api/brands/:brandId/visual-styles
   */
  createVisualStyle = async (req: Request, res: Response) => {
    try {
      const { brandId } = req.params;
      const { conceptBoardId, selectedTileIds } = CreateVisualStyleSchema.parse(req.body);

      const visualStyle = await this.service.createVisualStyle(
        brandId,
        conceptBoardId,
        selectedTileIds
      );

      return res.status(201).json(visualStyle);
    } catch (error) {
      console.error('[ConceptBoardController] Create visual style failed:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request', details: error.errors });
      }

      return res.status(500).json({ error: 'Failed to create visual style' });
    }
  };
}
```

### 4.3 ConceptBoardService 구현

**파일**: `src/services/ConceptBoardService.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { ImageProviderFactory } from './image/ImageProviderFactory';
import { ImageProcessor } from './image/ImageProcessor';
import { ColorExtractor } from './image/ColorExtractor';

const prisma = new PrismaClient();

export class ConceptBoardService {
  private imageProvider = ImageProviderFactory.create();
  private imageProcessor = new ImageProcessor();
  private colorExtractor = new ColorExtractor();

  /**
   * 컨셉 보드 생성
   */
  async createConceptBoard(brandId: string, prompt: string) {
    console.log(`[ConceptBoardService] Generating 9 images...`);

    // 1. AI 이미지 생성 (9개)
    const generatedImages = await this.imageProvider.generateImages({
      prompt,
      count: 9,
      width: 1024,
      height: 1024
    });

    // 2. 컨셉 보드 생성
    const conceptBoard = await prisma.conceptBoard.create({
      data: {
        brandId,
        prompt
      }
    });

    console.log(`[ConceptBoardService] Processing and saving 9 images...`);

    // 3. 이미지 처리 및 타일 생성 (병렬 처리)
    const tilePromises = generatedImages.map(async (image, index) => {
      const processed = await this.imageProcessor.processImage(
        image.url,
        conceptBoard.id,
        index
      );

      return prisma.conceptTile.create({
        data: {
          conceptBoardId: conceptBoard.id,
          position: index,
          imageUrl: processed.originalUrl,
          thumbnailUrl: processed.thumbnailUrl,
          isSelected: false,
          metadata: processed.metadata
        }
      });
    });

    const tiles = await Promise.all(tilePromises);

    console.log(`[ConceptBoardService] Concept board created: ${conceptBoard.id}`);

    return {
      ...conceptBoard,
      tiles
    };
  }

  /**
   * 컨셉 보드 조회
   */
  async getConceptBoard(boardId: string, brandId: string) {
    return prisma.conceptBoard.findFirst({
      where: {
        id: boardId,
        brandId
      },
      include: {
        tiles: {
          orderBy: { position: 'asc' }
        }
      }
    });
  }

  /**
   * 타일 선택 상태 업데이트
   */
  async updateTileSelection(tileId: string, isSelected: boolean) {
    return prisma.conceptTile.update({
      where: { id: tileId },
      data: { isSelected }
    });
  }

  /**
   * Brand Visual Style 생성
   */
  async createVisualStyle(brandId: string, conceptBoardId: string, selectedTileIds: string[]) {
    console.log(`[ConceptBoardService] Creating visual style from ${selectedTileIds.length} tiles`);

    // 1. 선택된 타일들 조회
    const tiles = await prisma.conceptTile.findMany({
      where: {
        id: { in: selectedTileIds },
        conceptBoardId
      }
    });

    if (tiles.length !== selectedTileIds.length) {
      throw new Error('Some selected tiles not found');
    }

    // 2. 색상 팔레트 추출
    const imageUrls = tiles.map(tile => tile.imageUrl);
    const colorPalette = await this.colorExtractor.extractPaletteFromImages(imageUrls);

    // 3. Mock Tone & Manner (Phase 2에서 AI Vision으로 대체)
    const toneAndManner = {
      mood: ['modern', 'elegant', 'minimalist'],
      style: ['clean', 'sophisticated'],
      atmosphere: 'Professional and calm'
    };

    const visualKeywords = ['geometric', 'balanced', 'natural lighting'];

    // 4. Visual Style 저장
    const visualStyle = await prisma.brandVisualStyle.create({
      data: {
        brandId,
        conceptBoardId,
        colorPalette,
        toneAndManner,
        visualKeywords,
        selectedTileIds
      }
    });

    console.log(`[ConceptBoardService] Visual style created: ${visualStyle.id}`);

    return visualStyle;
  }
}
```

### 4.4 검증 체크리스트
- [ ] 라우트 파일 생성 및 등록
- [ ] Controller 4개 메서드 구현
- [ ] Service 4개 메서드 구현
- [ ] Zod 스키마 검증 추가
- [ ] 에러 핸들링 구현
- [ ] Postman/Thunder Client로 API 테스트

---

## 5. 통합 테스트

### 5.1 테스트 시나리오

**파일**: `tests/concept-board.integration.test.ts`

```typescript
import request from 'supertest';
import app from '../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Concept Board Integration Tests', () => {
  let authToken: string;
  let brandId: string;
  let boardId: string;
  let tileIds: string[];

  beforeAll(async () => {
    // 테스트용 사용자 및 브랜드 생성
    const user = await prisma.user.create({
      data: { email: 'test@example.com', password: 'hashed' }
    });

    const brand = await prisma.brand.create({
      data: { name: 'Test Brand', userId: user.id }
    });

    brandId = brand.id;
    authToken = 'mock-jwt-token'; // 실제로는 JWT 발급
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('POST /api/brands/:brandId/concept-boards - 컨셉 보드 생성', async () => {
    const response = await request(app)
      .post(`/api/brands/${brandId}/concept-boards`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ prompt: '모던하고 미니멀한 브랜드' })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.tiles).toHaveLength(9);

    boardId = response.body.id;
    tileIds = response.body.tiles.map((t: any) => t.id);
  });

  test('GET /api/brands/:brandId/concept-boards/:boardId - 컨셉 보드 조회', async () => {
    const response = await request(app)
      .get(`/api/brands/${brandId}/concept-boards/${boardId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.id).toBe(boardId);
    expect(response.body.tiles).toHaveLength(9);
  });

  test('PATCH /api/concept-boards/:boardId/tiles/:tileId - 타일 선택', async () => {
    const response = await request(app)
      .patch(`/api/concept-boards/${boardId}/tiles/${tileIds[0]}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ isSelected: true })
      .expect(200);

    expect(response.body.isSelected).toBe(true);
  });

  test('POST /api/brands/:brandId/visual-styles - Visual Style 생성', async () => {
    const selectedTiles = tileIds.slice(0, 3);

    const response = await request(app)
      .post(`/api/brands/${brandId}/visual-styles`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        conceptBoardId: boardId,
        selectedTileIds: selectedTiles
      })
      .expect(201);

    expect(response.body.colorPalette).toHaveProperty('primary');
    expect(response.body.selectedTileIds).toEqual(selectedTiles);
  });
});
```

---

## 6. 환경 변수 설정

**파일**: `.env`

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/sparklio_db"

# AWS S3
AWS_REGION="ap-northeast-2"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
S3_BUCKET_NAME="sparklio-concept-boards"
CDN_DOMAIN="https://cdn.sparklio.com"

# Image Provider
IMAGE_PROVIDER="mock"  # mock | dalle | midjourney

# Unsplash (Mock Provider용)
UNSPLASH_ACCESS_KEY="your-unsplash-key"  # Optional

# JWT
JWT_SECRET="your-jwt-secret"
```

---

## 7. Phase 1 완료 체크리스트

### 데이터베이스
- [ ] Prisma Schema 3개 모델 추가
- [ ] 마이그레이션 실행 및 검증
- [ ] 테스트 데이터 시딩

### 이미지 처리
- [ ] MockImageProvider 구현 및 테스트
- [ ] ImageProcessor (S3 업로드, 썸네일) 구현
- [ ] ColorExtractor (색상 팔레트) 구현
- [ ] S3 버킷 생성 및 권한 설정

### API
- [ ] 4개 엔드포인트 라우트 구현
- [ ] Controller 4개 메서드 구현
- [ ] Service 비즈니스 로직 구현
- [ ] Zod 스키마 검증 추가
- [ ] 에러 핸들링 및 로깅

### 테스트
- [ ] Unit Tests (ColorExtractor, ImageProcessor)
- [ ] Integration Tests (4개 API 엔드포인트)
- [ ] Postman Collection 작성
- [ ] 성능 테스트 (9개 이미지 생성 시간 측정)

### 문서화
- [ ] API 문서 (Swagger/OpenAPI)
- [ ] README 업데이트
- [ ] 코드 주석 작성

---

## 8. 다음 단계 (Phase 2)

- Real AI Provider 연동 (DALL-E 3 / Midjourney)
- Google Cloud Vision API로 고급 이미지 분석
- 비동기 작업 큐 (Bull + Redis)
- 웹소켓으로 실시간 생성 진행률 표시
- 이미지 캐싱 전략 최적화

---

**문의사항이나 블로커가 있으면 즉시 팀 리드에게 공유해주세요!**
