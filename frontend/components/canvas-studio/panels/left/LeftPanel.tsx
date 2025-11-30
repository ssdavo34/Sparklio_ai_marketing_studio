/**
 * Left Panel
 *
 * Multi-tab panel with tool-specific content
 * - Pages: Page management
 * - Elements: Shapes and elements
 * - Text: Text templates
 * - Upload: File upload
 * - Photos: Stock images
 * - BrandKit: Brand assets
 *
 * @author C Team (Frontend Team)
 * @version 3.1
 */

'use client';

import { useLeftPanelStore } from '../../stores/useLeftPanelStore';
// 1. 입력 소스 / 프로젝트 관리
import { ProjectTab } from './tabs/ProjectTab';
import { UploadTab } from './tabs/UploadTab';
// 2. 브랜드 & 전략 허브
import { BrandKitTab } from './tabs/BrandKitTab';
import { MeetingTab } from './tabs/MeetingTab';
import { ConceptBoardTab } from './tabs/ConceptBoardTab';
// 3. 채널별 산출물
import { PresentationTab } from './tabs/PresentationTab';
import { DetailTab } from './tabs/DetailTab';
import { SNSTab } from './tabs/SNSTab';
import { VideoTab } from './tabs/VideoTab';
import { ImageTab } from './tabs/ImageTab';
// 4. 에셋 라이브러리
import { GeneratedAssetsTab } from './tabs/GeneratedAssetsTab';
// 5. 시스템
import { SettingsTab } from './tabs/SettingsTab';
// Legacy (에디터 도구 - 향후 분리 예정)
import { PagesTab } from './tabs/PagesTab';
import { ElementsTab } from './tabs/ElementsTab';
import { TextTab } from './tabs/TextTab';
import { PhotosTab } from './tabs/PhotosTab';

export function LeftPanel() {
  const activeTab = useLeftPanelStore((state) => state.activeTab);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {/* 1. 입력 소스 / 프로젝트 관리 */}
        {activeTab === 'project' && <ProjectTab />}
        {activeTab === 'upload' && <UploadTab />}

        {/* 2. 브랜드 & 전략 허브 */}
        {activeTab === 'brandkit' && <BrandKitTab />}
        {activeTab === 'meeting' && <MeetingTab />}
        {activeTab === 'conceptboard' && <ConceptBoardTab />}

        {/* 3. 채널별 산출물 */}
        {activeTab === 'presentation' && <PresentationTab />}
        {activeTab === 'detail' && <DetailTab />}
        {activeTab === 'sns' && <SNSTab />}
        {activeTab === 'video' && <VideoTab />}
        {activeTab === 'image' && <ImageTab />}

        {/* 4. 에셋 라이브러리 */}
        {activeTab === 'assets' && <GeneratedAssetsTab />}

        {/* 5. 시스템 */}
        {activeTab === 'settings' && <SettingsTab />}

        {/* Legacy (에디터 도구 - 향후 분리 예정) */}
        {activeTab === 'pages' && <PagesTab />}
        {activeTab === 'elements' && <ElementsTab />}
        {activeTab === 'text' && <TextTab />}
        {activeTab === 'photos' && <PhotosTab />}
      </div>
    </div>
  );
}
