#!/bin/bash

# Security Audit Script for AI Usage Monitor
# Scans the repository for private keys, secrets, and sensitive data
# Usage: ./scripts/security-audit.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     AI Usage Monitor - Security Audit Script      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

ISSUES_FOUND=0

# Create secure temporary file
TEMP_FILE=$(mktemp)
trap "rm -f ${TEMP_FILE}" EXIT

# Function to check and report
check_pattern() {
    local description="$1"
    local pattern="$2"
    
    echo -e "${YELLOW}Checking: ${description}${NC}"
    
    # Execute grep directly without eval
    if grep -rE "${pattern}" \
        --include='*.ts' --include='*.js' --include='*.json' --include='*.env' \
        --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build \
        . 2>/dev/null | grep -v "\.example" | grep -v "config-storage.ts" > "${TEMP_FILE}" 2>&1; then
        if [ -s "${TEMP_FILE}" ]; then
            echo -e "${RED}  ⚠️  Potential secrets found:${NC}"
            head -5 "${TEMP_FILE}"
            ISSUES_FOUND=$((ISSUES_FOUND + 1))
            echo ""
        else
            echo -e "${GREEN}  ✓ No issues found${NC}"
        fi
    else
        echo -e "${GREEN}  ✓ No issues found${NC}"
    fi
}

# Function to check for files
check_files() {
    local description="$1"
    local pattern="$2"
    
    echo -e "${YELLOW}Checking: ${description}${NC}"
    
    if find . -type f \( ${pattern} \) -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null | grep -q .; then
        echo -e "${RED}  ⚠️  Sensitive files found:${NC}"
        find . -type f \( ${pattern} \) -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null | head -5
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
        echo ""
    else
        echo -e "${GREEN}  ✓ No issues found${NC}"
    fi
}

# 1. Check for private key files
check_files "Private key files" "-name '*.pem' -o -name '*.key' -o -name '*.p12' -o -name '*.pfx' -o -name 'id_rsa' -o -name 'id_dsa'"

# 2. Check for PEM-encoded private keys
check_pattern "PEM private keys" "-----BEGIN.*PRIVATE KEY-----"

# 3. Check for OpenAI/OpenRouter API keys (but not regex patterns)
# OpenAI keys: sk-proj-... (48 chars after prefix)
# OpenRouter keys: sk-or-v1-... (format varies)
check_pattern "OpenAI API keys" "sk-proj-[A-Za-z0-9_-]{48}|sk-[A-Za-z0-9]{20}"

# 4. Check for Anthropic API keys
check_pattern "Anthropic API keys" "sk-ant-api03-[A-Za-z0-9_-]{95}"

# 5. Check for GitHub tokens
check_pattern "GitHub tokens" "ghp_[A-Za-z0-9]{36}|gho_[A-Za-z0-9]{36}"

# 6. Check for Google API keys (excluding known public Firebase keys)
# Note: Warp's Firebase API key (AIzaSyBdy3O3S9hrdayLJxJ7mriBR4qgUaUygAs) is public and safe
echo -e "${YELLOW}Checking: Google API keys${NC}"
KNOWN_PUBLIC_KEYS=(
    "AIzaSyBdy3O3S9hrdayLJxJ7mriBR4qgUaUygAs"  # Warp terminal public Firebase key
)
grep -rE "AIza[A-Za-z0-9_-]{35}" \
    --include='*.ts' --include='*.js' --include='*.json' \
    --exclude-dir=node_modules --exclude-dir=.git \
    . 2>/dev/null | \
    grep -v "config-storage.ts" > "${TEMP_FILE}" 2>&1 || true

# Filter out known public keys
cp "${TEMP_FILE}" "${TEMP_FILE}.filtered"
for key in "${KNOWN_PUBLIC_KEYS[@]}"; do
    grep -v "$key" "${TEMP_FILE}.filtered" > "${TEMP_FILE}.tmp" || true
    mv "${TEMP_FILE}.tmp" "${TEMP_FILE}.filtered"
done

if [ -s "${TEMP_FILE}.filtered" ]; then
    echo -e "${RED}  ⚠️  Potential secrets found:${NC}"
    cat "${TEMP_FILE}.filtered"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
    echo ""
else
    echo -e "${GREEN}  ✓ No issues found${NC}"
fi
rm -f "${TEMP_FILE}.filtered"

# 7. Check for AWS credentials
check_pattern "AWS access keys" "(AKIA|ASIA)[A-Z0-9]{16}"
check_pattern "AWS secret keys" "aws_secret_access_key.*=.*[A-Za-z0-9/+=]{40}"

# 8. Check for Stripe API keys
check_pattern "Stripe API keys" "sk_live_[A-Za-z0-9]{24,}"

# 9. Check for actual .env file (should not be committed)
echo -e "${YELLOW}Checking: .env file presence${NC}"
if [ -f ".env" ]; then
    echo -e "${RED}  ⚠️  .env file exists and may be committed${NC}"
    echo "  Check: git status | grep .env"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
    echo ""
else
    echo -e "${GREEN}  ✓ .env file not present (good)${NC}"
fi

# 10. Check for actual api-keys.json file
echo -e "${YELLOW}Checking: api-keys.json file presence${NC}"
if [ -f "data/api-keys.json" ]; then
    echo -e "${RED}  ⚠️  data/api-keys.json file exists and may be committed${NC}"
    echo "  Check: git status | grep api-keys.json"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
    echo ""
else
    echo -e "${GREEN}  ✓ api-keys.json file not present (good)${NC}"
fi

# 11. Check .gitignore has required entries
echo -e "${YELLOW}Checking: .gitignore configuration${NC}"
if grep -q "^\.env$" .gitignore && grep -q "data/api-keys.json" .gitignore; then
    echo -e "${GREEN}  ✓ .gitignore properly configured${NC}"
else
    echo -e "${RED}  ⚠️  .gitignore may not protect all sensitive files${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
    echo ""
fi

# Summary
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ Security Audit PASSED - No issues found${NC}"
    echo -e "${GREEN}   Repository is clean of private keys and secrets${NC}"
    exit 0
else
    echo -e "${RED}❌ Security Audit FAILED - ${ISSUES_FOUND} potential issue(s) found${NC}"
    echo -e "${YELLOW}   Please review the warnings above and take action${NC}"
    echo ""
    echo -e "${YELLOW}Actions to take:${NC}"
    echo "  1. Review each warning above"
    echo "  2. Remove any actual secrets from the code"
    echo "  3. If secrets were committed, rotate them immediately"
    echo "  4. Use 'git filter-repo' to remove from history if needed"
    echo "  5. Ensure .gitignore protects sensitive files"
    exit 1
fi
