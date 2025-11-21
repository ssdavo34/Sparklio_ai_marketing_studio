/**
 * Document API
 *
 * Handles all document-related API operations
 * CRUD operations for SparklioDocument
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-21
 */

import { getAPIClient, APIClient, APIError, NetworkError } from './api-client';
import type { SparklioDocument } from '../sparklio/document';

// ============================================================================
// Types
// ============================================================================

export interface DocumentListItem {
  id: string;
  title: string;
  mode: string;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
  author?: string;
  pageCount: number;
}

export interface DocumentListResponse {
  documents: DocumentListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DocumentCreateRequest {
  title: string;
  mode?: string;
  templateId?: string;
  width?: number;
  height?: number;
}

export interface DocumentUpdateRequest {
  title?: string;
  document?: SparklioDocument;
  metadata?: Record<string, any>;
}

export interface DocumentShareRequest {
  emails: string[];
  permission: 'view' | 'edit' | 'comment';
  message?: string;
}

export interface DocumentExportRequest {
  format: 'pdf' | 'png' | 'jpg' | 'svg' | 'pptx';
  pages?: string[];
  quality?: number;
  scale?: number;
}

export interface DocumentExportResponse {
  url: string;
  expiresAt: string;
  format: string;
  size: number;
}

// ============================================================================
// Local Storage Service (Fallback)
// ============================================================================

class LocalDocumentStorage {
  private readonly STORAGE_KEY = 'sparklio_documents';
  private readonly MAX_DOCUMENTS = 50;

