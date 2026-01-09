import { BaseProvider } from './base.js';
import { ProviderUsage, Quota, RateLimit } from '../types/index.js';
import logger from '../utils/logger.js';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

interface CopilotTokenResponse {
  sku: string;
  chat_enabled: boolean;
  individual: boolean;
  expires_at: number;
  limited_user_quotas: {
    chat?: number;
    completions?: number;
  } | null;
  limited_user_reset_date: string | null;
  tracking_id: string;
  token: string;
}

// Response from /copilot_internal/user endpoint with actual usage data
interface CopilotUserResponse {
  created_at: string;
  individual: boolean;
  sku?: string; // Optional, might be missing in some responses
  access_type_sku?: string; // Alternative field
  copilot_plan?: string;    // Alternative field
  quota_reset_date?: string;
  quota_snapshots?: {
    chat?: { entitlement: number; remaining: number; unlimited: boolean };
    completions?: { entitlement: number; remaining: number; unlimited: boolean };
    premium_interactions?: { entitlement: number; remaining: number; unlimited: boolean; quota_remaining: number };
  };
  // Legacy or alternative properties
  usage?: {
    inline_suggestions?: { used: number; limit: number; remaining: number; reset_date: string };
    chat_messages?: { used: number; limit: number; remaining: number; reset_date: string };
    premium_requests?: { used: number; limit: number; remaining: number; reset_date: string };
  };
}

// Response from /copilot_internal/v2/usage endpoint
interface CopilotUsageResponse {
  suggestions?: {
    accepted: number;
    shown: number;
    lines_accepted: number;
    lines_suggested: number;
  };
  chat?: {
    total_chats: number;
    insertion_events: number;
    copy_events: number;
  };
  models?: Array<{
    name: string;
    requests: number;
    tokens_used?: number;
  }>;
  period?: {
    start: string;
    end: string;
  };
}

interface CopilotAppsConfig {
  [key: string]: {
    user: string;
    oauth_token: string;
    githubAppId: string;
  };
}

// Enterprise/Org Metrics API response
interface CopilotMetricsResponse {
  date: string;
  total_active_users: number;
  total_engaged_users: number;
  copilot_ide_code_completions?: {
    total_engaged_users: number;
    languages?: Array<{
      name: string;
      total_engaged_users: number;
    }>;
    editors?: Array<{
      name: string;
      total_engaged_users: number;
      models?: Array<{
        name: string;
        total_engaged_users: number;
        total_code_suggestions: number;
        total_code_acceptances: number;
        total_code_lines_suggested: number;
        total_code_lines_accepted: number;
      }>;
    }>;
  };
  copilot_ide_chat?: {
    total_engaged_users: number;
    editors?: Array<{
      name: string;
      total_engaged_users: number;
      models?: Array<{
        name: string;
        total_engaged_users: number;
        total_chats: number;
        total_chat_insertion_events: number;
        total_chat_copy_events: number;
      }>;
    }>;
  };
  copilot_dotcom_chat?: {
    total_engaged_users: number;
    models?: Array<{
      name: string;
      total_engaged_users: number;
      total_chats: number;
    }>;
  };
  copilot_dotcom_pull_requests?: {
    total_engaged_users: number;
    repositories?: Array<{
      name: string;
      total_engaged_users: number;
      models?: Array<{
        name: string;
        total_pr_summaries_created: number;
      }>;
    }>;
  };
}

interface CodingMetrics {
  suggestionsShown: number;
  suggestionsAccepted: number;
  acceptanceRate: number;
  linesGenerated: number;
  linesAccepted: number;
  chatsCompleted: number;
  activeUsers: number;
}

export class CopilotProvider extends BaseProvider {
  private copilotToken: string | null = null;
  private copilotAppsPath: string;
  private enterprise: string | null;
  private org: string | null;

  constructor(token: string, enterprise?: string, org?: string) {
    super({ apiKey: token, baseUrl: 'https://api.github.com' });
    this.copilotAppsPath = join(homedir(), '.config', 'github-copilot', 'apps.json');
    this.copilotToken = this.getCopilotOAuthToken();
    this.enterprise = enterprise || process.env.GITHUB_ENTERPRISE || null;
    this.org = org || process.env.GITHUB_ORG || null;
  }

