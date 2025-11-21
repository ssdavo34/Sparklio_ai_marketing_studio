/**
 * API Client
 *
 * Handles all communication with the backend server
 * Includes retry logic, error handling, and offline support
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-21
 */

// ============================================================================
// Configuration
// ============================================================================

export interface APIConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

const DEFAULT_CONFIG: APIConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://100.123.51.5:8000',
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// ============================================================================
// Error Types
// ============================================================================

export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class NetworkError extends APIError {
  constructor(message: string = 'Network error') {
    super(message, undefined, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends APIError {
  constructor(message: string = 'Request timeout') {
    super(message, undefined, 'TIMEOUT');
    this.name = 'TimeoutError';
  }
}

export class ValidationError extends APIError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

// ============================================================================
// Response Types
// ============================================================================

export interface APIResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
  headers?: Record<string, string>;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services?: {
    database?: boolean;
    redis?: boolean;
    storage?: boolean;
  };
}

// ============================================================================
// API Client Class
// ============================================================================

export class APIClient {
  private config: APIConfig;
  private isOnline: boolean = true;
  private requestQueue: Array<() => Promise<any>> = [];

  constructor(config?: Partial<APIConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.setupOnlineListener();
  }

  // ============================================================================
  // Core Request Method
  // ============================================================================

  private async request<T = any>(
    method: string,
    endpoint: string,
    options: {
      body?: any;
      headers?: Record<string, string>;
      timeout?: number;
      retries?: number;
    } = {}
  ): Promise<APIResponse<T>> {
    const url = `${this.config.baseURL}${endpoint}`;
    const timeout = options.timeout || this.config.timeout || 30000;
    const retries = options.retries !== undefined ? options.retries : this.config.retries || 3;

    // Check if offline
    if (!this.isOnline) {
      throw new NetworkError('No internet connection');
    }

    let lastError: Error | null = null;

    // Retry loop
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method,
          headers: {
            ...this.config.headers,
            ...options.headers,
          },
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Parse response
        let data: any;
        const contentType = response.headers.get('content-type');

        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }

        // Handle errors
        if (!response.ok) {
          if (response.status === 404) {
            throw new APIError('Resource not found', 404, 'NOT_FOUND');
          }
          if (response.status === 401) {
            throw new APIError('Unauthorized', 401, 'UNAUTHORIZED');
          }
          if (response.status === 403) {
            throw new APIError('Forbidden', 403, 'FORBIDDEN');
          }
          if (response.status >= 500) {
            throw new APIError('Server error', response.status, 'SERVER_ERROR', data);
          }
          if (response.status === 400) {
            throw new ValidationError('Validation failed', data);
          }
          throw new APIError(data?.message || 'Request failed', response.status);
        }

        return {
          data,
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
        };

      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors
        if (error instanceof APIError && error.status && error.status < 500) {
          throw error;
        }

        // Don't retry on abort
        if ((error as any)?.name === 'AbortError') {
          throw new TimeoutError();
        }

        // Retry with delay
        if (attempt < retries) {
          await this.delay(this.config.retryDelay || 1000 * Math.pow(2, attempt));
          continue;
        }
      }
    }

    // All retries failed
    if (lastError?.message?.includes('Failed to fetch')) {
      throw new NetworkError('Cannot connect to server');
    }
    throw lastError || new APIError('Request failed');
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  async get<T = any>(endpoint: string, options?: any): Promise<T> {
    const response = await this.request<T>('GET', endpoint, options);
    return response.data!;
  }

  async post<T = any>(endpoint: string, body?: any, options?: any): Promise<T> {
    const response = await this.request<T>('POST', endpoint, { ...options, body });
    return response.data!;
  }

  async put<T = any>(endpoint: string, body?: any, options?: any): Promise<T> {
    const response = await this.request<T>('PUT', endpoint, { ...options, body });
    return response.data!;
  }

  async patch<T = any>(endpoint: string, body?: any, options?: any): Promise<T> {
    const response = await this.request<T>('PATCH', endpoint, { ...options, body });
    return response.data!;
  }

  async delete<T = any>(endpoint: string, options?: any): Promise<T> {
    const response = await this.request<T>('DELETE', endpoint, options);
    return response.data!;
  }

  // ============================================================================
  // Health Check
  // ============================================================================

  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const response = await this.get<HealthCheckResponse>('/health', {
        timeout: 5000,
        retries: 0,
      });
      return response;
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          database: false,
          redis: false,
          storage: false,
        },
      };
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch {
      return false;
    }
  }

  // ============================================================================
  // Offline Support
  // ============================================================================

  private setupOnlineListener(): void {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;

      window.addEventListener('online', () => {
        this.isOnline = true;
        this.processQueue();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }

  private async processQueue(): Promise<void> {
    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          console.error('Failed to process queued request:', error);
        }
      }
    }
  }

  queueRequest<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      // Process immediately if online
      if (this.isOnline) {
        this.processQueue();
      }
    });
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  setAuthToken(token: string): void {
    this.config.headers = {
      ...this.config.headers,
      'Authorization': `Bearer ${token}`,
    };
  }

  clearAuthToken(): void {
    if (this.config.headers) {
      delete this.config.headers['Authorization'];
    }
  }

  getConfig(): APIConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<APIConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let clientInstance: APIClient | null = null;

export function getAPIClient(config?: Partial<APIConfig>): APIClient {
  if (!clientInstance) {
    clientInstance = new APIClient(config);
  } else if (config) {
    clientInstance.updateConfig(config);
  }
  return clientInstance;
}

// ============================================================================
// Export Default Instance
// ============================================================================

const apiClient = getAPIClient();
export default apiClient;