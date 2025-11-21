/**
 * Brand System Module
 *
 * Central export for brand management system
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-21
 */

export * from './brand-kit';

export {
  getBrandKitManager,
  brandKitManager,
  DEFAULT_BRAND_KIT,
  BrandKitManager,
} from './brand-kit';

export type {
  BrandKit,
  BrandColor,
  BrandFont,
  BrandLogo,
  BrandAsset,
  BrandGuidelines,
} from './brand-kit';