  get id(): string {
    return 'copilot';
  }

  get name(): string {
    return 'GitHub Copilot';
  }

  private getCopilotOAuthToken(): string | null {
    try {
      if (!existsSync(this.copilotAppsPath)) {
        logger.debug('Copilot apps.json not found');
        return null;
      }

      const content = readFileSync(this.copilotAppsPath, 'utf-8');
      const apps: CopilotAppsConfig = JSON.parse(content);

      const firstApp = Object.values(apps)[0];
      if (firstApp?.oauth_token) {
        logger.info(`Found Copilot OAuth token for user: ${firstApp.user}`);
        return firstApp.oauth_token;
      }

      return null;
    } catch (error) {
      logger.debug('Could not read Copilot apps.json');
      return null;
    }
  }

  async fetchUsage(startDate: Date, endDate: Date): Promise<ProviderUsage> {
    try {
      logger.info('Fetching GitHub Copilot usage data');

      // Try enterprise metrics first
      if (this.enterprise) {
        const enterpriseMetrics = await this.fetchEnterpriseMetrics();
        if (enterpriseMetrics) {
          return enterpriseMetrics;
        }
      }

      // Try org metrics
      if (this.org) {
        const orgMetrics = await this.fetchOrgMetrics();
        if (orgMetrics) {
          return orgMetrics;
        }
      }

      // Try to get actual user quota with premium_requests (VS Code uses this)
      if (this.copilotToken) {
        const userQuota = await this.fetchUserQuota();
        const usageData = await this.fetchDetailedUsage();
        
        if (userQuota && (userQuota.usage || userQuota.quota_snapshots)) {
          return this.buildUsageFromUserQuota(userQuota, usageData);
        }

        // Fall back to token data
        const tokenData = await this.fetchCopilotToken();
        if (tokenData) {
          return this.buildUsageFromTokenData(tokenData, usageData);
        }
      }

      return await this.fetchBasicStatus();
    } catch (error) {
      console.error('REAL ERROR:', error);
      logger.error({ error }, `Error fetching usage for ${this.id}:`);
      return this.createErrorUsage(error);
    }
  }

