import { BaseProvider } from './base.js';
import { ProviderUsage, RateLimit } from '../types/index.js';
import logger from '../utils/logger.js';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { execSync } from 'node:child_process';

interface WarpAuthToken {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
}

interface WarpBonusGrant {
    createdAt: string;
    costCents: number;
    expiration: string;
    reason: string;
    userFacingMessage: string;
    requestCreditsGranted: number;
    requestCreditsRemaining: number;
}

interface WarpSpendingInfo {
    currentMonthCreditsPurchased: number;
    currentMonthPeriodEnd: string;
    currentMonthSpendCents: number;
}

interface WarpWorkspace {
    uid: string;
    bonusGrantsInfo?: {
        grants: WarpBonusGrant[];
        spendingInfo: WarpSpendingInfo;
    };
}

interface WarpRequestLimitInfo {
    isUnlimited: boolean;
    nextRefreshTime: string;
    requestLimit: number;
    requestsUsedSinceLastRefresh: number;
    requestLimitRefreshDuration: string;
    isUnlimitedAutosuggestions: boolean;
    acceptedAutosuggestionsLimit: number;
    acceptedAutosuggestionsSinceLastRefresh: number;
    isUnlimitedVoice: boolean;
    voiceRequestLimit: number;
    voiceRequestsUsedSinceLastRefresh: number;
    voiceTokenLimit: number;
    voiceTokensUsedSinceLastRefresh: number;
    isUnlimitedCodebaseIndices: boolean;
    maxCodebaseIndices: number;
    maxFilesPerRepo: number;
    embeddingGenerationBatchSize: number;
    requestLimitPooling: boolean;
}

interface WarpConversationUsageMetadata {
    creditsSpent: number;
    contextWindowUsage: number;
    summarized: boolean;
    tokenUsage: Array<{ totalTokens: number }>;
    toolUsageMetadata?: {
        runCommandStats?: { count: number };
        readFilesStats?: { count: number };
        grepStats?: { count: number };
        fileGlobStats?: { count: number };
        applyFileDiffStats?: { count: number };
    };
}

interface WarpConversationUsage {
    conversationId: string;
    lastUpdated: string;
    title: string;
    usageMetadata: WarpConversationUsageMetadata;
}

interface WarpUserData {
    requestLimitInfo: WarpRequestLimitInfo;
    bonusGrants: WarpBonusGrant[];
    workspaces: WarpWorkspace[];
    conversationUsage?: WarpConversationUsage[];
}

interface WarpGraphQLResponse {
    data: {
        user: {
            __typename: string;
            user?: WarpUserData;
        };
    };
}

export class WarpProvider extends BaseProvider {
    private warpDataPath: string;
    private readonly apiUrl = 'https://app.warp.dev/graphql/v2';
    private manualToken?: string;
    
    // Cached token and expiration for automatic refresh
    private cachedToken?: string;
    private cachedTokenExpiry?: Date;
    private cachedRefreshToken?: string;

    constructor(apiKey: string = '') {
        super({ apiKey, baseUrl: 'https://app.warp.dev' });
        this.warpDataPath = join(homedir(), 'Library', 'Application Support', 'dev.warp.Warp-Stable');
        // If apiKey is provided, use it as the manual token (from env var)
        this.manualToken = apiKey || undefined;
    }

    get id(): string {
        return 'warp';
    }

    get name(): string {
        return 'Warp.dev';
    }

    async fetchUsage(startDate: Date, endDate: Date): Promise<ProviderUsage> {
        try {
            logger.info('Fetching Warp.dev usage data from GraphQL API');

            const authToken = await this.getAuthToken();
            if (!authToken) {
                logger.warn('No Warp auth token found, Warp may not be logged in');
                return {
                    id: this.id,
                    name: this.name,
                    requests: 0,
                    cost: 0,
                    tokens: 0,
                    status: 'inactive',
                    lastUpdated: new Date(),
                    errorMessage: 'No valid Warp token. Try restarting Warp (Cmd+Q, then reopen).',
                };
            }

            const usageData = await this.fetchFromGraphQL(authToken);
            return this.buildUsage(usageData);
        } catch (error) {
            logger.error({ error }, 'Error fetching Warp.dev usage:');
            return this.createErrorUsage(error);
        }
    }

