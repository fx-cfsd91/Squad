# Script de Validation Post-Correction (Windows PowerShell)
# À exécuter après avoir corrigé les erreurs

$ErrorActionPreference = "Continue"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "📋 Script de Validation TSX - MonApp" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Counters
$PASSED = 0
$FAILED = 0

# Helper functions
function Pass ($message) {
    Write-Host "✅ $message" -ForegroundColor Green
    $global:PASSED++
}

function Fail ($message) {
    Write-Host "❌ $message" -ForegroundColor Red
    $global:FAILED++
}

function Warn ($message) {
    Write-Host "⚠️  $message" -ForegroundColor Yellow
}

# ========================================
# 1. Check TypeScript Compilation
# ========================================
Write-Host "1️⃣ TypeScript Compilation Check..." -ForegroundColor Yellow

try {
    $output = & npx tsc --noEmit 2>&1
    if ($LASTEXITCODE -eq 0) {
        Pass "TypeScript compilation successful"
    } else {
        Fail "TypeScript compilation failed"
        Write-Host $output -ForegroundColor Red
    }
} catch {
    Warn "Could not run tsc (npx might not be available)"
}
Write-Host ""

# ========================================
# 2. Check for Specific Errors
# ========================================
Write-Host "2️⃣ Checking for specific errors..." -ForegroundColor Yellow

# Check: JSX invalide en recapitulatif
$recapPath = "app/(tabs)/recapitulatif.tsx"
if (Test-Path $recapPath) {
    $content = Get-Content $recapPath -Raw
    if ($content -match "{qrId && \(\s*{") {
        Fail "recapitulatif.tsx still has invalid JSX syntax"
    } else {
        Pass "recapitulatif.tsx JSX syntax fixed"
    }
} else {
    Warn "recapitulatif.tsx not found"
}

# Check: FileSystemLegacy import
$adhesionPath = "app/(tabs)/adhesion.tsx"
if (Test-Path $adhesionPath) {
    $content = Get-Content $adhesionPath -Raw
    if ($content -match "FileSystemLegacy") {
        Fail "adhesion.tsx still imports legacy FileSystem"
    } else {
        Pass "adhesion.tsx FileSystem import fixed"
    }
} else {
    Warn "adhesion.tsx not found"
}

# Check: qrId state
if (Test-Path $recapPath) {
    $content = Get-Content $recapPath -Raw
    if ($content -match "useState.*qrId") {
        Warn "recapitulatif.tsx still has qrId state (should be removed or implemented)"
    } else {
        Pass "recapitulatif.tsx qrId state removed"
    }
}

# Check: Duplicate functions
if (Test-Path $recapPath) {
    $content = Get-Content $recapPath -Raw
    $loadCount = ([regex]::Matches($content, "const (loadElevesFromServer|fetchFromServer)")).Count
    if ($loadCount -ge 2) {
        Fail "recapitulatif.tsx still has duplicate fetch functions"
    } else {
        Pass "recapitulatif.tsx duplicate functions merged"
    }
}

Write-Host ""

# ========================================
# 3. Check for 'any' types
# ========================================
Write-Host "3️⃣ Checking for 'any' type usage..." -ForegroundColor Yellow

try {
    $anyCount = (Get-ChildItem -Path "app", "components" -Include "*.tsx" -Recurse | 
                  Select-String "<any>" | Measure-Object).Count
    
    if ($anyCount -gt 0) {
        Warn "Found $anyCount instances of 'any' type (should be < 5)"
    } else {
        Pass "No 'any' types found"
    }
} catch {
    Warn "Could not check 'any' types"
}
Write-Host ""

# ========================================
# 4. Check for API keys in code
# ========================================
Write-Host "4️⃣ Checking for exposed secrets..." -ForegroundColor Yellow

try {
    $secrets = Get-ChildItem -Path "app", "components" -Include "*.tsx" -Recurse | 
               Select-String "KEYOFSQUAD01|apiKey" | 
               Where-Object { $_ -notmatch "X-API-KEY" } |
               Measure-Object

    if ($secrets.Count -gt 0) {
        Fail "Found exposed secrets/API keys in source code"
    } else {
        Pass "No exposed secrets detected"
    }
} catch {
    Warn "Could not check for secrets"
}
Write-Host ""

# ========================================
# 5. Check for dead code
# ========================================
Write-Host "5️⃣ Checking for dead code..." -ForegroundColor Yellow

try {
    $commentedCode = (Get-ChildItem -Path "app", "components" -Include "*.tsx" -Recurse | 
                      Select-String "// const |// function " | Measure-Object).Count
    
    if ($commentedCode -gt 10) {
        Warn "Found $commentedCode lines of commented code (should clean up)"
    } else {
        Pass "Minimal commented code found ($commentedCode lines)"
    }
} catch {
    Warn "Could not check for dead code"
}
Write-Host ""

# ========================================
# 6. Check file consistency
# ========================================
Write-Host "6️⃣ Checking file consistency..." -ForegroundColor Yellow

$identPath = "app/(tabs)/identification.tsx"
$adhesionPath = "app/(tabs)/adhesion.tsx"

if ((Test-Path $identPath) -and (Test-Path $adhesionPath)) {
    Pass "Core files exist"
} else {
    Fail "Some core files are missing"
}
Write-Host ""

# ========================================
# 7. Check imports with ESLint (optional)
# ========================================
Write-Host "7️⃣ Checking imports with ESLint..." -ForegroundColor Yellow

try {
    $output = & npx eslint "app/**/*.tsx" --format json 2>&1 | ConvertFrom-Json
    if ($output) {
        $unusedImports = $output | Where-Object { $_.messages.message -match "unused" } | Measure-Object
        if ($unusedImports.Count -gt 0) {
            Warn "Found $($unusedImports.Count) potentially unused imports"
        } else {
            Pass "No unused imports detected"
        }
    } else {
        Pass "No ESLint issues found"
    }
} catch {
    Warn "ESLint not available or error running it"
}
Write-Host ""

# ========================================
# 8. Check files modified dates
# ========================================
Write-Host "8️⃣ Checking recent modifications..." -ForegroundColor Yellow

$modified = Get-ChildItem -Path "app/(tabs)" -Include "*.tsx" | 
            Where-Object { $_.LastWriteTime -gt (Get-Date).AddHours(-1) }

if ($modified.Count -gt 0) {
    Pass "Recent modifications detected on $($modified.Count) file(s)"
} else {
    Warn "No recent modifications (make sure you saved your fixes!)"
}
Write-Host ""

# ========================================
# 9. Summary
# ========================================
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "📊 VALIDATION SUMMARY" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Passed: $PASSED" -ForegroundColor Green
Write-Host "❌ Failed: $FAILED" -ForegroundColor Red
Write-Host ""

if ($FAILED -eq 0) {
    Write-Host "✅ All critical checks passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Green
    Write-Host "1. npm test  (if you have tests)"
    Write-Host "2. git commit -m 'fix: resolve TSX issues'"
    Write-Host "3. Create PR for review"
    Write-Host ""
} else {
    Write-Host "❌ Some checks failed. Please fix issues before committing." -ForegroundColor Red
    Write-Host ""
    Write-Host "For details, see ANALYSE_TSX_COMPLETE.md" -ForegroundColor Yellow
}

# Return exit code
exit $FAILED
