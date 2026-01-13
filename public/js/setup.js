/**
 * AI Usage Monitor - Setup Wizard
 * Handles the first-run setup experience
 */

// Provider definitions with setup info
const PROVIDERS = [
    {
        id: 'anthropic',
        name: 'Anthropic Claude',
        description: 'Claude AI models',
        keyUrl: 'https://console.anthropic.com/',
        keyHint: 'Starts with sk-ant-...',
        keyPattern: /^sk-ant-/,
        hasOAuth: true, // Special handling for Claude OAuth
    },
    {
        id: 'openrouter',
        name: 'OpenRouter',
        description: 'Multiple AI models',
        keyUrl: 'https://openrouter.ai/keys',
        keyHint: 'Starts with sk-or-...',
        keyPattern: /^sk-or-/,
    },
    {
        id: 'github',
        name: 'GitHub Copilot',
        description: 'AI pair programming',
        keyUrl: 'https://github.com/settings/tokens',
        keyHint: 'Personal Access Token (ghp_...)',
        keyPattern: /^ghp_|^gho_|^ghu_|^ghs_|^ghr_/,
    },
    {
        id: 'google',
        name: 'Google AI (Gemini)',
        description: 'Gemini models',
        keyUrl: 'https://makersuite.google.com/app/apikey',
        keyHint: 'Starts with AIza...',
        keyPattern: /^AIza/,
    },
    {
        id: 'zai',
        name: 'Z.ai',
        description: 'GLM coding plan',
        keyUrl: 'https://api.z.ai',
        keyHint: 'API key from Z.ai',
        keyPattern: /^.{10,}$/,
    },
    {
        id: 'vercel',
        name: 'Vercel',
        description: 'Deployment platform',
        keyUrl: 'https://vercel.com/account/tokens',
        keyHint: 'Access token',
        keyPattern: /^.{10,}$/,
    },
];

let currentStep = 1;
let selectedProviders = new Set();
let claudeOAuthDetected = false;

// Initialize the setup wizard
document.addEventListener('DOMContentLoaded', async () => {
    // Check for URL parameters (from bookmarklet)
    const urlParams = new URLSearchParams(window.location.search);
    const sessionKeyParam = urlParams.get('sessionKey');
    const orgIdParam = urlParams.get('orgId');

    if (sessionKeyParam || orgIdParam) {
        // Auto-select Anthropic and jump to step 3
        selectedProviders.add('anthropic');
        // Store for later use in form
        window.prefillSessionKey = sessionKeyParam;
        window.prefillOrgId = orgIdParam;
    }

    // Check if already configured
    await checkExistingConfig();

    // Check for Claude OAuth token
    await checkClaudeOAuth();

    // Render the providers list
    renderProvidersList();

    // If we have prefilled data, jump to API keys step
    if (sessionKeyParam || orgIdParam) {
        showStep(2);
        setTimeout(() => {
            // Must render the form before filling it
            renderApiKeysForm();
            showStep(3);
            // Pre-fill the fields after form is rendered
            setTimeout(() => {
                const sessionInput = document.getElementById('key-claude_session_key');
                const orgInput = document.getElementById('key-claude_organization_id');
                if (sessionInput && sessionKeyParam) sessionInput.value = sessionKeyParam;
                if (orgInput && orgIdParam) orgInput.value = orgIdParam;
            }, 50);
        }, 100);
    }
});

async function checkExistingConfig() {
    try {
        const response = await fetch('/api/config/keys');
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data && Object.keys(data.data).length > 0) {
                // Some keys already exist - user might want to modify
                const configured = data.data;
                Object.keys(configured).forEach(provider => {
                    if (configured[provider]) {
                        selectedProviders.add(provider);
                    }
                });
            }
        }
    } catch (e) {
        console.log('No existing config found, starting fresh');
    }
}

async function checkClaudeOAuth() {
    try {
        const response = await fetch('/api/providers');
        if (response.ok) {
            const data = await response.json();
            // If anthropic is healthy without explicit API key, OAuth is working
            if (data.data?.anthropic === true) {
                claudeOAuthDetected = true;
                selectedProviders.add('anthropic');
            }
        }
    } catch (e) {
        console.log('Could not check Claude OAuth status');
    }
}

function renderProvidersList() {
    const container = document.getElementById('providers-list');
    container.innerHTML = PROVIDERS.map(provider => `
    <div class="provider-select-card ${selectedProviders.has(provider.id) ? 'selected' : ''}" 
         data-provider="${provider.id}"
         onclick="toggleProvider('${provider.id}')">
      <div class="checkbox">${selectedProviders.has(provider.id) ? '✓' : ''}</div>
      <div class="provider-info">
        <div class="provider-name">${provider.name}</div>
        <div class="provider-desc">${provider.description}</div>
      </div>
    </div>
  `).join('');
}

