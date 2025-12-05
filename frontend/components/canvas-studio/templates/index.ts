/**
 * HTML Templates Index
 *
 * 모든 HTML 템플릿 컴포넌트 및 유틸리티 export
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-12-05
 */

// Presentation Templates
export {
  SlideContainer,
  PresentationSlide,
  PresentationRenderer,
  CoverSlide,
  AgendaSlide,
  SectionTitleSlide,
  ContentImageSlide,
  BulletsSlide,
  StatsSlide,
  QuoteSlide,
  CTASlide,
  ThankYouSlide,
} from './PresentationTemplates';

// Detail Page Templates
export {
  SectionContainer,
  DetailPageSection,
  DetailPageRenderer,
  HeroSection,
  ProblemSection,
  SolutionSection,
  FeaturesSection,
  BenefitsSection,
  HowItWorksSection,
  TestimonialSection,
  CTASection,
} from './DetailPageTemplates';

// Instagram Templates
export {
  AdContainer,
  InstagramAd,
  InstagramAdSetRenderer,
  TextOverlayLayout,
  TextBottomLayout,
  TextTopLayout,
  MinimalLayout,
  BoldLayout,
  SplitLayout,
} from './InstagramTemplates';

// Template Generator
export {
  extractBrandStyle,
  generateImagePrompt,
  generateImageSlotWithPrompt,
  generatePresentationSlides,
  generateDetailPageSections,
  generateInstagramAds,
  generateAllOutputs,
  type GeneratedOutputs,
} from './templateGenerator';

// Output Preview
export { OutputPreview } from './OutputPreview';