    private async refreshFirebaseToken(refreshToken: string): Promise<{ idToken: string; refreshToken: string; expiresIn: number } | null> {
        try {
            const response = await fetch(
                `https://securetoken.googleapis.com/v1/token?key=AIzaSyBdy3O3S9hrdayLJxJ7mriBR4qgUaUygAs`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        grant_type: 'refresh_token',
                        refresh_token: refreshToken,
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorCode = errorData?.error?.message || response.statusText;
                
                // Check for expired/revoked refresh token
                if (errorCode === 'TOKEN_EXPIRED' || errorCode === 'INVALID_REFRESH_TOKEN' || response.status === 400) {
                    logger.error('='.repeat(60));
                    logger.error('WARP REFRESH TOKEN EXPIRED OR REVOKED');
                    logger.error('This happens when Warp hasn\'t been used for a long time (6+ months).');
                    logger.error('To fix: Restart Warp (Cmd+Q, then reopen) to get fresh tokens.');
                    logger.error('='.repeat(60));
                }
                
                logger.debug(`Firebase token refresh failed: ${errorCode}`);
                return null;
            }

            const data = await response.json();
            if (!data.id_token) return null;
            
            return {
                idToken: data.id_token,
                refreshToken: data.refresh_token || refreshToken,
                expiresIn: parseInt(data.expires_in) || 3600,
            };
        } catch (error) {
            logger.debug({ error }, 'Error refreshing Firebase token');
            return null;
        }
    }

    private async getAuthToken(): Promise<string | null> {
        // Check if we have a valid cached token (with 5 min buffer)
        if (this.cachedToken && this.cachedTokenExpiry) {
            const bufferMs = 5 * 60 * 1000; // 5 minutes
            if (this.cachedTokenExpiry.getTime() - bufferMs > Date.now()) {
                logger.debug('Using cached Warp Firebase token');
                return this.cachedToken;
            }
            
            // Token is expiring soon, try to refresh proactively
            if (this.cachedRefreshToken) {
                logger.info('Cached token expiring soon, refreshing proactively...');
                const refreshed = await this.refreshFirebaseToken(this.cachedRefreshToken);
                if (refreshed) {
                    this.cachedToken = refreshed.idToken;
                    this.cachedRefreshToken = refreshed.refreshToken;
                    this.cachedTokenExpiry = new Date(Date.now() + refreshed.expiresIn * 1000);
                    logger.info('Successfully refreshed Warp Firebase token (proactive)');
                    return this.cachedToken;
                }
            }
        }
        
        // Try to extract from keychain (macOS only)
        try {
            // Extract Firebase ID token from macOS Keychain
            // Warp stores the actual Firebase JWT in a separate "User" account entry
            const userData = execSync(
                'security find-generic-password -s "dev.warp.Warp-Stable" -a "User" -w 2>/dev/null',
                { encoding: 'utf-8' }
            ).trim();

            if (!userData) {
                logger.debug('No Warp user data found in keychain');
                return null;
            }

            const user = JSON.parse(userData);
            const idToken = user?.id_token?.id_token;
            const expirationTime = user?.id_token?.expiration_time;
            const refreshToken = user?.id_token?.refresh_token;

            if (!idToken) {
                logger.debug('No Firebase ID token found in user data');
                return null;
            }

            // Store the refresh token for future use
            if (refreshToken) {
                this.cachedRefreshToken = refreshToken;
            }

            // Check if token is expired or expiring soon (5 min buffer)
            const bufferMs = 5 * 60 * 1000;
            if (expirationTime) {
                const expiration = new Date(expirationTime);
                const needsRefresh = expiration.getTime() - bufferMs < Date.now();
                
                if (needsRefresh && refreshToken) {
                    logger.info('Warp Firebase ID token expired or expiring soon, refreshing...');
                    const refreshed = await this.refreshFirebaseToken(refreshToken);
                    if (refreshed) {
                        this.cachedToken = refreshed.idToken;
                        this.cachedRefreshToken = refreshed.refreshToken;
                        this.cachedTokenExpiry = new Date(Date.now() + refreshed.expiresIn * 1000);
                        logger.info('Successfully refreshed Warp Firebase token');
                        return this.cachedToken;
                    }
                    // Refresh failed, but still try the keychain token
                    logger.warn('Token refresh failed, will try keychain token anyway');
                }
            }

            // Cache the keychain token
            this.cachedToken = idToken;
            if (expirationTime) {
                this.cachedTokenExpiry = new Date(expirationTime);
            }
            
            logger.debug('Using Warp Firebase ID token from keychain');
            return idToken;
        } catch (error) {
            logger.debug({ error }, 'Could not retrieve Warp Firebase ID token from keychain');
            
            // Try refresh token if we have one cached
            if (this.cachedRefreshToken) {
                logger.info('Keychain failed, attempting refresh with cached refresh token...');
                const refreshed = await this.refreshFirebaseToken(this.cachedRefreshToken);
                if (refreshed) {
                    this.cachedToken = refreshed.idToken;
                    this.cachedRefreshToken = refreshed.refreshToken;
                    this.cachedTokenExpiry = new Date(Date.now() + refreshed.expiresIn * 1000);
                    logger.info('Successfully refreshed Warp Firebase token from cached refresh token');
                    return this.cachedToken;
                }
            }
            
            // Fall back to manually provided token from environment variable
            if (this.manualToken) {
                logger.debug('Falling back to Warp token from environment variable');
                logger.warn('Note: Environment token may expire. Keychain is preferred for auto-refresh.');
                return this.manualToken;
            }
            
            logger.info('Tip: Run ./scripts/extract-warp-token.sh to extract your Warp token');
            return null;
        }
    }