function toggleProvider(providerId) {
    if (selectedProviders.has(providerId)) {
        selectedProviders.delete(providerId);
    } else {
        selectedProviders.add(providerId);
    }
    renderProvidersList();
}

function renderApiKeysForm() {
    const container = document.getElementById('api-keys-form');
    const selectedList = Array.from(selectedProviders);

    if (selectedList.length === 0) {
        container.innerHTML = `
      <div class="text-center py-8 text-zinc-500">
        <p>No providers selected. Go back and select at least one provider.</p>
      </div>
    `;
        return;
    }

    container.innerHTML = selectedList.map(providerId => {
        const provider = PROVIDERS.find(p => p.id === providerId);
        if (!provider) return '';

        // Special case: Claude with OAuth detected
        if (provider.id === 'anthropic' && claudeOAuthDetected) {
            return `
        <div class="api-key-group">
          <div class="api-key-label">
            <span class="api-key-label-text">${provider.name}</span>
          </div>
          <div class="claude-auto-detected">
            <span>✓</span>
            <span>Automatically detected from Claude Code</span>
          </div>
          <div class="claude-special">
            <div class="claude-special-title">🔐 Pro/Max Usage Data (Optional)</div>
            <div class="claude-special-text">
              <p style="margin-bottom: 0.75rem;">For real-time Pro/Max usage tracking, extract your session cookie:</p>
              <ol style="margin: 0.5rem 0; padding-left: 1.25rem; line-height: 1.8;">
                <li>Open <a href="https://claude.ai" target="_blank" style="color: #a855f7;">claude.ai</a> while logged in</li>
                <li>Press <kbd style="background: #333; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem;">F12</kbd> or <kbd style="background: #333; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem;">Cmd+Option+I</kbd></li>
                <li>Go to <strong>Application</strong> → <strong>Cookies</strong> → <strong>claude.ai</strong></li>
                <li>Copy the <code style="background: #333; padding: 2px 6px; border-radius: 4px;">sessionKey</code> value</li>
              </ol>
            </div>
            <div style="margin-top: 0.75rem;">
              <input type="text" 
                     class="api-key-input" 
                     id="key-claude_session_key"
                     placeholder="Paste sessionKey here"
                     style="margin-bottom: 0.5rem;">
              <input type="text" 
                     class="api-key-input" 
                     id="key-claude_organization_id"
                     placeholder="Organization UUID (optional - find in URL)">
            </div>
          </div>
        </div>
      `;
        }

        // Special case: Claude without OAuth
        if (provider.id === 'anthropic' && !claudeOAuthDetected) {
            return `
        <div class="api-key-group">
          <div class="api-key-label">
            <span class="api-key-label-text">${provider.name}</span>
            <a href="${provider.keyUrl}" target="_blank" class="api-key-link">Get API key →</a>
          </div>
          <input type="password" 
                 class="api-key-input" 
                 id="key-${provider.id}"
                 placeholder="${provider.keyHint}">
          <div class="api-key-hint" id="hint-${provider.id}">
            Enter your Anthropic API key for API usage tracking.
          </div>
          <div class="claude-special">
            <div class="claude-special-title">� Pro/Max Users: Session Cookie</div>
            <div class="claude-special-text">
              <p style="margin-bottom: 0.75rem;">For <strong>real-time Pro/Max usage data</strong> from claude.ai:</p>
              <ol style="margin: 0.5rem 0; padding-left: 1.25rem; line-height: 1.8;">
                <li>Open <a href="https://claude.ai" target="_blank" style="color: #a855f7;">claude.ai</a> while logged in</li>
                <li>Press <kbd style="background: #333; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem;">F12</kbd> or <kbd style="background: #333; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem;">Cmd+Option+I</kbd></li>
                <li>Go to <strong>Application</strong> → <strong>Cookies</strong> → <strong>claude.ai</strong></li>
                <li>Copy the <code style="background: #333; padding: 2px 6px; border-radius: 4px;">sessionKey</code> value</li>
              </ol>
            </div>
            <div style="margin-top: 0.75rem;">
              <input type="text" 
                     class="api-key-input" 
                     id="key-claude_session_key"
                     placeholder="Paste sessionKey here"
                     style="margin-bottom: 0.5rem;">
              <input type="text" 
                     class="api-key-input" 
                     id="key-claude_organization_id"
                     placeholder="Organization UUID (optional)">
            </div>
          </div>
        </div>
      `;
        }

        // Normal provider
        return `
      <div class="api-key-group">
        <div class="api-key-label">
          <span class="api-key-label-text">${provider.name}</span>
          <a href="${provider.keyUrl}" target="_blank" class="api-key-link">Get key →</a>
        </div>
        <input type="password" 
               class="api-key-input" 
               id="key-${provider.id}"
               placeholder="${provider.keyHint}">
        <div class="api-key-hint" id="hint-${provider.id}"></div>
      </div>
    `;
    }).join('');
}

