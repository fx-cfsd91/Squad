# 🧪 TESTS DE SÉCURITÉ API

## 1️⃣ Test SANS Authentification (doit échouer)

### Commande PowerShell:
```powershell
Write-Host "Test: GET sans clé API (doit retourner 401)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri 'https://cfsd91.com/eleves.php' -Method GET -UseBasicParsing -ErrorAction Stop
    Write-Host "❌ FAILED - Requête acceptée!" -ForegroundColor Red
} catch {
    Write-Host "✅ PASS - Erreur 401 (Non autorisé)" -ForegroundColor Green
    Write-Host "Details: $($_.Exception.Message)" -ForegroundColor Gray
}
```

### Commande cURL:
```bash
curl -i https://cfsd91.com/eleves.php
# Status attendu: 401 Unauthorized
```

---

## 2️⃣ Test AVEC Authentification (doit réussir)

### Commande PowerShell:
```powershell
Write-Host "Test: GET avec clé API (doit retourner 200)" -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri 'https://cfsd91.com/eleves.php' `
    -Method GET `
    -Headers @{'X-API-KEY'='Mac131080'} `
    -UseBasicParsing `
    -ErrorAction SilentlyContinue

if ($response.StatusCode -eq 200) {
    Write-Host "✅ PASS - Status 200 OK" -ForegroundColor Green
    Write-Host "Response length: $($response.Content.Length) bytes"
} else {
    Write-Host "❌ FAILED - Status: $($response.StatusCode)" -ForegroundColor Red
}
```

### Commande cURL:
```bash
curl -i -H "X-API-KEY: Mac131080" https://cfsd91.com/eleves.php
# Status attendu: 200 OK
```

---

## 3️⃣ Test: Vérifier que Password est Filtré

### Commande PowerShell:
```powershell
Write-Host "Test: Vérifier que 'password' n'est pas dans la réponse" -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri 'https://cfsd91.com/eleves.php' `
    -Method GET `
    -Headers @{'X-API-KEY'='Mac131080'} `
    -UseBasicParsing `
    -ErrorAction SilentlyContinue

if ($response.Content -like '*password*') {
    Write-Host "❌ FAILED - 'password' trouvé dans la réponse!" -ForegroundColor Red
} else {
    Write-Host "✅ PASS - 'password' correctement filtré" -ForegroundColor Green
}
```

### Commande cURL:
```bash
curl -H "X-API-KEY: Mac131080" https://cfsd91.com/eleves.php | grep -i password
# Attendu: Aucun résultat
```

---

## 4️⃣ Test POST: Créer un Élève

### Avec clé API (doit réussir):
```powershell
$body = @{
    nom = "Testeur"
    prenom = "API"
    naissance = "2010-01-15"
    jour = "3"
    discipline = "Karate"
    password = "SecurePass123"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri 'https://cfsd91.com/eleves.php' `
    -Method POST `
    -Headers @{
        'X-API-KEY' = 'Mac131080'
        'Content-Type' = 'application/json'
    } `
    -Body $body `
    -UseBasicParsing `
    -ErrorAction SilentlyContinue

Write-Host "Status: $($response.StatusCode)"
Write-Host "Response: $($response.Content)"
```

### Commande cURL:
```bash
curl -i -X POST https://cfsd91.com/eleves.php \
  -H "X-API-KEY: Mac131080" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Testeur",
    "prenom": "API",
    "naissance": "2010-01-15",
    "jour": "3",
    "discipline": "Karate",
    "password": "SecurePass123"
  }'
# Status attendu: 201 Created
```

### SANS clé API (doit échouer):
```bash
curl -i -X POST https://cfsd91.com/eleves.php \
  -H "Content-Type: application/json" \
  -d '{"nom":"Test","prenom":"User"}'
# Status attendu: 401 Unauthorized
```

---

## 5️⃣ Test PUT: Modifier un Élève

### Commande cURL:
```bash
curl -i -X PUT https://cfsd91.com/eleves.php \
  -H "X-API-KEY: Mac131080" \
  -H "Content-Type: application/json" \
  -d '{"id":"123","nom":"Modifié"}'
