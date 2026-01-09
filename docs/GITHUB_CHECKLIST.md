# GitHub Publishing Checklist

Before publishing your AI Usage Monitor to GitHub, make sure to complete these steps:

## 1. Security Checks

### ✅ Ensure `.env` is in `.gitignore`
```bash
grep -q "^\.env$" .gitignore && echo "✓ .env is ignored" || echo "❌ Add .env to .gitignore"
```

### ✅ Remove any committed secrets
```bash
# Check for accidental token commits
git log --all --full-history -- .env
```

### ✅ Update `.env.example` with placeholder values
- Should NOT contain real tokens
- Should have example/placeholder values
- Already done ✓

## 2. Documentation

### ✅ Files to include:
- [x] `README.md` - Main project documentation
- [x] `WARP_TOKEN_SETUP.md` - Quick Warp setup guide
- [x] `docs/WARP_SETUP.md` - Detailed Warp documentation
- [x] `.env.example` - Example environment file
- [x] `scripts/extract-warp-token.sh` - Token extraction script
- [ ] `LICENSE` - Add if not present
- [ ] `CONTRIBUTING.md` - Optional contribution guidelines

### ✅ README should mention:
- [x] All supported providers (including Warp.dev)
- [x] Warp-specific setup requirements
- [x] Link to detailed Warp documentation
- [x] macOS-only limitation for Warp

## 3. Scripts

### ✅ Make scripts executable:
```bash
chmod +x scripts/extract-warp-token.sh
```

### ✅ Test the extraction script:
```bash
./scripts/extract-warp-token.sh
```

## 4. Code Quality

### ✅ Remove test/debug files (optional):
```bash
# These are fine to keep but optional to remove:
rm -f test-*.ts
rm -f analyze-token.ts
```

### ✅ Remove API keys from code comments:
```bash
# Search for potential hardcoded keys
grep -r "AIza" src/
```

## 5. .gitignore Essentials

Ensure these are ignored:
```gitignore
# Environment
.env
.env.local

# Dependencies
node_modules/
bun.lockb

# Build outputs  
ai-usage-monitor
dist/

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp

# Logs
*.log

# Cache
.cache/
data/

# Testing
test-*.ts
analyze-token.ts
```

## 6. GitHub Repository Setup

### Initial Commit
```bash
# Stage all files
git add .

# Make initial commit
git commit -m "Initial commit: AI Usage Monitor with Warp.dev support"

# Create GitHub repo and push
git remote add origin <your-github-url>
git branch -M main
git push -u origin main
```

### Add Topics/Tags
Add these topics to your GitHub repo:
- `ai`
- `monitoring`
- `dashboard`
- `bun`
- `typescript`
- `anthropic`
- `openai`
- `github-copilot`
- `warp`
- `firebase`

### Repository Settings
- ✓ Enable Issues
- ✓ Enable Wiki (optional)
- ✓ Add description: "Monitor AI usage across multiple providers with a beautiful dashboard"
- ✓ Add website: Your deployed URL (if any)

## 7. Optional Enhancements

### Add GitHub Actions (Optional)
```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run build
```

### Add Screenshots
Take screenshots of:
1. Main dashboard
2. Warp usage details
3. Multi-provider view

Add to `screenshots/` folder and link in README

### Create Demo Video (Optional)
- Show quick setup
- Demonstrate token extraction
- Show live dashboard

## 8. Legal

### Add LICENSE
If not present, add an MIT License:
```bash
# Create LICENSE file
cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2026 [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy...
EOF
```

## 9. Pre-Publish Checklist

- [ ] No secrets in git history
- [ ] `.env` is gitignored
- [ ] All scripts are executable
- [ ] Documentation is complete
- [ ] Test on fresh clone
- [ ] README has clear instructions
- [ ] Warp setup is well documented

## 10. Test Fresh Installation

Clone your repo in a new location and verify:
```bash
cd /tmp
git clone <your-repo-url>
cd ai-usage-monitor
bun install
cp .env.example .env
./scripts/extract-warp-token.sh
bun run dev
```

## Post-Publish

### Announce
- Share on Twitter/X
- Post in relevant Reddit communities
- Share in Warp Discord/Slack
- Write a blog post

### Monitor
- Watch for Issues
- Respond to PRs
- Keep dependencies updated

## Security Notice for Users

Add this to your README:

> **🔒 Security Note**: This application requires API keys and tokens to function. Never commit your `.env` file or share your tokens publicly. The Warp token is extracted from your local macOS Keychain and should be kept private.

---

✅ **Ready to publish!** Once you've completed this checklist, your project is ready to be shared on GitHub.