function toggleClaudeSession(e) {
    e.preventDefault();
    const fields = document.getElementById('claude-session-fields');
    fields.classList.toggle('hidden');
}

function updateProgress() {
    document.querySelectorAll('.progress-step').forEach((step, index) => {
        const stepNum = index + 1;
        step.classList.remove('active', 'completed');
        if (stepNum === currentStep) {
            step.classList.add('active');
        } else if (stepNum < currentStep) {
            step.classList.add('completed');
        }
    });

    document.querySelectorAll('.progress-line').forEach((line, index) => {
        if (index + 1 < currentStep) {
            line.classList.add('active');
        } else {
            line.classList.remove('active');
        }
    });
}

function showStep(stepNum) {
    document.querySelectorAll('.step-content').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById(`step-${stepNum}`).classList.add('active');
    currentStep = stepNum;
    updateProgress();
}

function nextStep() {
    if (currentStep === 2) {
        renderApiKeysForm();
    }
    if (currentStep < 4) {
        showStep(currentStep + 1);
    }
}

function prevStep() {
    if (currentStep > 1) {
        showStep(currentStep - 1);
    }
}

async function saveAndComplete() {
    const saveBtn = document.getElementById('save-btn');
    const btnText = document.getElementById('save-btn-text');
    const btnSpinner = document.getElementById('save-btn-spinner');

    saveBtn.disabled = true;
    btnText.classList.add('hidden');
    btnSpinner.classList.remove('hidden');

    const savedProviders = [];
    let hasError = false;

    // Collect and save all API keys
    for (const providerId of selectedProviders) {
        const input = document.getElementById(`key-${providerId}`);
        if (input && input.value.trim()) {
            try {
                const response = await fetch('/api/config/keys', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        provider: providerId,
                        apiKey: input.value.trim()
                    })
                });

                if (response.ok) {
                    savedProviders.push(PROVIDERS.find(p => p.id === providerId)?.name || providerId);
                    input.classList.remove('error');
                    input.classList.add('success');
                } else {
                    input.classList.add('error');
                    hasError = true;
                }
            } catch (e) {
                input.classList.add('error');
                hasError = true;
            }
        } else if (providerId === 'anthropic' && claudeOAuthDetected) {
            // OAuth is already working
            savedProviders.push('Anthropic Claude (OAuth)');
        }
    }

    // Save Claude session keys if provided
    const sessionKey = document.getElementById('key-claude_session_key');
    const orgId = document.getElementById('key-claude_organization_id');

    if (sessionKey && sessionKey.value.trim()) {
        try {
            await fetch('/api/config/keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: 'claude_session_key',
                    apiKey: sessionKey.value.trim()
                })
            });
        } catch (e) {
            console.error('Failed to save Claude session key');
        }
    }

    if (orgId && orgId.value.trim()) {
        try {
            await fetch('/api/config/keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: 'claude_organization_id',
                    apiKey: orgId.value.trim()
                })
            });
        } catch (e) {
            console.error('Failed to save Claude org ID');
        }
    }

    // Reload providers to apply new keys
    try {
        await fetch('/api/config/keys/reload', { method: 'POST' });
    } catch (e) {
        console.error('Failed to reload providers');
    }

    // Show success or error
    saveBtn.disabled = false;
    btnText.classList.remove('hidden');
    btnSpinner.classList.add('hidden');

    if (!hasError || savedProviders.length > 0) {
        renderSuccessSummary(savedProviders);
        showStep(4);
        localStorage.setItem('ai-usage-monitor-setup-complete', 'true');
    }
}

function renderSuccessSummary(providers) {
    const container = document.getElementById('success-summary');
    if (providers.length === 0) {
        container.innerHTML = `
                < div class="success-item" >
        <span class="success-check">ℹ️</span>
        <span class="success-provider">No providers configured yet. You can add them from the dashboard.</span>
      </div >
                `;
    } else {
        container.innerHTML = providers.map(name => `
                < div class="success-item" >
        <span class="success-check">✓</span>
        <span class="success-provider">${name}</span>
      </div >
                `).join('');
    }
}

function goToDashboard() {
    window.location.href = '/';
}
