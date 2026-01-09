export interface RateLimit {
  limit: number;
  remaining: number;
  reset: Date;
  percentage: number;
}

export interface Quota {
  monthlyLimit: number;
  monthlyUsed: number;
  resetDate: Date;
  percentage: number;
}

export interface CodingMetrics {
  suggestionsShown?: number;
  suggestionsAccepted?: number;
  acceptanceRate?: number;
  linesGenerated?: number;
  linesAccepted?: number;
  chatsCompleted?: number;
  activeUsers?: number;
  // Claude Code specific metrics
  sessions?: number;
  toolCalls?: number;
  cacheHitRate?: number;
  cacheReadTokens?: number;
  cacheCreationTokens?: number;
  marketValue?: number;
  subscriptionCost?: number;
}

export interface ModelBreakdown {
  model: string;
  requests: number;
  tokens: number;
  cost: number;
}

export interface ProviderUsage {
  id: string;
  name: string;
  requests: number;
  cost: number;
  tokens?: number;
  suggestions?: number;
  edgeInvocations?: number;
  status: 'active' | 'inactive' | 'error';
  lastUpdated?: Date;
  rateLimit?: RateLimit;
  quota?: Quota;
  codingMetrics?: CodingMetrics;
  modelBreakdown?: ModelBreakdown[];
  planName?: string;  // Plan tier (e.g., "Copilot Pro", "Claude Max")
}

export interface Summary {
  totalRequests: number;
  totalCost: number;
  totalTokens: number;
  avgLatency: number;
  requestChange?: number;
  costChange?: number;
  tokenChange?: number;
  latencyChange?: number;
}

export interface TimelineData {
  date: string;
  requests: number;
  cost: number;
}

export interface UsageData {
  summary: Summary;
  providers: ProviderUsage[];
  timeline: TimelineData[];
  lastUpdated: string;
}

export interface Provider {
  id: string;
  name: string;
  fetchUsage(startDate: Date, endDate: Date): Promise<ProviderUsage>;
  healthCheck(): Promise<boolean>;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  details?: any;
  timestamp: string;
}

export interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export interface Environment {
  port: number;
  host: string;
  anthropicApiKey?: string;
  openrouterApiKey?: string;
  githubToken?: string;
  googleAiApiKey?: string;
  zaiApiKey?: string;
  vercelToken?: string;
  openaiApiKey?: string;
  warpToken?: string;
  cacheTtl: number;
  logLevel: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  monitoringEnabled: boolean;
  monitoredApis: string[];
}

export interface MonitoringConfig {
  enabled: boolean;
  monitoredApis: string[];
  lastUpdated: string;
}

export interface ConfigUpdateRequest {
  enabled?: boolean;
  addApis?: string[];
  removeApis?: string[];
}
