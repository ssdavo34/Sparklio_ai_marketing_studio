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
import { ProjectTab } from './tabs/ProjectTab';
import { PagesTab } from './tabs/PagesTab';
import { ElementsTab } from './tabs/ElementsTab';
import { TextTab } from './tabs/TextTab';
import { UploadTab } from './tabs/UploadTab';
import { MeetingTab } from './tabs/MeetingTab';
import { PhotosTab } from './tabs/PhotosTab';
import { BrandKitTab } from './tabs/BrandKitTab';
import { GeneratedAssetsTab } from './tabs/GeneratedAssetsTab';

export function LeftPanel() {
  const activeTab = useLeftPanelStore((state) => state.activeTab);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'project' && <ProjectTab />}
        {activeTab === 'pages' && <PagesTab />}
        {activeTab === 'elements' && <ElementsTab />}
        {activeTab === 'text' && <TextTab />}
        {activeTab === 'upload' && <UploadTab />}
        {activeTab === 'meeting' && <MeetingTab />}
        {activeTab === 'photos' && <PhotosTab />}
        {activeTab === 'brandkit' && <BrandKitTab />}
        {activeTab === 'assets' && <GeneratedAssetsTab />}
      </div>
    </div>
  );
}
