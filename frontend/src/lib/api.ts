/**
 * Axios API client for backend communication
 */
import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  StockListResponse,
  BuyTransactionRequest,
  SellTransactionRequest,
  TransactionResponse,
  PortfolioSummary,
  LMSConfig,
  StockHistoryResponse,
  ApiError,
} from '@/types/api';

// API base URL - can be configured via environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        // Handle common errors
        if (error.response) {
          // Server responded with error
          console.error('API Error:', error.response.data);
        } else if (error.request) {
          // Request made but no response
          console.error('Network Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  // Stock endpoints
  async getStocks(): Promise<StockListResponse> {
    const response = await this.client.get<StockListResponse>('/v1/stocks');
    return response.data;
  }

  async getStockHistory(stockId: number, timeRange: string = '24h'): Promise<StockHistoryResponse> {
    const response = await this.client.get<StockHistoryResponse>(
      `/v1/stocks/${stockId}/history`,
      { params: { time_range: timeRange } }
    );
    return response.data;
  }

  // Generic get method for direct API access
  get<T = any>(url: string, config?: any) {
    return this.client.get<T>(url, config);
  }

  // Transaction endpoints
  async buyStock(request: BuyTransactionRequest): Promise<TransactionResponse> {
    const response = await this.client.post<TransactionResponse>(
      '/v1/transactions/buy',
      request
    );
    return response.data;
  }

  async sellStock(request: SellTransactionRequest): Promise<TransactionResponse> {
    const response = await this.client.post<TransactionResponse>(
      '/v1/transactions/sell',
      request
    );
    return response.data;
  }

  // Portfolio endpoint
  async getPortfolio(userId: number): Promise<PortfolioSummary> {
    const response = await this.client.get<PortfolioSummary>(`/v1/portfolio/${userId}`);
    return response.data;
  }

  // LMS endpoint
  async getLMSConfig(): Promise<LMSConfig> {
    const response = await this.client.get<LMSConfig>('/v1/lms/config');
    return response.data;
  }

  // UI Config (per-user) endpoints
  async getUserUIConfig(): Promise<any> {
    const response = await this.client.get('/v1/lms/user-config');
    return response.data;
  }

  async saveUserUIConfig(config: Record<string, any>): Promise<any> {
    const response = await this.client.put('/v1/lms/user-config', { config });
    return response.data;
  }

  // Admin LMS endpoints
  async updateGlobalLMSConfig(config: LMSConfig): Promise<LMSConfig> {
    const response = await this.client.put<LMSConfig>('/v1/lms/global-config', config);
    return response.data;
  }

  async pushUserConfigToAll(config: Record<string, any>): Promise<{ updated_users: number }> {
    const response = await this.client.post('/v1/lms/push-user-config', { config });
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
