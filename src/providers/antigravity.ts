import { BaseProvider } from './base.js';
import { ProviderUsage, RateLimit, Quota } from '../types/index.js';
import logger from '../utils/logger.js';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

interface AntigravitySession {
    timestamp: Date;
    model: string;
    source: string;
    sizeBytes: number;
}

// Rate limit tiers for different subscription levels
// Reference: https://github.com/google-gemini/gemini-cli/blob/main/docs/quota-and-pricing.md
interface RateLimitTier {
    name: string;
    requestsPerMinute: number;
    requestsPerDay: number;
}

const RATE_LIMIT_TIERS: Record<string, RateLimitTier> = {
    free: {
        name: 'Free (Google Login)',
        requestsPerMinute: 60,
        requestsPerDay: 1000,
    },
    free_api_key: {
        name: 'Free (API Key)',
        requestsPerMinute: 10,
        requestsPerDay: 250,
    },
    pro: {
        name: 'Google AI Pro',
        requestsPerMinute: 120,  // Estimated - Pro users get higher limits
        requestsPerDay: 2000,   // Estimated - Pro users get higher limits
    },
    code_assist_standard: {
        name: 'Code Assist Standard',
        requestsPerMinute: 120,
        requestsPerDay: 1500,
    },
    code_assist_enterprise: {
        name: 'Code Assist Enterprise',
        requestsPerMinute: 120,
        requestsPerDay: 2000,
    },
};

// Default to Pro tier - can be configured via environment variable
const DEFAULT_TIER = process.env.ANTIGRAVITY_TIER || 'pro';

export class AntigravityProvider extends BaseProvider {
    private geminiPath: string;
    private tier: RateLimitTier;

    constructor(apiKey: string = '') {
        super({ apiKey, baseUrl: '' });
        this.geminiPath = join(homedir(), '.gemini');

        // Get tier from environment or use default
        const tierKey = (process.env.ANTIGRAVITY_TIER || DEFAULT_TIER).toLowerCase();
        this.tier = RATE_LIMIT_TIERS[tierKey] || RATE_LIMIT_TIERS.pro;

        logger.info(`Antigravity provider initialized with tier: ${this.tier.name}`);
    }

    get id(): string {
        return 'antigravity';
    }

    get name(): string {
        return 'Antigravity (Gemini)';
    }

    async fetchUsage(startDate: Date, endDate: Date): Promise<ProviderUsage> {
        try {
            logger.info('Fetching Antigravity/Gemini usage data');

            // Always use current time as endDate to capture active sessions
            const now = new Date();
            const sessions = this.readGeminiSessions(startDate, now);

            if (sessions && sessions.length > 0) {
                logger.debug(`Found ${sessions.length} Gemini sessions in date range`);
                return this.buildUsage(sessions);
            }

            // Check if Gemini/Antigravity is being used
            const isActive = this.isAntigravityActive();

            return {
                id: this.id,
                name: this.name,
                requests: 0,
                cost: 0,
                tokens: 0,
                status: isActive ? 'active' : 'inactive',
                lastUpdated: new Date(),
                planName: this.tier.name,
                rateLimit: this.createEmptyRateLimit(),
                quota: this.createEmptyQuota(),
            };
        } catch (error) {
            logger.error({ error }, 'Error fetching Antigravity usage:');
            return this.createErrorUsage(error);
        }
    }

    private isAntigravityActive(): boolean {
        return existsSync(join(this.geminiPath, 'antigravity'));
    }

