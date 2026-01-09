import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '../../data');

export interface ProviderUsageData {
  requests: number;
  cost: number;
  tokens?: number;
  suggestions?: number;
  edgeInvocations?: number;
}

export interface HistoricalEntry {
  timestamp: Date;
  providers: Record<string, ProviderUsageData>;
}

export interface HistoricalData {
  entries: HistoricalEntry[];
}

export interface DailyTotals {
  [key: string]: number;
}

export class UsageHistoryStore {
  private DATA_FILE: string;
  private data: HistoricalData;

  constructor() {
    this.DATA_FILE = join(DATA_DIR, 'usage-history.json');
    this.data = this.loadHistory();
  }

  loadHistory(): HistoricalData {
    try {
      if (existsSync(this.DATA_FILE)) {
        const content = readFileSync(this.DATA_FILE, 'utf-8');
        return JSON.parse(content);
      }
      return { entries: [] };
    } catch (error) {
      console.error('Error loading usage history:', error);
      return { entries: [] };
    }
  }

  saveHistory(): void {
    try {
      const dir = dirname(this.DATA_FILE);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      writeFileSync(this.DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving usage history:', error);
    }
  }

  addEntry(entry: HistoricalEntry): void {
    this.data.entries.push(entry);
    this.saveHistory();
  }

  getHistory(hours: number): HistoricalEntry[] {
    const cutoff = new Date(Date.now() - (hours * 3600000));
    return this.data.entries.filter(entry => new Date(entry.timestamp) >= cutoff);
  }

  getDailyUsage(days: number): DailyTotals {
    const hours = days * 24;
    const entries = this.getHistory(hours);
    const dailyTotals: DailyTotals = {};

    for (const entry of entries) {
      for (const [providerId, usage] of Object.entries(entry.providers)) {
        dailyTotals[providerId] = (dailyTotals[providerId] || 0) + usage.requests;
      }
    }

    return dailyTotals;
  }
}