    private async fetchFromGraphQL(authToken: string): Promise<WarpUserData> {
        const query = `
            query GetRequestLimitInfo($requestContext: RequestContext!) {
                user(requestContext: $requestContext) {
                    __typename
                    ... on UserOutput {
                        user {
                            workspaces {
                                uid
                                bonusGrantsInfo {
                                    grants {
                                        createdAt
                                        costCents
                                        expiration
                                        reason
                                        userFacingMessage
                                        requestCreditsGranted
                                        requestCreditsRemaining
                                    }
                                    spendingInfo {
                                        currentMonthCreditsPurchased
                                        currentMonthPeriodEnd
                                        currentMonthSpendCents
                                    }
                                }
                            }
                            requestLimitInfo {
                                isUnlimited
                                nextRefreshTime
                                requestLimit
                                requestsUsedSinceLastRefresh
                                requestLimitRefreshDuration
                                isUnlimitedAutosuggestions
                                acceptedAutosuggestionsLimit
                                acceptedAutosuggestionsSinceLastRefresh
                                isUnlimitedVoice
                                voiceRequestLimit
                                voiceRequestsUsedSinceLastRefresh
                                voiceTokenLimit
                                voiceTokensUsedSinceLastRefresh
                                isUnlimitedCodebaseIndices
                                maxCodebaseIndices
                                maxFilesPerRepo
                                embeddingGenerationBatchSize
                                requestLimitPooling
                            }
                            bonusGrants {
                                createdAt
                                costCents
                                expiration
                                reason
                                userFacingMessage
                                requestCreditsGranted
                                requestCreditsRemaining
                            }
                            conversationUsage {
                                conversationId
                                lastUpdated
                                title
                                usageMetadata {
                                    creditsSpent
                                    contextWindowUsage
                                    summarized
                                    tokenUsage {
                                        totalTokens
                                    }
                                    toolUsageMetadata {
                                        runCommandStats {
                                            count
                                        }
                                        readFilesStats {
                                            count
                                        }
                                        grepStats {
                                            count
                                        }
                                        fileGlobStats {
                                            count
                                        }
                                        applyFileDiffStats {
                                            count
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const variables = {
            requestContext: {
                clientContext: {
                    version: 'v0.2026.01.07.08.13.stable_01',
                },
                osContext: {
                    category: 'macOS',
                    linuxKernelVersion: null,
                    name: 'macOS',
                    version: '26.1',
                },
            },
        };

        const response = await fetch(`${this.apiUrl}?op=GetRequestLimitInfo`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
                'x-warp-client-id': 'warp-app',
                'x-warp-client-version': 'v0.2026.01.07.08.13.stable_01',
                'x-warp-os-category': 'macOS',
                'x-warp-os-name': 'macOS',
                'x-warp-os-version': '26.1',
            },
            body: JSON.stringify({
                query,
                variables,
                operationName: 'GetRequestLimitInfo',
            }),
        });

        if (!response.ok) {
            throw new Error(`GraphQL request failed: ${response.statusText}`);
        }

        const result: WarpGraphQLResponse = await response.json();

        if (result.data.user.__typename !== 'UserOutput' || !result.data.user.user) {
            throw new Error('Unexpected GraphQL response structure');
        }

        return result.data.user.user;
    }

    private buildUsage(data: WarpUserData): ProviderUsage {
        const limits = data.requestLimitInfo;
        const used = limits.requestsUsedSinceLastRefresh;
        const limit = limits.requestLimit;
        const recurringRemaining = Math.max(0, limit - used);
        const recurringPercent = limit > 0 ? (recurringRemaining / limit) * 100 : 0;

        // Calculate add-on credits from workspace grants (purchased credits)
        const addonGrants: Array<{
            remaining: number;
            granted: number;
            expiration: string;
            purchasedAt: string;
        }> = [];
        
        let addonCreditsTotal = 0;
        
        // Process workspace bonus grants (this is where purchased add-on credits live)
        for (const workspace of data.workspaces) {
            if (workspace.bonusGrantsInfo?.grants) {
                for (const grant of workspace.bonusGrantsInfo.grants) {
                    if (grant.reason === 'purchased_addon_credits_a_la_carte') {
                        addonGrants.push({
                            remaining: grant.requestCreditsRemaining,
                            granted: grant.requestCreditsGranted,
                            expiration: grant.expiration,
                            purchasedAt: grant.createdAt,
                        });
                        addonCreditsTotal += grant.requestCreditsRemaining;
                    }
                }
            }
        }
        
        // Also check user-level bonus grants
        for (const grant of data.bonusGrants) {
            addonGrants.push({
                remaining: grant.requestCreditsRemaining,
                granted: grant.requestCreditsGranted,
                expiration: grant.expiration,
                purchasedAt: grant.createdAt,
            });
            addonCreditsTotal += grant.requestCreditsRemaining;
        }

        // Total available = recurring remaining + all add-on credits
        const totalAvailable = recurringRemaining + addonCreditsTotal;

        logger.info(`Warp.dev: Recurring ${recurringRemaining}/${limit} (${Math.round(recurringPercent)}%), Add-on: ${addonCreditsTotal}, Total available: ${totalAvailable}`);

        // Build credit breakdown for UI
        const creditBreakdown = {
            recurring: {
                used: used,
                limit: limit,
                remaining: recurringRemaining,
                percentRemaining: Math.round(recurringPercent),
                resetsAt: limits.nextRefreshTime,
                refreshDuration: limits.requestLimitRefreshDuration,
                isUnlimited: limits.isUnlimited,
            },
            addon: {
                total: addonCreditsTotal,
                grants: addonGrants,
            },
            totalAvailable: totalAvailable,
            // True if recurring is exhausted and using add-on credits
            usingAddonCredits: recurringRemaining === 0 && addonCreditsTotal > 0,
        };

        // Build usage history from conversationUsage
        const usageHistory = (data.conversationUsage || []).map(conv => ({
            id: conv.conversationId,
            title: conv.title,
            date: conv.lastUpdated,
            creditsSpent: conv.usageMetadata.creditsSpent,
            contextWindowUsage: conv.usageMetadata.contextWindowUsage,
            summarized: conv.usageMetadata.summarized,
            totalTokens: conv.usageMetadata.tokenUsage?.reduce((sum, t) => sum + t.totalTokens, 0) || 0,
            toolCalls: {
                commands: conv.usageMetadata.toolUsageMetadata?.runCommandStats?.count || 0,
                fileReads: conv.usageMetadata.toolUsageMetadata?.readFilesStats?.count || 0,
                grep: conv.usageMetadata.toolUsageMetadata?.grepStats?.count || 0,
                fileGlob: conv.usageMetadata.toolUsageMetadata?.fileGlobStats?.count || 0,
                fileDiffs: conv.usageMetadata.toolUsageMetadata?.applyFileDiffStats?.count || 0,
            },
        }));

        // Build extended metadata
        const extendedData: any = {
            creditBreakdown,
            usageHistory,
            bonusGrants: data.bonusGrants,
            workspaces: data.workspaces,
            autosuggestions: {
                unlimited: limits.isUnlimitedAutosuggestions,
                limit: limits.acceptedAutosuggestionsLimit,
                used: limits.acceptedAutosuggestionsSinceLastRefresh,
            },
            voice: {
                unlimited: limits.isUnlimitedVoice,
                requestLimit: limits.voiceRequestLimit,
                requestsUsed: limits.voiceRequestsUsedSinceLastRefresh,
                tokenLimit: limits.voiceTokenLimit,
                tokensUsed: limits.voiceTokensUsedSinceLastRefresh,
            },
            codebaseIndexing: {
                unlimited: limits.isUnlimitedCodebaseIndices,
                maxCodebases: limits.maxCodebaseIndices,
                maxFilesPerRepo: limits.maxFilesPerRepo,
                batchSize: limits.embeddingGenerationBatchSize,
            },
            pooling: limits.requestLimitPooling,
        };

        return {
            id: this.id,
            name: this.name,
            requests: used,
            cost: 0, // Warp AI is included in subscription
            tokens: used * 1000, // Estimate 1000 tokens per credit
            status: 'active',
            lastUpdated: new Date(),
            rateLimit: {
                limit: limit,
                remaining: recurringRemaining,
                reset: new Date(limits.nextRefreshTime),
                percentage: Math.round(recurringPercent),
            },
            // Store add-on credits total for quick access
            suggestions: addonCreditsTotal,
            // Show total available on card (recurring + addon)
            edgeInvocations: totalAvailable,
            codingMetrics: {
                suggestionsShown: limits.acceptedAutosuggestionsLimit,
                suggestionsAccepted: limits.acceptedAutosuggestionsSinceLastRefresh,
                ...extendedData,
            },
        };
    }

    async healthCheck(): Promise<boolean> {
        const token = await this.getAuthToken();
        return token !== null;
    }
}
