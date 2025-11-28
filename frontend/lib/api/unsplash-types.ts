/**
 * Unsplash API Type Definitions
 *
 * Unsplash REST API v1 타입 정의
 * API 문서: https://unsplash.com/documentation
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-28
 */

// ============================================================================
// Core Types
// ============================================================================

export interface UnsplashUser {
  id: string;
  updated_at: string;
  username: string;
  name: string;
  first_name: string;
  last_name: string | null;
  twitter_username: string | null;
  portfolio_url: string | null;
  bio: string | null;
  location: string | null;
  links: {
    self: string;
    html: string;
    photos: string;
    likes: string;
    portfolio: string;
    following: string;
    followers: string;
  };
  profile_image: {
    small: string;
    medium: string;
    large: string;
  };
  instagram_username: string | null;
  total_collections: number;
  total_likes: number;
  total_photos: number;
  accepted_tos: boolean;
  for_hire: boolean;
  social: {
    instagram_username: string | null;
    portfolio_url: string | null;
    twitter_username: string | null;
    paypal_email: string | null;
  };
}

export interface UnsplashUrls {
  raw: string;
  full: string;
  regular: string;
  small: string;
  thumb: string;
  small_s3?: string;
}

export interface UnsplashLinks {
  self: string;
  html: string;
  download: string;
  download_location: string;
}

export interface UnsplashPhoto {
  id: string;
  created_at: string;
  updated_at: string;
  promoted_at: string | null;
  width: number;
  height: number;
  color: string;
  blur_hash: string;
  description: string | null;
  alt_description: string | null;
  urls: UnsplashUrls;
  links: UnsplashLinks;
  likes: number;
  liked_by_user: boolean;
  current_user_collections: any[];
  sponsorship: UnsplashSponsorship | null;
  user: UnsplashUser;
  exif?: {
    make: string | null;
    model: string | null;
    name: string | null;
    exposure_time: string | null;
    aperture: string | null;
    focal_length: string | null;
    iso: number | null;
  };
  location?: {
    name: string | null;
    city: string | null;
    country: string | null;
    position: {
      latitude: number | null;
      longitude: number | null;
    };
  };
  tags?: UnsplashTag[];
}

export interface UnsplashSponsorship {
  impression_urls: string[];
  tagline: string;
  tagline_url: string;
  sponsor: UnsplashUser;
}

export interface UnsplashTag {
  type: string;
  title: string;
  source?: {
    ancestry: {
      type: {
        slug: string;
        pretty_slug: string;
      };
      category: {
        slug: string;
        pretty_slug: string;
      };
      subcategory?: {
        slug: string;
        pretty_slug: string;
      };
    };
    title: string;
    subtitle: string;
    description: string;
    meta_title: string;
    meta_description: string;
    cover_photo: UnsplashPhoto;
  };
}

export interface UnsplashCollection {
  id: string;
  title: string;
  description: string | null;
  published_at: string;
  last_collected_at: string;
  updated_at: string;
  curated: boolean;
  featured: boolean;
  total_photos: number;
  private: boolean;
  share_key: string;
  tags: UnsplashTag[];
  links: {
    self: string;
    html: string;
    photos: string;
    related: string;
  };
  user: UnsplashUser;
  cover_photo: UnsplashPhoto;
  preview_photos: UnsplashPhoto[];
}

// ============================================================================
// API Request Types
// ============================================================================

export interface UnsplashSearchParams {
  query: string;
  page?: number;
  per_page?: number;
  order_by?: 'relevant' | 'latest';
  collections?: string;
  content_filter?: 'low' | 'high';
  color?: 'black_and_white' | 'black' | 'white' | 'yellow' | 'orange' | 'red' | 'purple' | 'magenta' | 'green' | 'teal' | 'blue';
  orientation?: 'landscape' | 'portrait' | 'squarish';
}

export interface UnsplashListPhotosParams {
  page?: number;
  per_page?: number;
  order_by?: 'latest' | 'oldest' | 'popular';
}

export interface UnsplashDownloadParams {
  photo_id: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

export interface UnsplashListResponse {
  photos: UnsplashPhoto[];
  total: number;
}

export interface UnsplashDownloadResponse {
  url: string;
}

export interface UnsplashError {
  errors: string[];
}

// ============================================================================
// Frontend-Specific Types
// ============================================================================

/**
 * Simplified Photo type for UI display
 */
export interface SimplePhoto {
  id: string;
  width: number;
  height: number;
  color: string;
  urls: {
    thumb: string;
    small: string;
    regular: string;
    full: string;
    raw: string;
  };
  user: {
    name: string;
    username: string;
    profile_image: string;
  };
  alt_description: string | null;
  download_location: string;
}

/**
 * Photo selection event payload
 */
export interface PhotoSelectEvent {
  photo: SimplePhoto;
  insertMode: 'background' | 'image';
}

/**
 * Unsplash API configuration
 */
export interface UnsplashConfig {
  accessKey: string;
  apiUrl?: string;
  photosPerPage?: number;
  defaultOrientation?: 'landscape' | 'portrait' | 'squarish';
}