  private async fetchEnterpriseMetrics(): Promise<ProviderUsage | null> {
    try {
      const response = await fetch(
        `https://api.github.com/enterprises/${this.enterprise}/copilot/metrics`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        }
      );

      if (!response.ok) {
        logger.debug(`Enterprise metrics API returned ${response.status}`);
        return null;
      }

      const metrics: CopilotMetricsResponse[] = await response.json();
      return this.buildUsageFromMetrics(metrics, 'enterprise');
    } catch (error) {
      logger.debug('Could not fetch enterprise Copilot metrics');
      return null;
    }
  }

  private async fetchOrgMetrics(): Promise<ProviderUsage | null> {
    try {
      const response = await fetch(
        `https://api.github.com/orgs/${this.org}/copilot/metrics`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        }
      );

      if (!response.ok) {
        logger.debug(`Org metrics API returned ${response.status}`);
        return null;
      }

      const metrics: CopilotMetricsResponse[] = await response.json();
      return this.buildUsageFromMetrics(metrics, 'org');
    } catch (error) {
      logger.debug('Could not fetch org Copilot metrics');
      return null;
    }
  }

  private buildUsageFromMetrics(
    metrics: CopilotMetricsResponse[],
    source: 'enterprise' | 'org'
  ): ProviderUsage {
    // Aggregate metrics from the response array
    let totalSuggestions = 0;
    let totalAcceptances = 0;
    let totalLinesSuggested = 0;
    let totalLinesAccepted = 0;
    let totalChats = 0;
    let totalActiveUsers = 0;

    for (const day of metrics) {
      totalActiveUsers = Math.max(totalActiveUsers, day.total_active_users || 0);

      // Code completion metrics
      if (day.copilot_ide_code_completions?.editors) {
        for (const editor of day.copilot_ide_code_completions.editors) {
          if (editor.models) {
            for (const model of editor.models) {
              totalSuggestions += model.total_code_suggestions || 0;
              totalAcceptances += model.total_code_acceptances || 0;
              totalLinesSuggested += model.total_code_lines_suggested || 0;
              totalLinesAccepted += model.total_code_lines_accepted || 0;
            }
          }
        }
      }

      // Chat metrics
      if (day.copilot_ide_chat?.editors) {
        for (const editor of day.copilot_ide_chat.editors) {
          if (editor.models) {
            for (const model of editor.models) {
              totalChats += model.total_chats || 0;
            }
          }
        }
      }

      if (day.copilot_dotcom_chat?.models) {
        for (const model of day.copilot_dotcom_chat.models) {
          totalChats += model.total_chats || 0;
        }
      }
    }

    const acceptanceRate = totalSuggestions > 0
      ? Math.round((totalAcceptances / totalSuggestions) * 100)
      : 0;

    const codingMetrics: CodingMetrics = {
      suggestionsShown: totalSuggestions,
      suggestionsAccepted: totalAcceptances,
      acceptanceRate,
      linesGenerated: totalLinesSuggested,
      linesAccepted: totalLinesAccepted,
      chatsCompleted: totalChats,
      activeUsers: totalActiveUsers,
    };

    // Estimate cost based on seat count (Business = $19/user/month)
    const estimatedMonthlyCost = totalActiveUsers * 19;

    logger.info(
      `Copilot ${source}: ${totalSuggestions} suggestions, ${totalAcceptances} accepted (${acceptanceRate}%), ${totalChats} chats, ${totalActiveUsers} users`
    );

    return {
      id: this.id,
      name: this.name,
      requests: totalSuggestions + totalChats,
      cost: estimatedMonthlyCost,
      tokens: totalLinesSuggested * 10, // Rough estimate: 10 tokens per line
      suggestions: totalSuggestions,
      status: 'active',
      lastUpdated: new Date(),
      codingMetrics,
    };
  }

  private async fetchCopilotToken(): Promise<CopilotTokenResponse | null> {
    try {
      const response = await fetch('https://api.github.com/copilot_internal/v2/token', {
        method: 'GET',
        headers: {
          'Authorization': `token ${this.copilotToken}`,
          'Accept': 'application/json',
          'Editor-Version': 'vscode/1.95.0',
          'Editor-Plugin-Version': 'copilot/1.0.0',
        },
      });

      if (!response.ok) {
        logger.warn(`Copilot token API returned ${response.status}`);
        return null;
      }

      const data: CopilotTokenResponse = await response.json();
      logger.info(`Copilot subscription: ${data.sku}, individual: ${data.individual}`);
      return data;
    } catch (error) {
      logger.error({ error }, 'Error fetching Copilot token:');
      return null;
    }
  }

  private async fetchUserQuota(): Promise<CopilotUserResponse | null> {
    try {
      // This is the internal endpoint VS Code uses to get premium_requests usage
      const response = await fetch('https://api.github.com/copilot_internal/user', {
        method: 'GET',
        headers: {
          'Authorization': `token ${this.copilotToken}`,
          'Accept': 'application/json',
          'Editor-Version': 'vscode/1.95.0',
          'Editor-Plugin-Version': 'copilot/1.0.0',
        },
      });

      if (!response.ok) {
        logger.debug(`Copilot /user API returned ${response.status}`);
        return null;
      }

      const data: CopilotUserResponse = await response.json();
      logger.info(`Copilot user quota: ${JSON.stringify(data.usage || data.quota_snapshots || 'no usage data')}`);
      return data;
    } catch (error) {
      logger.debug('Could not fetch Copilot user quota');
      return null;
    }
  }

  private async fetchDetailedUsage(): Promise<CopilotUsageResponse | null> {
    // Try multiple internal endpoints for detailed usage data
    const endpoints = [
      'https://api.github.com/copilot_internal/v2/usage',
      'https://api.github.com/copilot_internal/usage',
      'https://api.github.com/copilot_internal/user/usage',
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Authorization': `token ${this.copilotToken}`,
            'Accept': 'application/json',
            'Editor-Version': 'vscode/1.95.0',
            'Editor-Plugin-Version': 'copilot/1.0.0',
          },
        });

        if (response.ok) {
          const data = await response.json();
          logger.info(`Copilot detailed usage from ${endpoint}: ${JSON.stringify(data).substring(0, 200)}`);
          return data as CopilotUsageResponse;
        }
      } catch (error) {
        logger.debug(`Could not fetch from ${endpoint}`);
      }
    }

    return null;
  }

  private buildUsageFromUserQuota(userData: CopilotUserResponse, usageData?: CopilotUsageResponse | null): ProviderUsage {
    // Fallback to other fields for SKU as 'sku' might be missing in some responses
    const sku = userData.sku || userData.access_type_sku || userData.copilot_plan || 'unknown';
    const skuInfo = this.parseSkuInfo(sku);

    // Check for quota_snapshots (Individual Pro structure)
    let premiumPercentage = 0;
    let premiumLimit = 0;
    let premiumUsed = 0;
    let resetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    if (userData.quota_reset_date) {
      resetDate = new Date(userData.quota_reset_date);
    }

    if (userData.quota_snapshots?.premium_interactions) {
      const premium = userData.quota_snapshots.premium_interactions;
      premiumLimit = premium.entitlement;
      // logic: usage = entitlement - remaining
      // "quota_remaining" seems to be the field to trust
      const remaining = premium.quota_remaining !== undefined ? premium.quota_remaining : premium.remaining;
      premiumUsed = Math.max(0, premiumLimit - remaining);

      premiumPercentage = premiumLimit > 0 ? Math.round((premiumUsed / premiumLimit) * 100 * 10) / 10 : 0;
    }
    // Fallback to usage object (legacy/different plan)
    else if (userData.usage?.premium_requests) {
      premiumUsed = userData.usage.premium_requests.used;
      premiumLimit = userData.usage.premium_requests.limit;
      premiumPercentage = premiumLimit > 0 ? Math.round((premiumUsed / premiumLimit) * 100 * 10) / 10 : 0;
      if (userData.usage.premium_requests.reset_date) {
        resetDate = new Date(userData.usage.premium_requests.reset_date);
      }
    }

    // Also get inline suggestions and chat usage if available
    let inlineUsed = 0;
    let chatUsed = 0;

    // Try to get standard chat/completions usage if tracked
    // For "unlimited" plans these are usually 0 used / 0 entitlement in the snapshot, preventing meaningful tracking
    if (userData.usage?.inline_suggestions) {
      inlineUsed = userData.usage.inline_suggestions.used;
    }
    if (userData.usage?.chat_messages) {
      chatUsed = userData.usage.chat_messages.used;
    }

    logger.info(`Copilot usage: ${premiumPercentage}% premium (${premiumUsed}/${premiumLimit})`);

    // Build coding metrics from detailed usage if available
    const codingMetrics = usageData ? {
      suggestionsShown: usageData.suggestions?.shown,
      suggestionsAccepted: usageData.suggestions?.accepted,
      acceptanceRate: usageData.suggestions?.shown 
        ? Math.round((usageData.suggestions.accepted / usageData.suggestions.shown) * 100) 
        : undefined,
      linesGenerated: usageData.suggestions?.lines_suggested,
      linesAccepted: usageData.suggestions?.lines_accepted,
      chatsCompleted: usageData.chat?.total_chats,
    } : undefined;

    // Build model breakdown if available
    const modelBreakdown = usageData?.models?.map(m => ({
      model: m.name,
      requests: m.requests,
      tokens: m.tokens_used || 0,
      cost: 0, // Copilot doesn't charge per-model
    }));

    const providerUsage: ProviderUsage = {
      id: this.id,
      name: this.name,
      planName: skuInfo.planName,
      requests: premiumUsed || (inlineUsed + chatUsed), // Use premium requests as primary metric for Pro users
      cost: skuInfo.monthlyCost,
      tokens: (premiumUsed) * 500, // Rough estimate tokens per request
      suggestions: inlineUsed, // For dashboard consistency
      status: 'active',
      lastUpdated: new Date(),
      // Dashboard uses rateLimit.percentage for the bar width (how much consumed)
      // And rateLimit.remaining for text
      rateLimit: {
        limit: premiumLimit || 100,
        remaining: premiumLimit > 0 ? (premiumLimit - premiumUsed) : 100,
        reset: resetDate,
        percentage: premiumPercentage, // Pass USAGE percentage for the bar
      },
      quota: {
        monthlyLimit: premiumLimit,
        monthlyUsed: premiumUsed,
        resetDate: resetDate,
        percentage: premiumPercentage,
      },
      codingMetrics,
      modelBreakdown,
    };

    return providerUsage;
  }

  private buildUsageFromTokenData(tokenData: CopilotTokenResponse, usageData?: CopilotUsageResponse | null): ProviderUsage {
    const skuInfo = this.parseSkuInfo(tokenData.sku);

    let quota: Quota | undefined;
    if (tokenData.limited_user_quotas) {
      const chatLimit = tokenData.limited_user_quotas.chat || 0;
      const completionsLimit = tokenData.limited_user_quotas.completions || 0;
      const totalLimit = chatLimit + completionsLimit;

      quota = {
        monthlyLimit: totalLimit,
        monthlyUsed: 0,
        resetDate: tokenData.limited_user_reset_date
          ? new Date(tokenData.limited_user_reset_date)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        percentage: 0,
      };
    }

    const usage: ProviderUsage = {
      id: this.id,
      name: this.name,
      planName: skuInfo.planName,
      requests: 0,
      cost: skuInfo.monthlyCost,
      tokens: 0,
      status: 'active',
      lastUpdated: new Date(),
      rateLimit: {
        limit: 100,
        remaining: 100,
        reset: new Date(tokenData.expires_at * 1000),
        percentage: 100,
      },
    };

    if (quota) {
      usage.quota = quota;
    }

    logger.info(`Copilot: ${skuInfo.planName}, $${skuInfo.monthlyCost}/mo, chat: ${tokenData.chat_enabled}`);
    return usage;
  }

  private parseSkuInfo(sku: string): { planName: string; monthlyCost: number } {
    const skuLower = sku.toLowerCase();

    if (skuLower.includes('plus')) {
      return { planName: 'Copilot Plus', monthlyCost: 19 };
    } else if (skuLower.includes('pro')) {
      return { planName: 'Copilot Pro', monthlyCost: 10 };
    } else if (skuLower.includes('business') || skuLower.includes('enterprise')) {
      return { planName: 'Copilot Business', monthlyCost: 19 };
    } else if (skuLower.includes('free')) {
      return { planName: 'Copilot Free', monthlyCost: 0 };
    }

    return { planName: 'Copilot', monthlyCost: 10 };
  }

  private async fetchBasicStatus(): Promise<ProviderUsage> {
    const response = await fetch('https://api.github.com/user', {
      method: 'GET',
      headers: {
        'Authorization': `token ${this.config.apiKey}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}`);
    }

    const userData = await response.json();

    const usage: ProviderUsage = {
      id: this.id,
      name: this.name,
      requests: 0,
      cost: 0,
      tokens: 0,
      status: 'active',
      lastUpdated: new Date(),
    };

    logger.info(`Copilot: GitHub user ${userData.login} authenticated`);
    return usage;
  }

  async healthCheck(): Promise<boolean> {
    // Try enterprise/org metrics first
    if (this.enterprise) {
      try {
        const response = await fetch(
          `https://api.github.com/enterprises/${this.enterprise}/copilot/metrics`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${this.config.apiKey}`,
              'Accept': 'application/vnd.github+json',
            },
          }
        );
        if (response.ok) return true;
      } catch { }
    }

    if (this.org) {
      try {
        const response = await fetch(
          `https://api.github.com/orgs/${this.org}/copilot/metrics`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${this.config.apiKey}`,
              'Accept': 'application/vnd.github+json',
            },
          }
        );
        if (response.ok) return true;
      } catch { }
    }

    if (this.copilotToken) {
      try {
        const response = await fetch('https://api.github.com/copilot_internal/v2/token', {
          method: 'GET',
          headers: {
            'Authorization': `token ${this.copilotToken}`,
            'Accept': 'application/json',
          },
        });
        if (response.ok) return true;
      } catch { }
    }

    try {
      const response = await fetch('https://api.github.com/user', {
        method: 'GET',
        headers: {
          'Authorization': `token ${this.config.apiKey}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      return response.ok;
    } catch (error) {
      logger.error({ error }, 'GitHub Copilot health check failed:');
      return false;
    }
  }
}
