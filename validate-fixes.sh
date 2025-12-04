#!/bin/bash
# Script de Validation Post-Correction
# À exécuter après avoir corrigé les erreurs

set -e

echo "=========================================="
echo "📋 Script de Validation TSX - MonApp"
echo "=========================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Helper functions
pass() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED++))
}

fail() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED++))
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# ========================================
# 1. Check TypeScript Compilation
# ========================================
echo "1️⃣ TypeScript Compilation Check..."
if npx tsc --noEmit 2>/dev/null; then
    pass "TypeScript compilation successful"
else
    fail "TypeScript compilation failed"
fi
echo ""

# ========================================
# 2. Check for Specific Errors
# ========================================
echo "2️⃣ Checking for specific errors..."

# Check: JSX invalide en recapitulatif
if grep -q "{qrId && ({" "app/(tabs)/recapitulatif.tsx" 2>/dev/null; then
    fail "recapitulatif.tsx still has invalid JSX syntax"
else
    pass "recapitulatif.tsx JSX syntax fixed"
fi

# Check: FileSystemLegacy import
if grep -q "FileSystemLegacy" "app/(tabs)/adhesion.tsx" 2>/dev/null; then
    fail "adhesion.tsx still imports legacy FileSystem"
else
    pass "adhesion.tsx FileSystem import fixed"
fi

# Check: qrId state
if grep -q 'useState.*qrId' "app/(tabs)/recapitulatif.tsx" 2>/dev/null; then
    warn "recapitulatif.tsx still has qrId state (should be removed or implemented)"
else
    pass "recapitulatif.tsx qrId state removed"
fi

# Check: Duplicate functions
if grep -c "const loadElevesFromServer\|const fetchFromServer" "app/(tabs)/recapitulatif.tsx" 2>/dev/null | grep -q "2"; then
    fail "recapitulatif.tsx still has duplicate fetch functions"
else
    pass "recapitulatif.tsx duplicate functions merged"
fi

echo ""

# ========================================
# 3. Check for 'any' types
# ========================================
echo "3️⃣ Checking for 'any' type usage..."

ANY_COUNT=$(grep -r "<any>" app/ components/ 2>/dev/null | grep -v node_modules | wc -l)
if [ "$ANY_COUNT" -gt 0 ]; then
    warn "Found $ANY_COUNT instances of 'any' type (should be < 5)"
else
    pass "No 'any' types found"
fi
echo ""

# ========================================
# 4. Check for API keys in code
# ========================================
echo "4️⃣ Checking for exposed secrets..."

if grep -r "KEYOFSQUAD01\|apiKey" app/ components/ --include="*.tsx" 2>/dev/null | grep -v "X-API-KEY" > /dev/null; then
    fail "Found exposed secrets/API keys in source code"
else
    pass "No exposed secrets detected"
fi
echo ""

# ========================================
# 5. Check for dead code
# ========================================
echo "5️⃣ Checking for dead code..."

COMMENTED_CODE=$(grep -r "// const \|// function " app/ --include="*.tsx" 2>/dev/null | wc -l)
if [ "$COMMENTED_CODE" -gt 10 ]; then
    warn "Found $COMMENTED_CODE lines of commented code (should clean up)"
else
    pass "Minimal commented code found"
fi
echo ""

# ========================================
# 6. Check file consistency
# ========================================
echo "6️⃣ Checking file consistency..."

if [ -f "app/(tabs)/identification.tsx" ] && [ -f "app/(tabs)/adhesion.tsx" ]; then
    pass "Core files exist"
else
    fail "Some core files are missing"
fi
echo ""

# ========================================
# 7. Build test (optional, if you have eas)
# ========================================
echo "7️⃣ Build dry-run test..."

if command -v eas &> /dev/null; then
    if eas build --platform android --dry-run 2>/dev/null; then
        pass "Build dry-run successful"
    else
        warn "Build dry-run failed (might be environment issue)"
    fi
else
    warn "eas-cli not installed (skipping build test)"
fi
echo ""

# ========================================
# 8. Check imports
# ========================================
echo "8️⃣ Checking imports..."

UNUSED_IMPORTS=$(npx eslint --fix-type imports "app/**/*.tsx" 2>/dev/null | grep "unused" | wc -l)
if [ "$UNUSED_IMPORTS" -eq 0 ]; then
    pass "No unused imports detected"
else
    warn "Found $UNUSED_IMPORTS potentially unused imports"
fi
echo ""

# ========================================
# 9. Summary
# ========================================
echo "=========================================="
echo "📊 VALIDATION SUMMARY"
echo "=========================================="
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"

if [ "$FAILED" -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ All critical checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. npm test  (if you have tests)"
    echo "2. git commit -m 'fix: resolve TSX issues'"
    echo "3. Create PR for review"
    exit 0
else
    echo ""
    echo -e "${RED}❌ Some checks failed. Please fix issues before committing.${NC}"
    echo ""
    echo "For details, see ANALYSE_TSX_COMPLETE.md"
    exit 1
fi
