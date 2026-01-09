(function () {
  'use strict';

  const API_BASE = '/api';

  class ThemeManager {
    constructor() {
      // Theme Registry - 20 Presets
      this.themes = {
        // --- Core ---
        default: {
          name: 'Graphite',
          colors: {
            '--bg-primary': '#0a0a0b',
            '--bg-card': '#141415',
            '--bg-card-hover': '#1c1c1e',
            '--border-color': '#27272a',
            '--text-primary': '#e4e4e7',
            '--text-secondary': '#a1a1aa',
            '--text-muted': '#71717a',
            '--accent-glow': 'rgba(255, 255, 255, 0.05)',
            '--card-shadow': '0 0 0 1px #27272a',
            '--card-shadow-hover': '0 0 0 1px #3f3f46, 0 8px 30px rgba(0, 0, 0, 0.4)'
          },
          charts: { grid: '#27272a', text: '#71717a' }
        },
        glass: {
          name: 'Liquid Glass',
          colors: {
            '--bg-primary': '#e0e5ec',
            '--bg-card': 'rgba(255, 255, 255, 0.65)',
            '--bg-card-hover': 'rgba(255, 255, 255, 0.85)',
            '--border-color': 'rgba(255, 255, 255, 0.5)',
            '--text-primary': '#1f2937',
            '--text-secondary': '#4b5563',
            '--text-muted': '#9ca3af',
            '--accent-glow': 'rgba(255, 255, 255, 0.4)',
            '--card-shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
            '--card-shadow-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
          },
          charts: { grid: '#d1d5db', text: '#6b7280' }
        },
        space: {
          name: 'Deep Space',
          colors: {
            '--bg-primary': '#000000',
            '--bg-card': '#050505',
            '--bg-card-hover': '#0a0a0a',
            '--border-color': '#1a1a1a',
            '--text-primary': '#f8fafc',
            '--text-secondary': '#94a3b8',
            '--text-muted': '#475569',
            '--accent-glow': 'rgba(56, 189, 248, 0.1)',
            '--card-shadow': '0 0 0 1px #1a1a1a',
            '--card-shadow-hover': '0 0 0 1px #38bdf8, 0 0 20px rgba(56, 189, 248, 0.1)'
          },
          charts: { grid: '#1e293b', text: '#475569' }
        },
        // --- Developer Favorites ---
        dracula: {
          name: 'Dracula',
          colors: {
            '--bg-primary': '#282a36',
            '--bg-card': '#44475a',
            '--bg-card-hover': '#6272a4',
            '--border-color': '#6272a4',
            '--text-primary': '#f8f8f2',
            '--text-secondary': '#bd93f9',
            '--text-muted': '#6272a4',
            '--accent-glow': 'rgba(189, 147, 249, 0.2)',
            '--card-shadow': '0 0 0 1px #44475a',
            '--card-shadow-hover': '0 0 0 1px #bd93f9, 0 8px 30px rgba(0, 0, 0, 0.4)'
          },
          charts: { grid: '#44475a', text: '#f8f8f2' }
        },
        nord: {
          name: 'Nord',
          colors: {
            '--bg-primary': '#2e3440',
            '--bg-card': '#3b4252',
            '--bg-card-hover': '#434c5e',
            '--border-color': '#4c566a',
            '--text-primary': '#eceff4',
            '--text-secondary': '#d8dee9',
            '--text-muted': '#4c566a',
            '--accent-glow': 'rgba(136, 192, 208, 0.2)',
            '--card-shadow': '0 0 0 1px #3b4252',
            '--card-shadow-hover': '0 0 0 1px #88c0d0, 0 0 15px rgba(136, 192, 208, 0.3)'
          },
          charts: { grid: '#4c566a', text: '#d8dee9' }
        },
        monokai: {
          name: 'Monokai',
          colors: {
            '--bg-primary': '#272822',
            '--bg-card': '#3e3d32',
            '--bg-card-hover': '#49483e',
            '--border-color': '#75715e',
            '--text-primary': '#f8f8f2',
            '--text-secondary': '#a6e22e',
            '--text-muted': '#75715e',
            '--accent-glow': 'rgba(166, 226, 46, 0.1)',
            '--card-shadow': '0 0 0 1px #3e3d32',
            '--card-shadow-hover': '0 0 0 1px #a6e22e, 0 0 15px rgba(166, 226, 46, 0.2)'
          },
          charts: { grid: '#75715e', text: '#f8f8f2' }
        },
        // --- Vibes ---
        synthwave: {
          name: 'Synthwave',
          colors: {
            '--bg-primary': '#2b213a',
            '--bg-card': '#241b2f',
            '--bg-card-hover': '#3d2558',
            '--border-color': '#ff00d6',
            '--text-primary': '#05d9e8',
            '--text-secondary': '#ff00d6',
            '--text-muted': '#6a4c93',
            '--accent-glow': 'rgba(255, 0, 214, 0.4)',
            '--card-shadow': '0 0 0 1px #241b2f',
            '--card-shadow-hover': '0 0 0 1px #ff00d6, 0 0 20px rgba(255, 0, 214, 0.5)'
          },
          charts: { grid: '#6a4c93', text: '#05d9e8' }
        },
        matrix: {
          name: 'Matrix',
          colors: {
            '--bg-primary': '#0d0d0d',
            '--bg-card': '#001a00',
            '--bg-card-hover': '#002600',
            '--border-color': '#003300',
            '--text-primary': '#00ff00',
            '--text-secondary': '#00cc00',
            '--text-muted': '#004d00',
            '--accent-glow': 'rgba(0, 255, 0, 0.2)',
            '--card-shadow': '0 0 0 1px #001a00',
            '--card-shadow-hover': '0 0 0 1px #00ff00, 0 0 15px rgba(0, 255, 0, 0.3)'
          },
          charts: { grid: '#003300', text: '#00ff00' }
        },
        cherry: {
          name: 'Cherry',
          colors: {
            '--bg-primary': '#1a0b0f',
            '--bg-card': '#2d141a',
            '--bg-card-hover': '#401c25',
            '--border-color': '#4a1923',
            '--text-primary': '#ffb7c5',
            '--text-secondary': '#ff8ba7',
            '--text-muted': '#662a36',
            '--accent-glow': 'rgba(255, 0, 68, 0.2)',
            '--card-shadow': '0 0 0 1px #2d141a',
            '--card-shadow-hover': '0 0 0 1px #ff0044, 0 0 20px rgba(255, 0, 68, 0.3)'
          },
          charts: { grid: '#4a1923', text: '#ffb7c5' }
        },
        ocean: {
          name: 'Oceanic',
          colors: {
            '--bg-primary': '#0f172a',
            '--bg-card': '#1e293b',
            '--bg-card-hover': '#334155',
            '--border-color': '#1e293b',
            '--text-primary': '#e2e8f0',
            '--text-secondary': '#94a3b8',
            '--text-muted': '#475569',
            '--accent-glow': 'rgba(56, 189, 248, 0.2)',
            '--card-shadow': '0 0 0 1px #1e293b',
            '--card-shadow-hover': '0 0 0 1px #38bdf8, 0 0 20px rgba(56, 189, 248, 0.3)'
          },
          charts: { grid: '#1e293b', text: '#94a3b8' }
        },
        sun: {
          name: 'Sunset',
          colors: {
            '--bg-primary': '#21130d',
            '--bg-card': '#3a1e16',
            '--bg-card-hover': '#572b20',
            '--border-color': '#572b20',
            '--text-primary': '#fdba74',
            '--text-secondary': '#fb923c',
            '--text-muted': '#9a3412',
            '--accent-glow': 'rgba(249, 115, 22, 0.2)',
            '--card-shadow': '0 0 0 1px #3a1e16',
            '--card-shadow-hover': '0 0 0 1px #f97316, 0 0 20px rgba(249, 115, 22, 0.3)'
          },
          charts: { grid: '#572b20', text: '#fdba74' }
        },
        lavender: {
          name: 'Lavender',
          colors: {
            '--bg-primary': '#18171f',
            '--bg-card': '#252230',
            '--bg-card-hover': '#332e42',
            '--border-color': '#332e42',
            '--text-primary': '#e9d5ff',
            '--text-secondary': '#c084fc',
            '--text-muted': '#7e22ce',
            '--accent-glow': 'rgba(168, 85, 247, 0.2)',
            '--card-shadow': '0 0 0 1px #252230',
            '--card-shadow-hover': '0 0 0 1px #a855f7, 0 0 20px rgba(168, 85, 247, 0.3)'
          },
          charts: { grid: '#332e42', text: '#e9d5ff' }
        }
      };
      this.currentTheme = localStorage.getItem('theme') || 'default';
      this.init();
    }

    init() {
      this.applyTheme(this.currentTheme);
      document.addEventListener('DOMContentLoaded', () => {
        // Init logic controlled by modal
      });
    }

    setTheme(themeName) {
      if (!this.themes[themeName]) return;
      this.currentTheme = themeName;
      localStorage.setItem('theme', themeName);
      this.applyTheme(themeName);

      // Dispatch event for UI updates if needed
      window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: themeName } }));

      if (typeof updateCharts === 'function') {
        updateCharts();
      }
    }

    applyTheme(themeName) {
      const theme = this.themes[themeName] || this.themes.default;
      const root = document.documentElement;

      // Apply Variables
      Object.entries(theme.colors).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });

      if (themeName === 'glass') {
        document.body.setAttribute('data-theme', 'glass');
      } else {
        document.body.removeAttribute('data-theme');
      }
    }

    getChartColors() {
      return (this.themes[this.currentTheme] || this.themes.default).charts;
    }

    getAvailableThemes() {
      return Object.entries(this.themes).map(([id, t]) => ({ id, name: t.name, preview: t.colors['--bg-card'] }));
    }
  }

  const themeManager = new ThemeManager();

  let currentData = null;
  let charts = {};
  let refreshInterval = null;

  const providerColors = {
    anthropic: '#d97706',
    openai: '#10b981',
    openrouter: '#6366f1',
    copilot: '#3b82f6',
    google: '#f59e0b',
    zai: '#8b5cf6',
    vercel: '#000000',
    warp: '#22d3ee',
    antigravity: '#ec4899',
  };

  const providerGradients = {
    anthropic: 'from-amber-600 to-orange-700',
    openai: 'from-emerald-600 to-green-700',
    openrouter: 'from-indigo-600 to-purple-700',
    copilot: 'from-blue-600 to-cyan-700',
    google: 'from-yellow-600 to-amber-700',
    zai: 'from-violet-600 to-purple-700',
    vercel: 'from-zinc-700 to-zinc-900',
    warp: 'from-cyan-500 to-teal-600',
    antigravity: 'from-pink-500 to-rose-600',
  };

  const budgets = {};

  // Motion.dev animation helpers
  function animateProviderCards() {
    if (!window.motion) return;
    const cards = document.querySelectorAll('.provider-card');
    if (cards.length === 0) return;

    // Set initial state
    cards.forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
    });

    // Animate with stagger
    window.motion.animate(
      cards,
      { opacity: 1, transform: 'translateY(0px)' },
      { duration: 0.4, delay: window.motion.stagger(0.1), easing: 'ease-out' }
    );
  }

  function animateSummaryCards() {
    if (!window.motion) return;
    const cards = document.querySelectorAll('.glow-effect');

    window.motion.animate(
      cards,
      { opacity: [0, 1], transform: ['scale(0.95)', 'scale(1)'] },
      { duration: 0.3, delay: window.motion.stagger(0.08), easing: 'ease-out' }
    );
  }

  function animateCountUp(element, targetValue, prefix = '', suffix = '', duration = 1000) {
    if (!element) return;

    const startValue = 0;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (targetValue - startValue) * eased;

      if (targetValue >= 1000000) {
        element.textContent = prefix + (currentValue / 1000000).toFixed(1) + 'M' + suffix;
      } else if (targetValue >= 1000) {
        element.textContent = prefix + (currentValue / 1000).toFixed(1) + 'K' + suffix;
      } else if (targetValue < 1) {
        element.textContent = prefix + currentValue.toFixed(2) + suffix;
      } else {
        element.textContent = prefix + Math.round(currentValue).toLocaleString() + suffix;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }


  function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  function formatCurrency(num) {
    return '$' + num.toFixed(2);
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getProviderDescription(providerId) {
    const descriptions = {
      anthropic: 'Claude AI Assistant',
      openai: 'GPT & DALL-E APIs',
      openrouter: 'Multi-model Router',
      copilot: 'AI Code Completions & Chat',
      google: 'Gemini & PaLM APIs',
      zai: 'GLM-4 Coding Assistant',
      vercel: 'Edge Functions',
      warp: 'Warp Terminal AI',
    };
    return descriptions[providerId] || 'AI Provider';
  }

  async function fetchUsageData(days = 7) {
    try {
      const response = await fetch(`${API_BASE}/usage?days=${days}`);
      if (!response.ok) throw new Error('Failed to fetch usage data');
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Unknown error');
      return result.data;
    } catch (error) {
      console.error('Error fetching usage data:', error);
      throw error;
    }
  }

  async function fetchApiKeys() {
    try {
      const response = await fetch(`${API_BASE}/config/keys`);
      if (!response.ok) throw new Error('Failed to fetch API keys');
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Unknown error');
      return result.data;
    } catch (error) {
      console.error('Error fetching API keys:', error);
      throw error;
    }
  }

  async function setApiKey(provider, apiKey) {
    try {
      const response = await fetch(`${API_BASE}/config/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey }),
      });
      if (!response.ok) throw new Error('Failed to set API key');
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Unknown error');
      return result.data;
    } catch (error) {
      console.error('Error setting API key:', error);
      throw error;
    }
  }

  async function deleteApiKey(provider) {
    try {
      const response = await fetch(`${API_BASE}/config/keys`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      if (!response.ok) throw new Error('Failed to delete API key');
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Unknown error');
      return result.data;
    } catch (error) {
      console.error('Error deleting API key:', error);
      throw error;
    }
  }

  function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('error').classList.add('hidden');
    document.getElementById('dashboard').classList.add('hidden');
  }

  function showError(message) {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('error').classList.remove('hidden');
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('error-message').textContent = message;
  }

  function showDashboard() {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('error').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
  }

  function updateSummaryStats(summary) {
    // Animate summary cards first
    animateSummaryCards();

    // Animate counting numbers
    animateCountUp(document.getElementById('total-requests'), summary.totalRequests);
    animateCountUp(document.getElementById('total-cost'), summary.totalCost, '$');
    animateCountUp(document.getElementById('total-tokens'), summary.totalTokens);

    // Latency doesn't need counting animation - just set it
    document.getElementById('avg-latency').textContent = summary.avgLatency.toFixed(1) + 's';

    const requestsChange = document.getElementById('requests-change');
    const costChange = document.getElementById('cost-change');
    const tokensChange = document.getElementById('tokens-change');
    const latencyChange = document.getElementById('latency-change');

    function updateChange(element, value) {
      if (value === undefined || value === 0) {
        element.textContent = '-';
        element.className = 'text-xs mt-1 text-zinc-500';
      } else if (value > 0) {
        element.textContent = `+${value.toFixed(1)}%`;
        element.className = 'text-xs mt-1 text-emerald-500';
      } else {
        element.textContent = `${value.toFixed(1)}%`;
        element.className = 'text-xs mt-1 text-rose-500';
      }
    }

    updateChange(requestsChange, summary.requestChange);
    updateChange(costChange, summary.costChange);
    updateChange(tokensChange, summary.tokenChange);
    updateChange(latencyChange, summary.latencyChange);
  }

  function updateProviderCards(providers) {
    const container = document.getElementById('providers-grid');
    container.innerHTML = '';

    providers.forEach(provider => {
      const card = createProviderCard(provider);
      container.appendChild(card);
    });

    // Animate progress bars after DOM update
    requestAnimationFrame(() => animateProgressBars());
  }

  function animateProgressBars() {
    const bars = document.querySelectorAll('[data-target-width]');
    bars.forEach((bar, index) => {
      const targetWidth = bar.dataset.targetWidth;

      // Check if Motion.js is available
      if (window.motion && typeof window.motion.animate === 'function') {
        // Set initial width to 0
        bar.style.width = '0%';
        // Animate from 0 to target using Motion.js
        try {
          window.motion.animate(bar,
            { width: targetWidth },
            { duration: 0.6, delay: index * 0.05, easing: 'ease-out' }
          ).finished.then(() => {
            bar.style.width = targetWidth;
          });
        } catch (e) {
          // Fallback if animation fails
          bar.style.width = targetWidth;
        }
      } else {
        // Fallback: just set the width directly with CSS transition
        bar.style.transition = 'width 0.5s ease-out';
        bar.style.width = targetWidth;
      }
    });
  }

  function createProviderCard(provider) {
    const card = document.createElement('div');
    card.className = 'glass-card rounded-xl p-6 provider-card glow-effect relative';

    const initials = provider.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const gradient = providerGradients[provider.id] || 'from-gray-600 to-gray-800';
    const color = providerColors[provider.id] || '#52525b';

    const statusClass = provider.status === 'active' ? 'text-emerald-500' : 'text-rose-500';
    const statusText = provider.status === 'active' ? 'Active' : 'Error';

    const budget = budgets[provider.id] || null;
    const usagePercent = budget ? Math.min(100, (provider.cost / budget) * 100) : Math.min(100, (provider.requests / 1500000) * 100);
    const remaining = budget ? budget - provider.cost : null;

    let warningIndicator = '';
    if (provider.rateLimit && provider.rateLimit.percentage < 20) {
      warningIndicator = '<div class="absolute top-2 right-2"><span class="text-xs bg-rose-500 px-2 py-1 rounded">Low limit</span></div>';
    } else if (provider.quota && provider.quota.percentage > 80) {
      warningIndicator = '<div class="absolute top-2 right-2"><span class="text-xs bg-amber-500 px-2 py-1 rounded">High usage</span></div>';
    } else if (budget && usagePercent > 80) {
      warningIndicator = '<div class="absolute top-2 right-2"><span class="text-xs bg-amber-500 px-2 py-1 rounded">Near budget</span></div>';
    }

    let additionalMetrics = '';

    if (budget !== null) {
      const remainingPercent = Math.max(0, ((budget - provider.cost) / budget) * 100);
      const remainingClass = remainingPercent > 20 ? 'text-emerald-500' : remainingPercent > 10 ? 'text-amber-500' : 'text-rose-500';
      const barClass = remainingPercent > 20 ? 'bg-emerald-500' : remainingPercent > 10 ? 'bg-amber-500' : 'bg-rose-500';

      additionalMetrics += `
        <div class="mt-3 pt-3 border-t border-zinc-800">
          <div class="flex justify-between text-sm mb-1">
            <span class="text-zinc-400">Budget</span>
            <span class="text-zinc-300">$${budget.toFixed(2)}</span>
          </div>
          <div class="flex justify-between text-sm mb-1">
            <span class="text-zinc-400">Remaining</span>
            <span class="${remainingClass}">$${remaining.toFixed(2)}</span>
          </div>
          <div class="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div class="h-full rounded-full ${barClass}" style="width: ${remainingPercent}%; background: inherit; transition: width 0.5s ease-out"></div>
          </div>
        </div>
      `;
    }

    // Special handling for Warp credit breakdown
    if (provider.id === 'warp' && provider.codingMetrics?.creditBreakdown) {
      const cb = provider.codingMetrics.creditBreakdown;
      const recurring = cb.recurring;
      const addon = cb.addon;

      // Recurring credits bar
      const recurringClass = recurring.percentRemaining > 30 ? 'text-emerald-500' : recurring.percentRemaining > 10 ? 'text-amber-500' : 'text-rose-500';
      const recurringBarClass = recurring.percentRemaining > 30 ? 'bg-emerald-500' : recurring.percentRemaining > 10 ? 'bg-amber-500' : 'bg-rose-500';

      additionalMetrics += `
        <div class="mt-3 pt-3 border-t border-zinc-800">
          <div class="flex justify-between text-sm mb-1">
            <span class="text-zinc-400">Monthly Credits</span>
            <span class="${recurringClass}">${recurring.remaining} / ${recurring.limit}</span>
          </div>
          <div class="h-3 bg-zinc-800 rounded-full overflow-hidden">
            <div class="h-full rounded-full ${recurringBarClass}" style="width: ${recurring.percentRemaining}%; transition: width 0.5s ease-out"></div>
          </div>
          <div class="flex justify-between text-xs text-zinc-500 mt-1">
            <span>${recurring.percentRemaining}% remaining</span>
            <span>Resets: ${formatDate(recurring.resetsAt)}</span>
          </div>
        </div>
      `;

      // Add-on credits with grant details
      if (addon.total > 0) {
        additionalMetrics += `
          <div class="mt-3 pt-3 border-t border-zinc-800">
            <div class="flex justify-between text-sm mb-2">
              <span class="text-zinc-400">Add-on Credits</span>
              <span class="text-cyan-400 font-medium">${formatNumber(addon.total)}</span>
            </div>
            <div class="space-y-2">
              ${addon.grants.map((grant, i) => {
          const expDate = new Date(grant.expiration);
          const usedPercent = ((grant.granted - grant.remaining) / grant.granted) * 100;
          return `
                  <div class="p-2 bg-zinc-900/50 rounded">
                    <div class="flex justify-between text-xs mb-1">
                      <span class="text-zinc-500">Grant ${i + 1}</span>
                      <span class="text-zinc-300">${formatNumber(grant.remaining)} / ${formatNumber(grant.granted)}</span>
                    </div>
                    <div class="h-2 bg-zinc-800 rounded-full overflow-hidden mb-1">
                      <div class="h-full rounded-full bg-cyan-500/70" style="width: ${100 - usedPercent}%; transition: width 0.5s ease-out"></div>
                    </div>
                    <div class="text-xs text-zinc-600">Expires: ${expDate.toLocaleDateString()}</div>
                  </div>
                `;
        }).join('')}
            </div>
          </div>
        `;
      }

      // Total available summary
      additionalMetrics += `
        <div class="mt-3 pt-3 border-t border-zinc-800">
          <div class="flex justify-between items-center">
            <span class="text-sm text-zinc-400">Total Available</span>
            <span class="text-lg font-bold ${cb.usingAddonCredits ? 'text-amber-400' : 'text-emerald-400'}">${formatNumber(cb.totalAvailable)}</span>
          </div>
        </div>
      `;

      // Warning if using add-on credits
      if (cb.usingAddonCredits) {
        additionalMetrics += `
          <div class="mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/30">
            <span class="text-xs text-amber-400">⚠️ Monthly depleted - using add-on credits</span>
          </div>
        `;
      }
    } else if (provider.rateLimit && provider.id !== 'copilot') {
      // Skip rateLimit for Copilot since it uses quota for Premium Requests
      const rateLimitPercent = provider.rateLimit.percentage;
      const usedPercent = 100 - rateLimitPercent;
      const usedClass = usedPercent > 80 ? 'text-rose-500' : usedPercent > 50 ? 'text-amber-500' : 'text-emerald-500';
      const barClass = usedPercent > 80 ? 'bg-rose-500' : usedPercent > 50 ? 'bg-amber-500' : 'bg-emerald-500';
      let labelText = 'Rate Limit';
      if (provider.id === 'anthropic') labelText = '5-Hour Usage';
      if (provider.id === 'antigravity') labelText = '4-Hour Usage';
      if (provider.id === 'zai') labelText = '5-Hour Requests';

      // For Z.ai, show exact counts
      const rateLimitUsed = provider.rateLimit.limit - provider.rateLimit.remaining;
      const rateLimitDisplay = provider.id === 'zai' 
        ? `${formatNumber(rateLimitUsed)} / ${formatNumber(provider.rateLimit.limit)}`
        : `${usedPercent}% used`;

      additionalMetrics += `
        <div class="mt-3 pt-3 border-t border-zinc-800">
          <div class="flex justify-between text-sm mb-1">
            <span class="text-zinc-400">${labelText}</span>
            <span class="${usedClass}">${rateLimitDisplay}</span>
          </div>
          <div class="h-3 bg-zinc-800 rounded-full overflow-hidden">
            <div class="h-full rounded-full ${barClass}" style="width: ${usedPercent}%; transition: width 0.5s ease-out"></div>
          </div>
          <div class="text-xs text-zinc-500 mt-2">Resets: ${formatDate(provider.rateLimit.reset)}</div>
        </div>
      `;
    }

    if (provider.quota) {
      const quotaPercent = provider.quota.percentage;
      const quotaClass = quotaPercent > 80 ? 'text-rose-500' : quotaPercent > 50 ? 'text-amber-500' : 'text-emerald-500';
      const barClass = quotaPercent > 80 ? 'bg-rose-500' : quotaPercent > 50 ? 'bg-amber-500' : 'bg-emerald-500';
      let labelText = provider.id === 'anthropic' ? '7-Day Usage' : 'Monthly Quota';
      if (provider.id === 'copilot') labelText = 'Premium Requests';
      if (provider.id === 'openrouter') labelText = 'Credit Used';
      if (provider.id === 'zai') labelText = '5-Day Tokens';

      // For Z.ai, show exact token counts
      let quotaDisplay = `${quotaPercent}% used`;
      if (provider.id === 'zai') {
        const tokensUsed = provider.quota.monthlyUsed;
        const tokensLimit = provider.quota.monthlyLimit;
        quotaDisplay = `${formatNumber(tokensUsed)} / ${formatNumber(tokensLimit)}`;
      }

      // OpenRouter: Credit Used bar at top, then balance + Top Off button at bottom
      if (provider.id === 'openrouter') {
        const creditsUsed = provider.quota.monthlyUsed;
        const creditsTotal = provider.quota.monthlyLimit;
        const creditsRemaining = creditsTotal - creditsUsed;
        
        // Credit Used bar
        additionalMetrics += `
          <div class="mt-3 pt-3 border-t border-zinc-800">
            <div class="flex justify-between text-sm mb-1">
              <span class="text-zinc-400">${labelText}</span>
              <span class="${quotaClass}">${formatCurrency(creditsUsed)} / ${formatCurrency(creditsTotal)}</span>
            </div>
            <div class="h-3 bg-zinc-800 rounded-full overflow-hidden">
              <div class="h-full rounded-full ${barClass}" style="width: ${quotaPercent}%; transition: width 0.5s ease-out"></div>
            </div>
            <div class="text-xs text-zinc-500 mt-1">${quotaPercent}% used</div>
          </div>
        `;
        
        // Balance + Top Off button at bottom (added after model breakdown)
        // We'll add this via a flag that gets checked later
        provider._showTopOffButton = true;
        provider._creditsRemaining = creditsRemaining;
      } else {
        additionalMetrics += `
          <div class="mt-3 pt-3 border-t border-zinc-800">
            <div class="flex justify-between text-sm mb-1">
              <span class="text-zinc-400">${labelText}</span>
              <span class="${quotaClass}">${quotaDisplay}</span>
            </div>
            <div class="h-3 bg-zinc-800 rounded-full overflow-hidden">
              <div class="h-full rounded-full ${barClass}" style="width: ${quotaPercent}%; transition: width 0.5s ease-out"></div>
            </div>
            <div class="text-xs text-zinc-500 mt-2">Resets: ${formatDate(provider.quota.resetDate)}</div>
          </div>
        `;
      }
    }

    // Skip these for Warp and Copilot since they show this info elsewhere
    if (provider.id !== 'warp' && provider.id !== 'copilot') {


      if (provider.suggestions) {
        additionalMetrics += `
          <div class="mt-2">
            <div class="text-xs text-zinc-500 mb-1">Suggestions</div>
            <div class="text-sm font-medium text-zinc-300">${formatNumber(provider.suggestions)}</div>
          </div>
        `;
      }

      if (provider.edgeInvocations) {
        additionalMetrics += `
          <div class="mt-2">
            <div class="text-xs text-zinc-500 mb-1">Edge Invocations</div>
            <div class="text-sm font-medium text-zinc-300">${formatNumber(provider.edgeInvocations)}</div>
          </div>
        `;
      }
    }

    // Model Breakdown (for Antigravity/Gemini etc)
    if (provider.modelBreakdown && provider.modelBreakdown.length > 0) {
      additionalMetrics += `
        <div class="mt-3 pt-3 border-t border-zinc-800">
          <div class="text-xs text-zinc-500 mb-2 font-medium">Model Usage</div>
          <div class="space-y-2">
            ${provider.modelBreakdown.map(m => `
              <div class="flex items-center justify-between text-xs">
                <span class="text-zinc-400">${m.model}</span>
                <div class="flex items-center gap-3">
                    <span class="text-zinc-500">${formatNumber(m.requests)} req</span>
                    <span class="text-zinc-300 font-medium">${formatCurrency(m.cost)}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // OpenRouter: Balance + Top Off button at bottom
    if (provider._showTopOffButton) {
      additionalMetrics += `
        <div class="mt-3 pt-3 border-t border-zinc-800">
          <div class="flex justify-between items-center">
            <div class="text-lg font-bold text-emerald-400">${formatCurrency(provider._creditsRemaining)}</div>
            <a href="https://openrouter.ai/credits" target="_blank" style="
              padding: 8px 16px;
              border-radius: 8px;
              background: rgba(6, 182, 212, 0.1);
              border: 1px solid rgba(6, 182, 212, 0.3);
              color: #22d3ee;
              font-size: 14px;
              font-weight: 500;
              text-decoration: none;
              transition: all 0.15s ease;
            " onmouseover="this.style.background='rgba(6,182,212,0.2)'" onmouseout="this.style.background='rgba(6,182,212,0.1)'">
              Top Off →
            </a>
          </div>
        </div>
      `;
    }

    // Coding metrics for Copilot and similar providers (skip for Warp - has its own breakdown)
    if (provider.codingMetrics && provider.id !== 'warp') {
      const cm = provider.codingMetrics;

      // Claude-specific metrics (cache, sessions)
      if (provider.id === 'anthropic') {
        const cacheClass = cm.cacheHitRate >= 80 ? 'text-emerald-500' : cm.cacheHitRate >= 50 ? 'text-amber-500' : 'text-zinc-400';
        const savings = cm.marketValue && cm.subscriptionCost ? cm.marketValue - cm.subscriptionCost : 0;
        const savingsClass = savings > 0 ? 'text-emerald-500' : 'text-zinc-400';

        // Value comparison section
        if (cm.marketValue !== undefined) {
          additionalMetrics += `
            <div class="mt-3 pt-3 border-t border-zinc-800">
              <div class="text-xs text-zinc-500 mb-2 font-medium">Cost Breakdown</div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <div class="text-xs text-zinc-500">Market Value</div>
                  <div class="text-sm font-medium text-amber-400">${formatCurrency(cm.marketValue)}</div>
                </div>
                <div>
                  <div class="text-xs text-zinc-500">Actual Cost</div>
                  <div class="text-sm font-medium text-zinc-300">${formatCurrency(cm.subscriptionCost || 20)}/mo</div>
                </div>
                <div class="col-span-2">
                  <div class="text-xs text-zinc-500">You Saved</div>
                  <div class="text-sm font-bold ${savingsClass}">${formatCurrency(savings)}</div>
                </div>
              </div>
            </div>
          `;
        }

        // Session stats section  
        additionalMetrics += `
          <div class="mt-3 pt-3 border-t border-zinc-800">
            <div class="text-xs text-zinc-500 mb-2 font-medium">Session Stats</div>
            <div class="grid grid-cols-2 gap-2">
              ${cm.sessions !== undefined ? `
              <div>
                <div class="text-xs text-zinc-500">Sessions</div>
                <div class="text-sm font-medium text-zinc-300">${formatNumber(cm.sessions)}</div>
              </div>
              ` : ''}
              ${cm.toolCalls !== undefined ? `
              <div>
                <div class="text-xs text-zinc-500">Tool Calls</div>
                <div class="text-sm font-medium text-zinc-300">${formatNumber(cm.toolCalls)}</div>
              </div>
              ` : ''}
              ${cm.cacheHitRate !== undefined ? `
              <div>
                <div class="text-xs text-zinc-500">Cache Hit Rate</div>
                <div class="text-sm font-medium ${cacheClass}">${cm.cacheHitRate}%</div>
              </div>
              ` : ''}
              ${cm.cacheReadTokens !== undefined ? `
              <div>
                <div class="text-xs text-zinc-500">Cache Tokens</div>
                <div class="text-sm font-medium text-cyan-400">${formatNumber(cm.cacheReadTokens)}</div>
              </div>
              ` : ''}
            </div>
          </div>
        `;
      } else if (provider.id === 'openrouter') {
        // OpenRouter: skip - we show balance + Top Off button elsewhere
      } else {
        // Copilot-style coding metrics
        const acceptanceClass = cm.acceptanceRate >= 30 ? 'text-emerald-500' : cm.acceptanceRate >= 15 ? 'text-amber-500' : 'text-zinc-400';

        // Lines of Code section (if available)
        if (cm.linesGenerated !== undefined || cm.linesAccepted !== undefined) {
          const linesAcceptRate = cm.linesGenerated && cm.linesAccepted
            ? Math.round((cm.linesAccepted / cm.linesGenerated) * 100)
            : null;
          const linesClass = linesAcceptRate && linesAcceptRate >= 50 ? 'text-emerald-500' : 'text-amber-500';

          additionalMetrics += `
            <div class="mt-3 pt-3 border-t border-zinc-800">
              <div class="text-xs text-zinc-500 mb-2 font-medium">Lines of Code</div>
              <div class="grid grid-cols-2 gap-2">
                ${cm.linesGenerated !== undefined ? `
                <div>
                  <div class="text-xs text-zinc-500">Suggested</div>
                  <div class="text-sm font-medium text-zinc-300">${formatNumber(cm.linesGenerated)}</div>
                </div>
                ` : ''}
                ${cm.linesAccepted !== undefined ? `
                <div>
                  <div class="text-xs text-zinc-500">Accepted</div>
                  <div class="text-sm font-medium text-emerald-400">${formatNumber(cm.linesAccepted)}</div>
                </div>
                ` : ''}
              </div>
              ${linesAcceptRate !== null ? `
              <div class="mt-2">
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-zinc-500">Line Accept Rate</span>
                  <span class="${linesClass}">${linesAcceptRate}%</span>
                </div>
                <div class="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div class="h-full rounded-full bg-emerald-500" style="width: ${linesAcceptRate}%; transition: width 0.5s ease-out"></div>
                </div>
              </div>
              ` : ''}
            </div>
          `;
        }

        // Suggestions & Chats section
        if (cm.suggestionsShown !== undefined || cm.chatsCompleted !== undefined) {
          additionalMetrics += `
            <div class="mt-3 pt-3 border-t border-zinc-800">
              <div class="text-xs text-zinc-500 mb-2 font-medium">Activity</div>
              <div class="grid grid-cols-2 gap-2">
                ${cm.suggestionsShown !== undefined ? `
                <div>
                  <div class="text-xs text-zinc-500">Suggestions</div>
                  <div class="text-sm font-medium text-zinc-300">${formatNumber(cm.suggestionsShown)}</div>
                </div>
                ` : ''}
                ${cm.suggestionsAccepted !== undefined ? `
                <div>
                  <div class="text-xs text-zinc-500">Accepted</div>
                  <div class="text-sm font-medium text-emerald-400">${formatNumber(cm.suggestionsAccepted)}</div>
                </div>
                ` : ''}
                ${cm.acceptanceRate !== undefined ? `
                <div>
                  <div class="text-xs text-zinc-500">Accept Rate</div>
                  <div class="text-sm font-medium ${acceptanceClass}">${cm.acceptanceRate}%</div>
                </div>
                ` : ''}
                ${cm.chatsCompleted !== undefined ? `
                <div>
                  <div class="text-xs text-zinc-500">Total Chats</div>
                  <div class="text-sm font-medium text-blue-400">${formatNumber(cm.chatsCompleted)}</div>
                </div>
                ` : ''}
                ${cm.activeUsers !== undefined ? `
                <div>
                  <div class="text-xs text-zinc-500">Active Users</div>
                  <div class="text-sm font-medium text-zinc-300">${cm.activeUsers}</div>
                </div>
                ` : ''}
              </div>
            </div>
          `;
        }
      }
    }

    // Add View Details button for Warp
    const detailsButton = provider.id === 'warp' && provider.codingMetrics ? `
      <button onclick="showWarpDetails('${provider.id}')" style="
        margin-top: 12px;
        width: 100%;
        padding: 10px 12px;
        border-radius: 8px;
        background: rgba(6, 182, 212, 0.1);
        border: 1px solid rgba(6, 182, 212, 0.3);
        color: #22d3ee;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
      " onmouseover="this.style.background='rgba(6,182,212,0.2)'" onmouseout="this.style.background='rgba(6,182,212,0.1)'">
        View Full Details →
      </button>
    ` : '';

    // Skip the arbitrary requests bar for subscription plans (Copilot, Z.ai)
    const showRequestsBar = provider.id !== 'copilot' && provider.id !== 'zai';

    card.innerHTML = `
      ${warningIndicator}
      <div class="flex items-start justify-between mb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center">
            <span class="text-white font-bold text-sm">${initials}</span>
          </div>
          <div>
            <h3 class="font-semibold text-zinc-200">${provider.name}</h3>
            <p class="text-xs text-zinc-500">${getProviderDescription(provider.id)}${provider.planName ? ` · <span class="text-blue-400">${provider.planName}</span>` : ''}</p>
          </div>
        </div>
        <span class="text-xs ${statusClass}">${statusText}</span>
      </div>
      <div class="space-y-4">
        <div class="grid grid-cols-3 gap-2 pt-1">
          ${showRequestsBar ? `
          <div>
            <div class="text-xs text-zinc-500 mb-1">Requests</div>
            <div class="text-sm font-medium text-zinc-300">${formatNumber(provider.requests)}</div>
          </div>
          ` : ''}
          <div>
            <div class="text-xs text-zinc-500 mb-1">${provider.id === 'copilot' ? 'Plan Cost' : 'Cost'}</div>
            <div class="text-sm font-medium text-zinc-300">${provider.id === 'copilot' ? formatCurrency(provider.cost) + '/mo' : formatCurrency(provider.cost)}</div>
          </div>
          ${provider.tokens && provider.id !== 'copilot' ? `
          <div>
            <div class="text-xs text-zinc-500 mb-1">Tokens</div>
            <div class="text-sm font-medium text-zinc-300">${formatNumber(provider.tokens)}</div>
          </div>
          ` : ''}
        </div>
        ${additionalMetrics}
        ${detailsButton}
      </div>
    `;

    // Store provider data on card for modal access
    card.dataset.providerData = JSON.stringify(provider);

    return card;
  }

  function updateCharts(data = null) {
    if (data) currentData = data;
    // We need existing data to redraw, if called without data (theme switch)
    if (!currentData) return;

    const ctxTimeline = document.getElementById('timeline-chart');
    const ctxDistribution = document.getElementById('distribution-chart');

    if (!ctxTimeline || !ctxDistribution) return;

    // Ensure chart instances exist in state
    if (!charts.timeline) {
      charts.timeline = null;
    }
    if (!charts.distribution) {
      charts.distribution = null;
    }

    const colors = themeManager.getChartColors();

    // Common Options
    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: colors.text }
        }
      },
      scales: {
        x: {
          grid: { color: colors.grid },
          ticks: { color: colors.text }
        },
        y: {
          grid: { color: colors.grid },
          ticks: { color: colors.text }
        }
      }
    };

    // --- Prepare Timeline Data ---
    // We need valid history or timeline data
    // The current implementation seems to expect 'data.timeline' or 'data.history'
    // Let's standardise on using currentData.history if available (from backend)
    // Or fallback to dummy logical distribution if needed

    let timelineLabels = [];
    let providerDatasets = [];

    if (currentData.history && Array.isArray(currentData.history)) {
      timelineLabels = currentData.history.map(h => formatTimeLabel(h.timestamp));
      const providers = [...new Set(currentData.history.flatMap(h => Object.keys(h.providers)))];
      providerDatasets = providers.map(pId => {
        const pColor = providerColors[pId] || '#cbd5e1';
        return {
          label: pId.charAt(0).toUpperCase() + pId.slice(1),
          data: currentData.history.map(h => h.providers[pId] || 0),
          borderColor: pColor,
          backgroundColor: hexToRgba(pColor, 0.1),
          tension: 0.4,
          fill: true
        };
      });
    } else if (currentData.providers) {
      // Fallback if full history object isn't structurally perfect yet
      // Use the logic from the previous file content (simulated daily breakdown)
      timelineLabels = generateDateLabels(7);
      providerDatasets = currentData.providers.map((provider, index) => {
        const color = providerColors[provider.id] || `hsl(${index * 60}, 70%, 50%)`;
        const dailyData = distributeUsageAcrossDays(provider.requests, timelineLabels.length);
        return {
          label: provider.name,
          data: dailyData,
          borderColor: color,
          backgroundColor: hexToRgba(color, 0.1),
          tension: 0.4,
          fill: true
        };
      });
    }

    // Render/Update Timeline
    if (charts.timeline) {
      charts.timeline.data.labels = timelineLabels;
      charts.timeline.data.datasets = providerDatasets;
      charts.timeline.options.scales.x.grid.color = colors.grid;
      charts.timeline.options.scales.x.ticks.color = colors.text;
      charts.timeline.options.scales.y.grid.color = colors.grid;
      charts.timeline.options.scales.y.ticks.color = colors.text;
      charts.timeline.options.plugins.legend.labels.color = colors.text;
      charts.timeline.update();
    } else {
      charts.timeline = new Chart(ctxTimeline, {
        type: 'line',
        data: { labels: timelineLabels, datasets: providerDatasets },
        options: commonOptions
      });
    }

    // --- Prepare Distribution Data ---
    let distLabels = [];
    let distData = [];
    let distColors = [];

    if (currentData.providers) {
      distLabels = currentData.providers.map(p => p.name);
      distData = currentData.providers.map(p => p.requests);
      distColors = currentData.providers.map(p => providerColors[p.id] || '#cbd5e1');
    }

    if (charts.distribution) {
      charts.distribution.data.labels = distLabels;
      charts.distribution.data.datasets[0].data = distData;
      charts.distribution.data.datasets[0].backgroundColor = distColors;
      charts.distribution.options.plugins.legend.labels.color = colors.text;
      charts.distribution.update();
    } else {
      const distOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: colors.text }
          }
        }
      };

      charts.distribution = new Chart(ctxDistribution, {
        type: 'doughnut',
        data: {
          labels: distLabels,
          datasets: [{
            data: distData,
            backgroundColor: distColors,
            borderWidth: 0
          }]
        },
        options: distOptions
      });
    }
  }


  // Helper: Generate date labels for the last N days
  function generateDateLabels(days) {
    const labels = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    return labels;
  }

  // Helper: Distribute total usage across days (with some variance)
  function distributeUsageAcrossDays(total, days) {
    if (total === 0) return Array(days).fill(0);
    const dailyAvg = total / days;
    const data = [];
    let remaining = total;

    for (let i = 0; i < days - 1; i++) {
      // Add some variance (70% - 130% of average)
      const variance = 0.7 + Math.random() * 0.6;
      const dayValue = Math.round(dailyAvg * variance);
      data.push(Math.min(dayValue, remaining));
      remaining -= dayValue;
    }
    // Last day gets the remainder
    data.push(Math.max(0, remaining));
    return data;
  }

  // Helper: Convert hex color to rgba
  function hexToRgba(hex, alpha) {
    if (hex.startsWith('#')) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return hex;
  }

  function updateAlertBanner(providers) {
    const alertBanner = document.getElementById('alert-banner');
    const alertMessage = document.getElementById('alert-message');

    const warnings = [];
    providers.forEach(p => {
      if (p.rateLimit && p.rateLimit.percentage < 20) {
        warnings.push(`${p.name}: Only ${p.rateLimit.remaining} requests remaining`);
      }
      if (p.quota && p.quota.percentage > 80) {
        warnings.push(`${p.name}: ${p.quota.percentage}% of quota used`);
      }
    });

    if (warnings.length > 0) {
      alertMessage.textContent = warnings.join(' | ');
      alertBanner.classList.remove('hidden');
    } else {
      alertBanner.classList.add('hidden');
    }
  }

  function updateQuickStats(providers, summary) {
    // Active providers count
    const activeProviders = providers.filter(p => p.status === 'active').length;
    document.getElementById('qs-providers').textContent = activeProviders;

    // Collect all models from all providers
    const allModels = [];
    providers.forEach(p => {
      if (p.modelBreakdown) {
        p.modelBreakdown.forEach(m => {
          const existing = allModels.find(am => am.model === m.model);
          if (existing) {
            existing.requests += m.requests;
            existing.cost += m.cost;
          } else {
            allModels.push({ ...m });
          }
        });
      }
    });

    // Models count
    document.getElementById('qs-models').textContent = allModels.length;

    // Top provider by cost
    const sortedByCost = [...providers].sort((a, b) => b.cost - a.cost);
    if (sortedByCost.length > 0 && sortedByCost[0].cost > 0) {
      document.getElementById('qs-top-provider').textContent = sortedByCost[0].name;
      document.getElementById('qs-top-provider-cost').textContent = formatCurrency(sortedByCost[0].cost);
    } else {
      document.getElementById('qs-top-provider').textContent = '-';
      document.getElementById('qs-top-provider-cost').textContent = '-';
    }

    // Top model by requests
    const sortedByReqs = [...allModels].sort((a, b) => b.requests - a.requests);
    if (sortedByReqs.length > 0) {
      document.getElementById('qs-top-model').textContent = sortedByReqs[0].model;
      document.getElementById('qs-top-model-reqs').textContent = formatNumber(sortedByReqs[0].requests) + ' req';
    } else {
      document.getElementById('qs-top-model').textContent = '-';
      document.getElementById('qs-top-model-reqs').textContent = '-';
    }

    // Avg cost per request
    if (summary.totalRequests > 0) {
      const avgCost = summary.totalCost / summary.totalRequests;
      document.getElementById('qs-avg-cost').textContent = '$' + avgCost.toFixed(4);
    } else {
      document.getElementById('qs-avg-cost').textContent = '-';
    }
  }

  async function refreshData() {
    const timeRange = document.getElementById('time-range').value;

    try {
      const data = await fetchUsageData(parseInt(timeRange));
      currentData = data;

      updateSummaryStats(data.summary);
      updateProviderCards(data.providers);
      animateProviderCards(); // Trigger staggered animation
      updateCharts(data);
      updateAlertBanner(data.providers);
      updateQuickStats(data.providers, data.summary);

      document.getElementById('status-text').textContent = 'Live';
      document.getElementById('status-dot').className = 'w-2 h-2 rounded-full bg-emerald-500 pulse-dot';

      showDashboard();
    } catch (error) {
      showError(error.message || 'Failed to fetch data');
      document.getElementById('status-text').textContent = 'Offline';
      document.getElementById('status-dot').className = 'w-2 h-2 rounded-full bg-rose-500';
    }
  }

  function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(refreshData, 5 * 60 * 1000);
  }

  async function initApiKeysModal() {
    const modal = document.getElementById('api-keys-modal');
    const form = document.getElementById('api-keys-form');

    try {
      const keys = await fetchApiKeys();

      // Define provider groups with descriptions
      const oauthProviders = [
        {
          id: 'anthropic_oauth',
          name: 'Claude Code OAuth Token',
          description: 'From Keychain: security find-generic-password -s "Claude Code-credentials" -w',
          placeholder: 'Paste OAuth access token...'
        },
        {
          id: 'copilot_oauth',
          name: 'GitHub Copilot OAuth Token',
          description: 'From ~/.config/github-copilot/apps.json → oauth_token',
          placeholder: 'Paste OAuth token...'
        }
      ];

      const apiKeyProviders = [
        { id: 'anthropic', name: 'Anthropic API Key', description: 'From console.anthropic.com' },
        { id: 'github', name: 'GitHub Token', description: 'PAT with read:org, read:user scopes' },
        { id: 'zai', name: 'Z.ai API Key', description: 'From Z.ai platform' },
        { id: 'google', name: 'Google AI API Key', description: 'From AI Studio' },
        { id: 'openai', name: 'OpenAI API Key', description: 'Optional' },
        { id: 'openrouter', name: 'OpenRouter API Key', description: 'Optional' },
      ];

      // Build OAuth section
      let html = `
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-zinc-200 mb-3 flex items-center gap-2">
            <span class="text-amber-500">🔐</span> OAuth Tokens
          </h3>
          <p class="text-xs text-zinc-500 mb-4">These tokens provide richer usage data than API keys.</p>
          <div class="space-y-3">
      `;

      for (const provider of oauthProviders) {
        const info = keys[provider.id] || { configured: false, masked: null };
        html += `
          <div class="p-4 glass-card rounded-lg border ${info.configured ? 'border-emerald-800' : 'border-zinc-800'}">
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm font-medium text-zinc-300">${provider.name}</label>
              ${info.configured ? '<span class="text-xs text-emerald-500">✓ Connected</span>' : '<span class="text-xs text-zinc-500">Not set</span>'}
            </div>
            <p class="text-xs text-zinc-500 mb-2">${provider.description}</p>
            <div class="flex gap-2">
              <input type="password" 
                     id="key-${provider.id}" 
                     class="flex-1 glass-card rounded-lg px-3 py-2 bg-transparent border border-zinc-800 text-sm text-zinc-300 focus:outline-none focus:border-zinc-700"
                     placeholder="${info.configured ? info.masked : provider.placeholder}"
                     data-provider="${provider.id}">
              <button class="save-key-btn glass-card rounded-lg px-4 py-2 bg-emerald-600 border border-emerald-700 text-sm text-white hover:bg-emerald-500" data-provider="${provider.id}">
                Save
              </button>
            </div>
          </div>
        `;
      }

      html += `
          </div>
        </div>
        
        <div class="border-t border-zinc-800 pt-6">
          <h3 class="text-lg font-semibold text-zinc-200 mb-3 flex items-center gap-2">
            <span class="text-blue-500">🔑</span> API Keys
          </h3>
          <p class="text-xs text-zinc-500 mb-4">Standard API keys for each provider.</p>
          <div class="space-y-3">
      `;

      for (const provider of apiKeyProviders) {
        const info = keys[provider.id] || { configured: false, masked: null };
        html += `
          <div class="p-4 glass-card rounded-lg border ${info.configured ? 'border-emerald-800' : 'border-zinc-800'}">
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm font-medium text-zinc-300">${provider.name}</label>
              ${info.configured ? '<span class="text-xs text-emerald-500">✓ Connected</span>' : '<span class="text-xs text-zinc-500">Not set</span>'}
            </div>
            <p class="text-xs text-zinc-500 mb-2">${provider.description}</p>
            <div class="flex gap-2">
              <input type="password" 
                     id="key-${provider.id}" 
                     class="flex-1 glass-card rounded-lg px-3 py-2 bg-transparent border border-zinc-800 text-sm text-zinc-300 focus:outline-none focus:border-zinc-700"
                     placeholder="${info.configured ? info.masked : 'Enter API key...'}"
                     data-provider="${provider.id}">
              <button class="save-key-btn glass-card rounded-lg px-4 py-2 bg-emerald-600 border border-emerald-700 text-sm text-white hover:bg-emerald-500" data-provider="${provider.id}">
                Save
              </button>
            </div>
          </div>
        `;
      }

      html += `
          </div>
        </div>
      `;

      form.innerHTML = html;

      // Add event listeners
      form.querySelectorAll('.save-key-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const provider = e.target.dataset.provider;
          const input = document.getElementById(`key-${provider}`);
          const apiKey = input.value.trim();

          if (!apiKey) {
            alert('Please enter a key or token');
            return;
          }

          try {
            await setApiKey(provider, apiKey);
            alert(`${provider} saved successfully! Refresh the page to see updated data.`);
            input.value = '';
            initApiKeysModal();
          } catch (error) {
            alert(`Failed to save: ${error.message}`);
          }
        });
      });
    } catch (error) {
      form.innerHTML = `<p class="text-rose-500">Error loading API keys: ${error.message}</p>`;
    }
  }

  function initEventListeners() {
    document.getElementById('refresh-btn').addEventListener('click', () => {
      showLoading();
      refreshData();
    });

    document.getElementById('retry-btn').addEventListener('click', () => {
      showLoading();
      refreshData();
    });

    // Theme Gallery Button
    const themeBtn = document.getElementById('theme-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', showThemePicker);
    }

    document.getElementById('time-range').addEventListener('change', () => {
      showLoading();
      refreshData();
    });

    document.getElementById('api-keys-btn').addEventListener('click', () => {
      document.getElementById('api-keys-modal').classList.remove('hidden');
      initApiKeysModal();
    });

    document.getElementById('close-api-keys').addEventListener('click', () => {
      document.getElementById('api-keys-modal').classList.add('hidden');
    });

    document.getElementById('close-api-keys-cancel').addEventListener('click', () => {
      document.getElementById('api-keys-modal').classList.add('hidden');
    });

    document.getElementById('api-keys-modal').addEventListener('click', (e) => {
      if (e.target.id === 'api-keys-modal') {
        document.getElementById('api-keys-modal').classList.add('hidden');
      }
    });

    // Config modal handlers
    const configBtn = document.getElementById('config-btn');
    const configModal = document.getElementById('config-modal');
    const closeConfig = document.getElementById('close-config');
    const cancelConfig = document.getElementById('cancel-config');

    if (configBtn && configModal) {
      configBtn.addEventListener('click', () => {
        configModal.classList.remove('hidden');
        loadConfigState();
      });
    }

    if (closeConfig) {
      closeConfig.addEventListener('click', () => {
        configModal.classList.add('hidden');
      });
    }

    if (cancelConfig) {
      cancelConfig.addEventListener('click', () => {
        configModal.classList.add('hidden');
      });
    }

    if (configModal) {
      configModal.addEventListener('click', (e) => {
        if (e.target.id === 'config-modal') {
          configModal.classList.add('hidden');
        }
      });
    }
  }

  // Load current config state into the modal
  async function loadConfigState() {
    try {
      // Load provider health status
      const healthResponse = await fetch(`${API_BASE}/health`);
      const healthResult = await healthResponse.json();

      if (healthResult.success) {
        const apiList = document.getElementById('api-list');
        if (apiList) {
          apiList.innerHTML = Object.entries(healthResult.data).map(([provider, active]) => `
            <div class="flex items-center justify-between p-3 glass-card rounded-lg">
              <div class="flex items-center gap-3">
                <div class="w-2 h-2 rounded-full ${active ? 'bg-emerald-500' : 'bg-zinc-600'}"></div>
                <span class="text-zinc-300 capitalize">${provider}</span>
              </div>
              <span class="text-xs ${active ? 'text-emerald-500' : 'text-zinc-500'}">${active ? 'Connected' : 'Not configured'}</span>
            </div>
          `).join('');
        }
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  }

  // Warp Details Modal
  window.showWarpDetails = function (providerId) {
    const provider = currentData.providers.find(p => p.id === providerId);
    if (!provider || !provider.codingMetrics) return;

    const cm = provider.codingMetrics;
    const limits = cm;

    // Collect all bonus grants from both direct bonusGrants and workspace grants
    let allGrants = [];
    if (cm.bonusGrants && cm.bonusGrants.length > 0) {
      allGrants = [...cm.bonusGrants];
    }
    if (cm.workspaces && cm.workspaces.length > 0) {
      cm.workspaces.forEach(workspace => {
        if (workspace.bonusGrantsInfo?.grants) {
          allGrants = [...allGrants, ...workspace.bonusGrantsInfo.grants];
        }
      });
    }

    let bonusGrantsHTML = '';
    if (allGrants.length > 0) {
      bonusGrantsHTML = `
        <div class="glass-card p-4 rounded-lg">
          <h4 class="text-sm font-medium text-zinc-300 mb-3">💎 Bonus Credits</h4>
          <div class="space-y-2">
            ${allGrants.map(grant => {
        const expiresDate = new Date(grant.expiration);
        const isExpired = expiresDate < new Date();
        const reason = grant.reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        return `
                <div class="p-3 bg-zinc-900/50 rounded-lg ${isExpired ? 'opacity-50' : ''}">
                  <div class="flex justify-between items-start mb-2">
                    <div>
                      <div class="text-sm text-emerald-400 font-medium">${grant.requestCreditsRemaining.toLocaleString()} credits remaining</div>
                      <div class="text-xs text-zinc-500">${reason}</div>
                      <div class="text-xs text-zinc-600 mt-1">Originally: ${grant.requestCreditsGranted.toLocaleString()} credits</div>
                    </div>
                    <div class="text-xs ${isExpired ? 'text-rose-500' : 'text-amber-500'}">
                      ${isExpired ? 'Expired' : 'Expires ' + expiresDate.toLocaleDateString()}
                    </div>
                  </div>
                  ${grant.userFacingMessage ? `<div class="text-xs text-zinc-400 mt-1">${grant.userFacingMessage}</div>` : ''}
                </div>
              `;
      }).join('')}
          </div>
        </div>
      `;
    }

    // Build spending summary from workspace data
    let spendingHTML = '';
    let totalSpentCents = 0;
    let periodEnd = null;
    let creditsPurchased = 0;

    if (cm.workspaces && cm.workspaces.length > 0) {
      cm.workspaces.forEach(workspace => {
        if (workspace.bonusGrantsInfo?.spendingInfo) {
          const spending = workspace.bonusGrantsInfo.spendingInfo;
          totalSpentCents += spending.currentMonthSpendCents;
          creditsPurchased += spending.currentMonthCreditsPurchased;
          if (!periodEnd || new Date(spending.currentMonthPeriodEnd) > periodEnd) {
            periodEnd = new Date(spending.currentMonthPeriodEnd);
          }
        }
      });
    }

    if (totalSpentCents > 0 || creditsPurchased > 0) {
      spendingHTML = `
        <div class="glass-card p-4 rounded-lg bg-gradient-to-br from-zinc-900 to-zinc-950">
          <h4 class="text-sm font-medium text-zinc-300 mb-3">💰 Monthly Spending</h4>
          <div class="grid grid-cols-3 gap-4">
            <div class="text-center">
              <div class="text-2xl font-bold text-emerald-400">$${(totalSpentCents / 100).toFixed(2)}</div>
              <div class="text-xs text-zinc-500 mt-1">Spent This Period</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-cyan-400">${creditsPurchased.toLocaleString()}</div>
              <div class="text-xs text-zinc-500 mt-1">Credits Purchased</div>
            </div>
            <div class="text-center">
              <div class="text-lg font-medium text-zinc-300">${periodEnd ? periodEnd.toLocaleDateString() : 'N/A'}</div>
              <div class="text-xs text-zinc-500 mt-1">Period Ends</div>
            </div>
          </div>
        </div>
      `;
    }

    const modalHTML = `
      <div id="warp-details-modal" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="glass-card rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div class="sticky top-0 bg-zinc-950/95 backdrop-blur-sm p-6 border-b border-zinc-800 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center">
                <span class="text-white font-bold text-sm">WA</span>
              </div>
              <div>
                <h3 class="text-xl font-semibold text-zinc-200">Warp.dev Usage Details</h3>
                <p class="text-sm text-zinc-500">Complete usage breakdown</p>
              </div>
            </div>
            <button onclick="closeWarpDetails()" style="
              background: transparent;
              border: none;
              color: #a1a1aa;
              cursor: pointer;
              padding: 8px;
              display: flex;
              transition: all 0.15s ease;
            " onmouseover="this.style.color='#f4f4f5'" onmouseout="this.style.color='#a1a1aa'">
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <div class="p-6 space-y-6">
            <!-- Monthly Spending -->
            ${spendingHTML}
            
            <!-- Credit Breakdown -->
            ${cm.creditBreakdown ? `
            <div class="glass-card p-4 rounded-lg">
              <h4 class="text-sm font-medium text-zinc-300 mb-3">🎯 Credit Breakdown</h4>
              
              <!-- Recurring Credits -->
              <div class="mb-4">
                <div class="flex justify-between text-sm mb-2">
                  <span class="text-zinc-400">Monthly Credits</span>
                  <span class="text-cyan-400 font-medium">${cm.creditBreakdown.recurring.remaining} / ${cm.creditBreakdown.recurring.limit}</span>
                </div>
                <div class="h-4 bg-zinc-800 rounded-full overflow-hidden mb-2">
                  <div class="h-full rounded-full ${cm.creditBreakdown.recurring.percentRemaining > 30 ? 'bg-emerald-500' : cm.creditBreakdown.recurring.percentRemaining > 10 ? 'bg-amber-500' : 'bg-rose-500'} transition-all" 
                       style="width: ${cm.creditBreakdown.recurring.percentRemaining}%; transition: width 0.5s ease-out"></div>
                </div>
                <div class="flex justify-between text-xs text-zinc-500">
                  <span>${cm.creditBreakdown.recurring.percentRemaining}% remaining</span>
                  <span>Resets: ${formatDate(cm.creditBreakdown.recurring.resetsAt)}</span>
                </div>
              </div>
              
              <!-- Add-on Credits -->
              ${cm.creditBreakdown.addon.total > 0 ? `
              <div class="pt-3 border-t border-zinc-700">
                <div class="flex justify-between text-sm mb-2">
                  <span class="text-zinc-400">Add-on Credits</span>
                  <span class="text-emerald-400 font-medium">${formatNumber(cm.creditBreakdown.addon.total)}</span>
                </div>
                <div class="space-y-2">
                  ${cm.creditBreakdown.addon.grants.map((grant, i) => {
      const expDate = new Date(grant.expiration);
      const usedPercent = ((grant.granted - grant.remaining) / grant.granted) * 100;
      return `
                      <div class="p-2 bg-zinc-900/50 rounded">
                        <div class="flex justify-between text-xs mb-1">
                          <span class="text-zinc-400">Grant ${i + 1}</span>
                          <span class="text-zinc-300">${grant.remaining} / ${grant.granted}</span>
                        </div>
                        <div class="h-2 bg-zinc-800 rounded-full overflow-hidden mb-1">
                          <div class="h-full rounded-full bg-cyan-500" style="width: ${100 - usedPercent}%; transition: width 0.5s ease-out"></div>
                        </div>
                        <div class="text-xs text-zinc-500">Expires: ${expDate.toLocaleDateString()}</div>
                      </div>
                    `;
    }).join('')}
                </div>
              </div>
              ` : ''}
              
              <!-- Total Summary -->
              <div class="mt-4 pt-3 border-t border-zinc-700">
                <div class="flex justify-between text-sm">
                  <span class="text-zinc-300 font-medium">Total Available</span>
                  <span class="text-lg font-bold ${cm.creditBreakdown.usingAddonCredits ? 'text-amber-400' : 'text-emerald-400'}">
                    ${formatNumber(cm.creditBreakdown.totalAvailable)}
                  </span>
                </div>
                ${cm.creditBreakdown.usingAddonCredits ? `
                <div class="mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/30">
                  <span class="text-xs text-amber-400">⚠️ Monthly credits depleted - using add-on credits</span>
                </div>
                ` : ''}
              </div>
            </div>
            ` : `
            <div class="glass-card p-4 rounded-lg">
              <h4 class="text-sm font-medium text-zinc-300 mb-3">🎯 Monthly Credits</h4>
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-zinc-400">Used</span>
                  <span class="text-cyan-400 font-medium">${provider.requests} / ${provider.rateLimit?.limit || 'N/A'}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-zinc-400">Remaining</span>
                  <span class="text-emerald-400 font-medium">${provider.rateLimit?.remaining || 'N/A'}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-zinc-400">Resets</span>
                  <span class="text-zinc-300">${formatDate(provider.rateLimit?.reset)}</span>
                </div>
              </div>
            </div>
            `}

            <!-- Plan Features -->
            <div class="glass-card p-4 rounded-lg">
              <h4 class="text-sm font-medium text-zinc-300 mb-3">✨ Plan Features</h4>
              <div class="grid grid-cols-2 gap-4">
                <div class="flex items-center gap-2">
                  <span class="${cm.autosuggestions?.unlimited ? 'text-emerald-400' : 'text-zinc-500'}">✓</span>
                  <span class="text-sm text-zinc-400">Autosuggestions</span>
                  <span class="text-xs ${cm.autosuggestions?.unlimited ? 'text-emerald-400' : 'text-zinc-500'}">${cm.autosuggestions?.unlimited ? 'Unlimited' : 'Limited'}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="${cm.voice?.unlimited ? 'text-emerald-400' : 'text-zinc-500'}">✓</span>
                  <span class="text-sm text-zinc-400">Voice</span>
                  <span class="text-xs ${cm.voice?.unlimited ? 'text-emerald-400' : 'text-zinc-500'}">${cm.voice?.unlimited ? 'Unlimited' : 'Limited'}</span>
                </div>
                ${cm.codebaseIndexing ? `
                <div class="flex items-center gap-2">
                  <span class="text-emerald-400">✓</span>
                  <span class="text-sm text-zinc-400">Codebase Indexing</span>
                  <span class="text-xs text-zinc-500">${cm.codebaseIndexing.maxCodebases} repos</span>
                </div>
                ` : ''}
              </div>
            </div>

            <!-- Codebase Indexing Details -->
            ${cm.codebaseIndexing && !cm.codebaseIndexing.unlimited ? `
            <div class="glass-card p-4 rounded-lg">
              <h4 class="text-sm font-medium text-zinc-300 mb-3">📚 Codebase Indexing Limits</h4>
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-zinc-400">Status</span>
                  <span class="${cm.codebaseIndexing.unlimited ? 'text-emerald-400' : 'text-zinc-300'}">
                    ${cm.codebaseIndexing.unlimited ? 'Unlimited' : 'Limited'}
                  </span>
                </div>
                ${!cm.codebaseIndexing.unlimited ? `
                  <div class="flex justify-between text-sm">
                    <span class="text-zinc-400">Max Codebases</span>
                    <span class="text-zinc-300">${cm.codebaseIndexing.maxCodebases}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-zinc-400">Max Files/Repo</span>
                    <span class="text-zinc-300">${formatNumber(cm.codebaseIndexing.maxFilesPerRepo)}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-zinc-400">Batch Size</span>
                    <span class="text-zinc-300">${cm.codebaseIndexing.batchSize}</span>
                  </div>
                ` : ''}
              </div>
            </div>
            ` : ''}

            <!-- Usage History -->
            ${cm.usageHistory && cm.usageHistory.length > 0 ? `
            <div class="glass-card p-4 rounded-lg">
              <h4 class="text-sm font-medium text-zinc-300 mb-3">📊 Usage History</h4>
              <div class="space-y-2 max-h-80 overflow-y-auto">
                ${cm.usageHistory.map(conv => {
      const date = new Date(conv.date);
      const totalToolCalls = (conv.toolCalls?.commands || 0) + (conv.toolCalls?.fileReads || 0) +
        (conv.toolCalls?.grep || 0) + (conv.toolCalls?.fileGlob || 0) + (conv.toolCalls?.fileDiffs || 0);
      return `
                  <div class="p-3 bg-zinc-900/50 rounded-lg hover:bg-zinc-800/50 transition-colors">
                    <div class="flex justify-between items-start mb-2">
                      <div class="flex-1 min-w-0">
                        <div class="text-sm text-zinc-200 font-medium truncate" title="${conv.title}">${conv.title}</div>
                        <div class="text-xs text-zinc-500 mt-1">${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <div class="text-right ml-3">
                        <div class="text-sm font-bold text-cyan-400">${conv.creditsSpent.toFixed(1)}</div>
                        <div class="text-xs text-zinc-500">credits</div>
                      </div>
                    </div>
                    <div class="flex gap-4 text-xs">
                      <div class="flex items-center gap-1">
                        <span class="text-zinc-500">🔧</span>
                        <span class="text-zinc-400">${totalToolCalls} tool calls</span>
                      </div>
                      ${conv.summarized ? `
                      <div class="flex items-center gap-1">
                        <span class="text-amber-500">📝</span>
                        <span class="text-amber-500/80">Summarized</span>
                      </div>
                      ` : ''}
                      <div class="flex items-center gap-1">
                        <span class="text-zinc-500">💬</span>
                        <span class="text-zinc-400">${Math.round(conv.contextWindowUsage * 100)}% context</span>
                      </div>
                    </div>
                  </div>
                `;
    }).join('')}
              </div>
              <div class="mt-3 pt-3 border-t border-zinc-700">
                <div class="flex justify-between text-sm">
                  <span class="text-zinc-400">Total Sessions</span>
                  <span class="text-zinc-300">${cm.usageHistory.length}</span>
                </div>
                <div class="flex justify-between text-sm mt-1">
                  <span class="text-zinc-400">Total Credits Used</span>
                  <span class="text-cyan-400 font-medium">${cm.usageHistory.reduce((sum, c) => sum + c.creditsSpent, 0).toFixed(1)}</span>
                </div>
              </div>
            </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    // Remove existing modal if any
    const existing = document.getElementById('warp-details-modal');
    if (existing) existing.remove();

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Close on background click
    document.getElementById('warp-details-modal').addEventListener('click', (e) => {
      if (e.target.id === 'warp-details-modal') {
        closeWarpDetails();
      }
    });
  };

  window.closeWarpDetails = function () {
    const modal = document.getElementById('warp-details-modal');
    if (modal) modal.remove();
  };


  // 3D Motion Logic
  function initTiltEffect() {
    const cards = document.querySelectorAll('.provider-card, .glass-card');

    cards.forEach(card => {
      card.addEventListener('mousemove', handleTilt);
      card.addEventListener('mouseleave', resetTilt);
    });
  }

  function handleTilt(e) {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -4;
    const rotateY = ((x - centerX) / centerX) * 4;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

    // Dynamic Glare
    const glareX = ((x / rect.width) * 100);
    const glareY = ((y / rect.height) * 100);
    card.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, var(--bg-card-hover), var(--bg-card))`;
  }

  // Theme Gallery UI
  // Theme Gallery UI
  let themePickerExpanded = false;

  function showThemePicker() {
    const pickerId = 'theme-picker';
    const existing = document.getElementById(pickerId);
    if (existing) {
      closeThemePicker();
      return;
    }

    const themes = themeManager.getAvailableThemes();
    const currentId = themeManager.currentTheme;

    // Full descriptions for each theme
    const descriptions = {
      'default': 'High-contrast graphite - for serious commitment',
      'glass': 'Frosted acrylic surfaces - clear and modern',
      'space': 'Deep void backgrounds - minimal and mysterious',
      'dracula': 'The signature vampire aesthetic - timeless elegance',
      'nord': 'Arctic blues with crystalline frost - cold precision',
      'synthwave': 'Neon purples and sunset gradients - retro vibes',
      'matrix': 'The system is watching - digital rain intensity',
      'cherry': 'Deep crimson intensity - passionate and bold',
      'oceanic': 'Deep cyan waters with flowing silk - calm and immersive',
      'sunset': 'Warm amber flames dancing in darkness - passionate',
      'lavender': 'Soft purple calmness - gentle and soothing',
      'monokai': 'The classic developer experience - colorful and sharp'
    };

    const pickerHTML = `
      <div id="${pickerId}" style="
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 420px;
        max-height: 80vh;
        z-index: 999;
        display: flex;
        flex-direction: column;
        gap: 12px;
        pointer-events: auto;
        font-family: system-ui, -apple-system, sans-serif;
      ">
        <!-- Header -->
        <div style="
          background: rgba(9, 9, 11, 0.98);
          backdrop-filter: blur(16px);
          border: 1px solid #27272a;
          border-radius: 20px;
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 20px 60px rgba(0,0,0,0.6);
        ">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 24px;">🎨</span>
            <div>
              <div style="color: #f4f4f5; font-weight: 700; font-size: 18px;">Theme Gallery</div>
              <div style="color: #71717a; font-size: 13px;">Select a preset to transform your workspace</div>
            </div>
          </div>
          <button onclick="closeThemePicker()" style="
            background: rgba(39, 39, 42, 0.5);
            border: 1px solid #3f3f46;
            border-radius: 10px;
            color: #a1a1aa;
            cursor: pointer;
            padding: 8px;
            display: flex;
            transition: all 0.15s ease;
          " onmouseover="this.style.background='rgba(63,63,70,0.8)'; this.style.color='#f4f4f5'" onmouseout="this.style.background='rgba(39,39,42,0.5)'; this.style.color='#a1a1aa'">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Theme Cards Container -->
        <div id="theme-cards-container" style="
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow-y: auto;
          max-height: calc(80vh - 120px);
          padding: 4px;
          background: rgba(9, 9, 11, 0.95);
          backdrop-filter: blur(16px);
          border: 1px solid #27272a;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.6);
        " class="custom-scrollbar">
          ${themes.map((t, i) => {
      const isActive = t.id === currentId;
      const desc = descriptions[t.id] || 'A unique visual experience for your dashboard';
      return `
              <div class="theme-card" data-index="${i}" onclick="window.selectTheme('${t.id}')" style="
                background: ${isActive ? 'rgba(16, 185, 129, 0.06)' : 'rgba(24, 24, 27, 0.5)'};
                border: 1px solid ${isActive ? 'rgba(16, 185, 129, 0.25)' : '#27272a'};
                border-radius: 16px;
                padding: 18px 20px;
                cursor: pointer;
                display: flex;
                flex-direction: column;
                gap: 14px;
                transition: all 0.2s ease;
                margin: 0 8px;
              " onmouseover="this.style.borderColor='#52525b'; this.style.background='rgba(39,39,42,0.6)'" 
                 onmouseout="this.style.borderColor='${isActive ? 'rgba(16,185,129,0.25)' : '#27272a'}'; this.style.background='${isActive ? 'rgba(16,185,129,0.06)' : 'rgba(24,24,27,0.5)'}'">

                <!-- Title & Description -->
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <div style="flex: 1;">
                    <div style="color: ${isActive ? '#34d399' : '#f4f4f5'}; font-weight: 600; font-size: 16px; margin-bottom: 4px;">${t.name}</div>
                    <div style="color: #71717a; font-size: 13px; line-height: 1.4;">${desc}</div>
                  </div>
                  ${isActive ? `<div style="
                    background: rgba(16, 185, 129, 0.15);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    color: #34d399;
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                    padding: 4px 10px;
                    border-radius: 6px;
                    text-transform: uppercase;
                  ">Active</div>` : ''}
                </div>

                <!-- Color Swatches -->
                <div style="display: flex; gap: 10px;">
          <div style="width: 36px; height: 36px; border-radius: 50%; background: ${t.preview}; box-shadow: 0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15);"></div>
          <div style="width: 36px; height: 36px; border-radius: 50%; background: ${t.colors?.['--bg-card'] || '#27272a'}; box-shadow: 0 4px 12px rgba(0,0,0,0.4);"></div>
          <div style="width: 36px; height: 36px; border-radius: 50%; background: ${t.colors?.['--text-primary'] || '#e4e4e7'}; box-shadow: 0 4px 12px rgba(0,0,0,0.4);"></div>
          <div style="width: 36px; height: 36px; border-radius: 50%; background: ${t.colors?.['--bg-primary'] || '#09090b'}; box-shadow: 0 4px 12px rgba(0,0,0,0.4);"></div>
        </div>
              </div>
      `;
    }).join('')}
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', pickerHTML);

    // Animate cards in with stagger
    const cards = document.querySelectorAll('.theme-card');
    if (typeof Motion !== 'undefined' && Motion.animate) {
      cards.forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(16px)';
        Motion.animate(card,
          { opacity: 1, transform: 'translateY(0)' },
          { delay: i * 0.04, duration: 0.3, easing: [0.22, 1, 0.36, 1] }
        );
      });
    }
  }

  function closeThemePicker() {
    const picker = document.getElementById('theme-picker');
    if (!picker) return;

    // Animate out
    const cards = picker.querySelectorAll('.theme-card');
    if (typeof Motion !== 'undefined' && Motion.animate) {
      const cardsArray = Array.from(cards).reverse();
      cardsArray.forEach((card, i) => {
        Motion.animate(card,
          { opacity: 0, transform: 'translateY(10px) scale(0.95)' },
          { delay: i * 0.02, duration: 0.15, easing: 'ease-in' }
        );
      });
      setTimeout(() => picker.remove(), 200);
    } else {
      picker.remove();
    }
  }

  // Expose to window for inline onclicks in the modal HTML string
  window.selectTheme = function (themeId) {
    themeManager.setTheme(themeId);
    closeThemePicker();
    // Small delay then reopen to show updated state
    setTimeout(showThemePicker, 100);
  };

  window.closeThemePicker = closeThemePicker;

  function resetTilt(e) {
    const card = e.currentTarget;
    card.style.transform = '';
    card.style.background = '';
  }

  async function init() {
    showLoading();
    initEventListeners();
    await refreshData();
    startAutoRefresh();

    // Initialize tilt after data load
    initTiltEffect();

    // Re-init tilt on DOM updates (e.g. searching/filtering)
    const observer = new MutationObserver((mutations) => {
      initTiltEffect();
    });

    const grid = document.getElementById('providers-grid');
    if (grid) {
      observer.observe(grid, { childList: true });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
