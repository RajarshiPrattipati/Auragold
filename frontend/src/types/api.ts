/**
 * TypeScript types for API requests and responses
 */

export interface Stock {
  id: number;
  symbol: string;
  name: string;
  current_price: number;
  created_at: string;
  updated_at: string;
}

export interface StockListResponse {
  stocks: Stock[];
  last_updated: string;
}

export interface BuyTransactionRequest {
  user_id: number;
  stock_id: number;
  amount: number;
}

export interface SellTransactionRequest {
  user_id: number;
  stock_id: number;
  quantity: number;
}

export interface TransactionResponse {
  transaction_id: number;
  status: string;
  message: string;
  quantity?: number;
  new_balance: number;
  proceeds?: number;
}

export interface HoldingDetail {
  stock_id: number;
  stock_symbol: string;
  stock_name: string;
  quantity: number;
  average_buy_price: number;
  current_price: number;
  invested: number;
  current_value: number;
  gain_loss: number;
  gain_loss_percentage: number;
}

export interface PortfolioSummary {
  user_id: number;
  total_invested: number;
  current_value: number;
  gain_loss_amount: number;
  gain_loss_percentage: number;
  cash_balance: number;
  holdings: HoldingDetail[];
}

export interface StockPriceHistory {
  id: number;
  stock_id: number;
  price: number;
  timestamp: string;
}

export interface StockHistoryResponse {
  stock_id: number;
  symbol: string;
  history: StockPriceHistory[];
}

export interface LMSBuyScreenConfig {
  show_price_chart: boolean;
  theme: string;
  fields: string[];
  layout: string;
}

export interface LMSPortfolioScreenConfig {
  show_gain_loss: boolean;
  show_graph: boolean;
  refresh_interval: number;
}

export interface LMSDashboardScreenConfig {
  show_all_stocks: boolean;
  sort_by: string;
  card_layout: string;
}

export interface LMSConfig {
  buy_screen: LMSBuyScreenConfig;
  portfolio_screen: LMSPortfolioScreenConfig;
  dashboard_screen: LMSDashboardScreenConfig;
  version?: string;
}

export interface ApiError {
  detail: string;
}