  async list(): Promise<DocumentListResponse> {
    const documents = this.getAll();
    return {
      documents: documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        mode: doc.mode,
        thumbnail: doc.metadata?.thumbnail,
        createdAt: doc.metadata.createdAt,
        updatedAt: doc.metadata.updatedAt,
        author: doc.metadata.author,
        pageCount: doc.pages.length,
      })),
      total: documents.length,
      page: 1,
      pageSize: documents.length,
    };
  }

  async get(id: string): Promise<SparklioDocument | null> {
    const documents = this.getAll();
    return documents.find(doc => doc.id === id) || null;
  }

  async create(document: SparklioDocument): Promise<SparklioDocument> {
    const documents = this.getAll();

    // Add document
    documents.unshift(document);

    // Limit storage size
    if (documents.length > this.MAX_DOCUMENTS) {
      documents.splice(this.MAX_DOCUMENTS);
    }

    this.saveAll(documents);
    return document;
  }

  async update(id: string, document: SparklioDocument): Promise<SparklioDocument> {
    const documents = this.getAll();
    const index = documents.findIndex(doc => doc.id === id);

    if (index === -1) {
      throw new Error('Document not found');
    }

    // Update metadata
    document.metadata.updatedAt = new Date().toISOString();

    documents[index] = document;
    this.saveAll(documents);

    return document;
  }

  async delete(id: string): Promise<void> {
    const documents = this.getAll();
    const filtered = documents.filter(doc => doc.id !== id);

    if (filtered.length === documents.length) {
      throw new Error('Document not found');
    }

    this.saveAll(filtered);
  }

  private getAll(): SparklioDocument[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load documents from localStorage:', error);
      return [];
    }
  }

  private saveAll(documents: SparklioDocument[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(documents));
    } catch (error) {
      console.error('Failed to save documents to localStorage:', error);

      // Handle quota exceeded
      if ((error as any)?.name === 'QuotaExceededError') {
        // Remove oldest documents
        const reduced = documents.slice(0, Math.floor(documents.length * 0.8));
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reduced));
      }
    }
  }

  async clear(): Promise<void> {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

// ============================================================================
// Document API Class
// ============================================================================

export class DocumentAPI {
  private client: APIClient;
  private localStorage: LocalDocumentStorage;
  private useLocalStorage: boolean = false;

  constructor(client?: APIClient) {
    this.client = client || getAPIClient();
    this.localStorage = new LocalDocumentStorage();
  }

  /**
   * Enable/disable local storage fallback
   */
  setLocalStorageMode(enabled: boolean): void {
    this.useLocalStorage = enabled;
  }

  /**
   * List all documents
   */
  async list(params?: {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    filter?: string;
  }): Promise<DocumentListResponse> {
    if (this.useLocalStorage) {
      return this.localStorage.list();
    }

    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.filter) queryParams.append('filter', params.filter);

      const query = queryParams.toString();
      const endpoint = query ? `/api/v1/documents?${query}` : '/api/v1/documents';

      return await this.client.get<DocumentListResponse>(endpoint);
    } catch (error) {
      if (error instanceof NetworkError) {
        // Fallback to localStorage
        console.warn('Server unavailable, using local storage');
        return this.localStorage.list();
      }
      throw error;
    }
  }

  /**
   * Get a single document
   */
  async get(id: string): Promise<SparklioDocument> {
    if (this.useLocalStorage) {
      const doc = await this.localStorage.get(id);
      if (!doc) throw new APIError('Document not found', 404);
      return doc;
    }

    try {
      return await this.client.get<SparklioDocument>(`/api/v1/documents/${id}`);
    } catch (error) {
      if (error instanceof NetworkError) {
        // Try localStorage
        const doc = await this.localStorage.get(id);
        if (doc) return doc;
      }
      throw error;
    }
  }

  /**
   * Create a new document
   */
  async create(request: DocumentCreateRequest): Promise<SparklioDocument> {
    // Create a new document structure
    const document: SparklioDocument = {
      id: generateId(),
      title: request.title,
      type: 'sparklio-doc',
      version: '2.0',
      mode: request.mode as any || 'presentation',
      pages: [{
        id: generateId(),
        name: 'Page 1',
        width: request.width || 1920,
        height: request.height || 1080,
        objects: [],
        order: 0,
      }],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'manual',
      },
    };

    if (this.useLocalStorage) {
      return this.localStorage.create(document);
    }

    try {
      const response = await this.client.post<SparklioDocument>('/api/v1/documents', request);

      // Save to localStorage as backup
      try {
        await this.localStorage.create(response);
      } catch (e) {
        console.warn('Failed to backup document to localStorage:', e);
      }

      return response;
    } catch (error) {
      if (error instanceof NetworkError) {
        // Fallback to localStorage
        console.warn('Server unavailable, saving to local storage');
        return this.localStorage.create(document);
      }
      throw error;
    }
  }

  /**
   * Update a document
   */
  async update(id: string, request: DocumentUpdateRequest): Promise<SparklioDocument> {
    if (this.useLocalStorage && request.document) {
      return this.localStorage.update(id, request.document);
    }

    try {
      const response = await this.client.put<SparklioDocument>(`/api/v1/documents/${id}`, request);

      // Update localStorage backup
      if (request.document) {
        try {
          await this.localStorage.update(id, request.document);
        } catch (e) {
          console.warn('Failed to update localStorage backup:', e);
        }
      }

      return response;
    } catch (error) {
      if (error instanceof NetworkError && request.document) {
        // Fallback to localStorage
        console.warn('Server unavailable, updating local storage');
        return this.localStorage.update(id, request.document);
      }
      throw error;
    }
  }

  /**
   * Delete a document
   */
  async delete(id: string): Promise<void> {
    if (this.useLocalStorage) {
      return this.localStorage.delete(id);
    }

    try {
      await this.client.delete(`/api/v1/documents/${id}`);

      // Remove from localStorage
      try {
        await this.localStorage.delete(id);
      } catch (e) {
        console.warn('Failed to remove from localStorage:', e);
      }
    } catch (error) {
      if (error instanceof NetworkError) {
        // Just remove from localStorage
        console.warn('Server unavailable, removing from local storage');
        return this.localStorage.delete(id);
      }
      throw error;
    }
  }

  /**
   * Duplicate a document
   */
  async duplicate(id: string): Promise<SparklioDocument> {
    const original = await this.get(id);

    const duplicate: SparklioDocument = {
      ...original,
      id: generateId(),
      title: `${original.title} (Copy)`,
      metadata: {
        ...original.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    if (this.useLocalStorage) {
      return this.localStorage.create(duplicate);
    }

    try {
      return await this.client.post<SparklioDocument>(`/api/v1/documents/${id}/duplicate`, {});
    } catch (error) {
      if (error instanceof NetworkError) {
        return this.localStorage.create(duplicate);
      }
      throw error;
    }
  }

  /**
   * Share a document
   */
  async share(id: string, request: DocumentShareRequest): Promise<{ shareUrl: string }> {
    if (this.useLocalStorage) {
      // Generate a mock share URL
      return {
        shareUrl: `${window.location.origin}/shared/${id}?token=${generateId()}`,
      };
    }

    return await this.client.post(`/api/v1/documents/${id}/share`, request);
  }

  /**
   * Export a document
   */
  async export(id: string, request: DocumentExportRequest): Promise<DocumentExportResponse> {
    if (this.useLocalStorage) {
      // For local storage, we can't actually export to server formats
      throw new APIError('Export not available in offline mode', 503);
    }

    return await this.client.post(`/api/v1/documents/${id}/export`, request);
  }

  /**
   * Auto-save a document (debounced)
   */
  private autoSaveTimer: NodeJS.Timeout | null = null;

  async autoSave(id: string, document: SparklioDocument, delay: number = 2000): Promise<void> {
    // Clear previous timer
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }

    // Set new timer
    this.autoSaveTimer = setTimeout(async () => {
      try {
        await this.update(id, { document });
        console.log('Document auto-saved');
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, delay);
  }

  /**
   * Clear all local documents
   */
  async clearLocal(): Promise<void> {
    return this.localStorage.clear();
  }

  /**
   * Sync local documents to server
   */
  async syncLocal(): Promise<{ synced: number; failed: number }> {
    const localDocs = await this.localStorage.list();
    let synced = 0;
    let failed = 0;

    for (const docItem of localDocs.documents) {
      try {
        const doc = await this.localStorage.get(docItem.id);
        if (doc) {
          await this.client.post('/api/v1/documents/sync', doc);
          synced++;
        }
      } catch (error) {
        console.error(`Failed to sync document ${docItem.id}:`, error);
        failed++;
      }
    }

    return { synced, failed };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

function generateId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

let apiInstance: DocumentAPI | null = null;

export function getDocumentAPI(): DocumentAPI {
  if (!apiInstance) {
    apiInstance = new DocumentAPI();
  }
  return apiInstance;
}

// Export default instance
const documentAPI = getDocumentAPI();
export default documentAPI;