    private readGeminiSessions(startDate: Date, endDate: Date): AntigravitySession[] | null {
        try {
            const antigravityPath = join(this.geminiPath, 'antigravity');
            if (!existsSync(antigravityPath)) {
                return null;
            }

            const sessions: AntigravitySession[] = [];

            // Define mapping of directories to models
            const sourceMap = [
                { dir: 'conversations', model: 'Gemini 2.5 Pro' },
                { dir: 'implicit', model: 'Gemini Flow' },
                { dir: 'code_tracker/active/no_repo', model: 'Code Tracker' },
            ];

            sourceMap.forEach(source => {
                const scanDir = join(antigravityPath, source.dir);
                if (!existsSync(scanDir)) return;

                try {
                    const files = readdirSync(scanDir);

                    files.forEach(file => {
                        // Only count .pb files for conversations/implicit (actual sessions)
                        // and source files for code_tracker
                        const isSessionFile = file.endsWith('.pb');
                        const isCodeTrackerFile = source.dir.includes('code_tracker') &&
                            (file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.jsx'));

                        if (!isSessionFile && !isCodeTrackerFile) return;

                        const filePath = join(scanDir, file);
                        const stat = statSync(filePath);

                        // Use mtime (last modified) as it's more reliable than birthtime
                        // and better represents when the session was last active
                        const fileDate = stat.mtime;

                        if (fileDate >= startDate && fileDate <= endDate) {
                            sessions.push({
                                timestamp: fileDate,
                                model: source.model,
                                source: source.dir,
                                sizeBytes: stat.size,
                            });
                        }
                    });
                } catch (e) {
                    logger.debug(`Could not scan directory ${scanDir}: ${e}`);
                }
            });

            return sessions.length > 0 ? sessions : null;
        } catch (error) {
            logger.debug('Could not read Gemini session data');
            return null;
        }
    }

    private buildUsage(sessions: AntigravitySession[]): ProviderUsage {
        const now = new Date();

        // Calculate model breakdown
        const modelStats: Record<string, { requests: number, tokens: number, cost: number }> = {};

        sessions.forEach(s => {
            // Estimate tokens from file size (rough approximation)
            // .pb files are compressed, so actual tokens are likely higher
            const estimatedTokens = Math.ceil(s.sizeBytes / 4);

            // Cost estimation (Pro tier is typically included in subscription)
            // These are pay-as-you-go rates for reference
            let sessionCost = 0;
            if (s.model.includes('Pro')) {
                // Gemini 2.5 Pro: $1.25/1M input, $5.00/1M output (estimate 80/20 split)
                const inputTokens = Math.floor(estimatedTokens * 0.8);
                const outputTokens = Math.floor(estimatedTokens * 0.2);
                sessionCost = (inputTokens / 1_000_000 * 1.25) + (outputTokens / 1_000_000 * 5.00);
            } else if (s.model.includes('Flash') || s.model.includes('Flow')) {
                // Flash models: $0.075/1M input, $0.30/1M output
                const inputTokens = Math.floor(estimatedTokens * 0.8);
                const outputTokens = Math.floor(estimatedTokens * 0.2);
                sessionCost = (inputTokens / 1_000_000 * 0.075) + (outputTokens / 1_000_000 * 0.30);
            }
            // Code tracker files don't represent API calls, just tracked files

            if (!modelStats[s.model]) {
                modelStats[s.model] = { requests: 0, tokens: 0, cost: 0 };
            }
            modelStats[s.model].requests++;
            modelStats[s.model].tokens += estimatedTokens;
            modelStats[s.model].cost += sessionCost;
        });

        const totalRequests = sessions.length;
        const totalTokens = Object.values(modelStats).reduce((sum, m) => sum + m.tokens, 0);
        const totalCost = Object.values(modelStats).reduce((sum, m) => sum + m.cost, 0);

        // Build model breakdown array
        const modelBreakdown = Object.entries(modelStats).map(([model, stats]) => ({
            model,
            requests: stats.requests,
            tokens: stats.tokens,
            cost: Math.round(stats.cost * 100) / 100
        })).sort((a, b) => b.requests - a.requests);

        // Calculate RPM (Requests Per Minute) rate limit
        const rateLimit = this.calculateRPM(sessions, now);

        // Calculate RPD (Requests Per Day) quota
        const quota = this.calculateRPD(sessions, now);

        logger.info(`Antigravity [${this.tier.name}]: ${totalRequests} total sessions | RPM: ${rateLimit.limit - rateLimit.remaining}/${rateLimit.limit} | RPD: ${quota.monthlyUsed}/${quota.monthlyLimit}`);

        return {
            id: this.id,
            name: this.name,
            requests: totalRequests,
            cost: Math.round(totalCost * 100) / 100,
            tokens: totalTokens,
            status: 'active',
            lastUpdated: now,
            planName: this.tier.name,
            rateLimit,
            quota,
            modelBreakdown,
        };
    }

    /**
     * Calculate Requests Per Minute (RPM) rate limit
     * Uses a 1-minute rolling window
     */
    private calculateRPM(sessions: AntigravitySession[], now: Date): RateLimit {
        const windowMs = 60 * 1000; // 1 minute
        const windowStart = new Date(now.getTime() - windowMs);

        const recentSessions = sessions.filter(s => s.timestamp >= windowStart);
        const used = recentSessions.length;
        const limit = this.tier.requestsPerMinute;
        const remaining = Math.max(0, limit - used);
        const percentage = Math.round((remaining / limit) * 100);

        // Reset time: when the oldest request in the window expires
        let resetDate = now;
        if (recentSessions.length > 0) {
            const sortedSessions = [...recentSessions].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
            const oldestRequest = sortedSessions[0];
            resetDate = new Date(oldestRequest.timestamp.getTime() + windowMs);
        }

        return {
            limit,
            remaining,
            reset: resetDate,
            percentage,
        };
    }

    /**
     * Calculate Requests Per Day (RPD) quota
     * Resets at midnight Pacific Time (Google's reset time)
     */
    private calculateRPD(sessions: AntigravitySession[], now: Date): Quota {
        // Get start of day in Pacific Time
        const pacificMidnight = this.getPacificMidnight(now);
        const nextReset = this.getNextPacificMidnight(now);

        const todaysSessions = sessions.filter(s => s.timestamp >= pacificMidnight);
        const used = todaysSessions.length;
        const limit = this.tier.requestsPerDay;
        const percentage = Math.round((used / limit) * 100);

        logger.debug(`RPD window: ${used} sessions since Pacific midnight (${pacificMidnight.toISOString()} to ${now.toISOString()})`);

        return {
            monthlyLimit: limit,  // Using monthlyLimit field for daily limit (repurposed)
            monthlyUsed: used,    // Using monthlyUsed field for daily used (repurposed)
            resetDate: nextReset,
            percentage,
        };
    }

    /**
     * Get midnight Pacific Time for the current day in UTC
     */
    private getPacificMidnight(date: Date): Date {
        // Get current date in Pacific timezone
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/Los_Angeles',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });

        const parts = formatter.formatToParts(date);
        const year = parts.find(p => p.type === 'year')!.value;
        const month = parts.find(p => p.type === 'month')!.value;
        const day = parts.find(p => p.type === 'day')!.value;

        // Create midnight in Pacific timezone and convert to UTC
        // Pacific is UTC-8 (PST) or UTC-7 (PDT)
        const pacificMidnightStr = `${year}-${month}-${day}T00:00:00-08:00`;
        const midnight = new Date(pacificMidnightStr);

        return midnight;
    }

    /**
     * Get next midnight Pacific Time
     */
    private getNextPacificMidnight(date: Date): Date {
        const midnight = this.getPacificMidnight(date);
        return new Date(midnight.getTime() + 24 * 60 * 60 * 1000);
    }

    /**
     * Get Pacific timezone offset in milliseconds
     * (No longer used but kept for compatibility)
     */
    private getPacificOffset(date: Date): number {
        const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
        const pacificDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
        return utcDate.getTime() - pacificDate.getTime();
    }

    private createEmptyRateLimit(): RateLimit {
        return {
            limit: this.tier.requestsPerMinute,
            remaining: this.tier.requestsPerMinute,
            reset: new Date(),
            percentage: 100,
        };
    }

    private createEmptyQuota(): Quota {
        return {
            monthlyLimit: this.tier.requestsPerDay,
            monthlyUsed: 0,
            resetDate: this.getNextPacificMidnight(new Date()),
            percentage: 0,
        };
    }

    async healthCheck(): Promise<boolean> {
        return this.isAntigravityActive();
    }
}
