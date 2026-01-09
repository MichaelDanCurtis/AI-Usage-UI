import { UsageHistoryStore, DailyTotals, HistoricalEntry } from './usage-history.js';
import { TimelineData } from '../types/index.js';

const historyStore = new UsageHistoryStore();

export interface HistorySummary {
  totalRequests: number;
  totalCost: number;
  totalTokens: number;
}

export interface HistoryUsageData {
  summary: HistorySummary;
  timeline: TimelineData[];
  dailyTotals: DailyTotals;
}

export function getUsageHistory(hours: number = 24): HistoryUsageData {
  const history = historyStore.getHistory(hours);
  const dailyTotals = historyStore.getDailyUsage(Math.ceil(hours / 24));

  let totalRequests = 0;
  let totalCost = 0;
  let totalTokens = 0;

  for (const [, requests] of Object.entries(dailyTotals)) {
    totalRequests += requests;
  }

  for (const entry of history) {
    for (const [, usage] of Object.entries(entry.providers)) {
      totalCost += usage.cost;
      totalTokens += usage.tokens || 0;
    }
  }

  const timeline: TimelineData[] = history.map(entry => {
    let entryRequests = 0;
    let entryCost = 0;

    for (const [, usage] of Object.entries(entry.providers)) {
      entryRequests += usage.requests;
      entryCost += usage.cost;
    }

    return {
      date: new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      requests: entryRequests,
      cost: Math.round(entryCost * 100) / 100,
    };
  });

  return {
    summary: {
      totalRequests,
      totalCost,
      totalTokens,
    },
    timeline,
    dailyTotals,
  };
}

export function addUsageEntry(entry: HistoricalEntry): void {
  historyStore.addEntry(entry);
}

export function getHistoryStore(): UsageHistoryStore {
  return historyStore;
}