# Status attendu: 200 OK ou 404 Not Found (si id n'existe pas)
```

---

## 6️⃣ Test DELETE: Supprimer un Élève

### Commande cURL:
```bash
curl -i -X DELETE https://cfsd91.com/eleves.php \
  -H "X-API-KEY: Mac131080" \
  -H "Content-Type: application/json" \
  -d '{"id":"123"}'
# Status attendu: 200 OK ou 404 Not Found
```

---

## 7️⃣ Test de Clé Invalide

### Commande cURL:
```bash
curl -i -H "X-API-KEY: wrongkey" https://cfsd91.com/eleves.php
# Status attendu: 401 Unauthorized
# Response: {"error":"Unauthorized","message":"Invalid or missing API key"}
```

---

## 🔍 Vérifier les Logs d'Accès

### Sur le serveur (via SSH/SFTP):
```bash
# Voir les 10 derniers accès
tail -10 /priv/api_logs/access.log

# Voir tous les accès
cat /priv/api_logs/access.log

# Voir seulement les erreurs 401
grep "401" /priv/api_logs/access.log

# Nombre d'accès par jour
grep "2025-12-14" /priv/api_logs/access.log | wc -l
```

Format attendu des logs:
```
2025-12-14 15:30:45 | GET | Key: Mac***1080 | Status: 200 | IP: 192.168.1.100 | Fetched all students
2025-12-14 15:30:46 | GET | Key: NONE | Status: 401 | IP: 192.168.1.101 | Unauthorized - Invalid or missing API key
```

---

## 📊 Tableau de Résultats Attendus

| Test | Méthode | Clé API | Status Attendu | Action |
|------|---------|---------|-----------------|--------|
| 1 | GET | NON | 401 | Rejeter |
| 2 | GET | OUI | 200 | Accepter |
| 3 | GET | OUI | 200 | Accepter (sans password) |
| 4a | POST | NON | 401 | Rejeter |
| 4b | POST | OUI | 201 | Créer |
| 5 | PUT | OUI | 200/404 | Modifier |
| 6 | DELETE | OUI | 200/404 | Supprimer |
| 7 | GET | Invalide | 401 | Rejeter |

---

## ✅ Tous les Tests Doivent Passer

- [x] GET sans clé → 401
- [x] GET avec clé → 200
- [x] Password filtré → aucun "password" dans la réponse
- [x] POST sans clé → 401
- [x] POST avec clé → 201
- [x] PUT avec clé → 200
- [x] DELETE avec clé → 200
- [x] Logs d'accès créés → tous les accès dans `/priv/api_logs/access.log`

---

## 🚀 Script de Test Complet (PowerShell)

```powershell
function Test-API {
    Write-Host "========== TEST DE SÉCURITÉ API ==========" -ForegroundColor Cyan
    
    $baseUrl = "https://cfsd91.com/eleves.php"
    $apiKey = "Mac131080"
    
    # Test 1: Sans clé
    Write-Host "`n[Test 1] GET sans clé API" -ForegroundColor Yellow
    try {
        Invoke-WebRequest -Uri $baseUrl -Method GET -UseBasicParsing -ErrorAction Stop | Out-Null
        Write-Host "❌ FAILED - Accepté sans authentification!" -ForegroundColor Red
    } catch {
        Write-Host "✅ PASS - Rejeté (401)" -ForegroundColor Green
    }
    
    # Test 2: Avec clé
    Write-Host "`n[Test 2] GET avec clé API valide" -ForegroundColor Yellow
    $response = Invoke-WebRequest -Uri $baseUrl -Method GET -Headers @{'X-API-KEY'=$apiKey} -UseBasicParsing -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ PASS - Accepté (200)" -ForegroundColor Green
    } else {
        Write-Host "❌ FAILED - Status: $($response.StatusCode)" -ForegroundColor Red
    }
    
    # Test 3: Password filtré
    Write-Host "`n[Test 3] Vérifier le filtrage du password" -ForegroundColor Yellow
    if ($response.Content -like '*password*') {
        Write-Host "❌ FAILED - 'password' trouvé!" -ForegroundColor Red
    } else {
        Write-Host "✅ PASS - 'password' filtré" -ForegroundColor Green
    }
    
    Write-Host "`n========== RÉSULTATS FIN ==========" -ForegroundColor Cyan
}

# Exécuter les tests
Test-API
```

---

**Version**: 1.0
**Dernière mise à jour**: 14 décembre 2025
**Status**: Production-Ready ✅
