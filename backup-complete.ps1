# Script de sauvegarde complète avec horodatage
# Date: 09/11/2025
# Version: Application Krav-Maga Club - Version finale

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupName = "MonApp_Backup_$timestamp"
$backupPath = "C:\Users\Windows\$backupName"

Write-Host "🚀 Création de la sauvegarde: $backupName" -ForegroundColor Green

# Créer le dossier de sauvegarde
New-Item -ItemType Directory -Path $backupPath -Force | Out-Null

# Copier tous les fichiers source importants
Write-Host "📁 Copie des fichiers sources..." -ForegroundColor Yellow

# Copier l'ensemble du projet
Copy-Item "C:\Users\Windows\MonApp\*" -Destination $backupPath -Recurse -Exclude @("node_modules", ".expo", "dist", "build", ".git") -Force

# Créer un fichier de version
$versionInfo = @"
=== SAUVEGARDE APPLICATION KRAV-MAGA CLUB ===
Date de sauvegarde: $(Get-Date -Format "dd/MM/yyyy à HH:mm:ss")
Version: Application complète fonctionnelle

FONCTIONNALITÉS IMPLÉMENTÉES:
✅ Système d'authentification (Admin PIN: 3107 + Élèves via serveur)
✅ Gestion du calendrier avec cours récurrents et événements ponctuels
✅ Affichage des prochains cours (3 prochains cours récurrents)
✅ Section compétitions (événements ponctuels de l'année sportive)
✅ Logique d'année sportive (1er septembre au 5 juillet)
✅ Persistance via serveur IONOS (calendar.json)
✅ Interface adaptive selon le mode (visiteur/élève/admin)
✅ Gestion des détails pour tous les événements
✅ Système de notifications et présence
✅ Pages: Adhésion, Évaluations, Récapitulatif, Messages, Présence

SERVEUR:
- URL élèves: https://cfsd91.com/eleves.php
- Stockage calendrier: https://cfsd91.com/calendar.json

CONFIGURATION:
- PIN Admin: 3107
- Tunnel Expo pour accès global
- Interface responsive mobile/web
- Thème sombre professionnel

DERNIÈRES MODIFICATIONS:
- Séparation "Prochains cours" (récurrents) et "Compétitions" (ponctuels)
- Ajout détails pour cours récurrents
- Amélioration algorithme affichage cours
- Système de persistance robuste via serveur
"@

$versionInfo | Out-File -FilePath "$backupPath\VERSION_INFO.txt" -Encoding UTF8

# Créer un script de restauration
$restoreScript = @'
# Script de restauration
# Pour restaurer cette sauvegarde:

Write-Host "🔄 Restauration de la sauvegarde Skquad..." -ForegroundColor Green

# 1. Sauvegarder l'existant si nécessaire
if (Test-Path "C:\Users\Windows\MonApp") {
    $backupCurrent = "C:\Users\Windows\MonApp_OLD_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Move-Item "C:\Users\Windows\MonApp" $backupCurrent
    Write-Host "📦 Ancienne version sauvée dans: $backupCurrent" -ForegroundColor Yellow
}

# 2. Copier la sauvegarde
Copy-Item ".\*" -Destination "C:\Users\Windows\MonApp" -Recurse -Exclude @("RESTORE.ps1", "VERSION_INFO.txt") -Force

# 3. Aller dans le dossier et installer
Set-Location "C:\Users\Windows\MonApp"
npm install

Write-Host "✅ Restauration terminée!" -ForegroundColor Green
Write-Host "Pour lancer l'application:" -ForegroundColor Cyan
Write-Host "cd C:\Users\Windows\MonApp" -ForegroundColor White
Write-Host "npx expo start --tunnel" -ForegroundColor White
'@

$restoreScript | Out-File -FilePath "$backupPath\RESTORE.ps1" -Encoding UTF8

Write-Host "📦 Création de l'archive ZIP..." -ForegroundColor Yellow

# Créer une archive ZIP
$zipPath = "C:\Users\Windows\$backupName.zip"
Compress-Archive -Path $backupPath -DestinationPath $zipPath -Force

Write-Host "✅ Sauvegarde créée avec succès!" -ForegroundColor Green
Write-Host "📁 Dossier: $backupPath" -ForegroundColor Cyan
Write-Host "📦 Archive: $zipPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 CONTENU DE LA SAUVEGARDE:" -ForegroundColor Yellow
Write-Host "- Code source complet de l'application" -ForegroundColor White
Write-Host "- Fichiers de configuration (package.json, tsconfig.json, etc.)" -ForegroundColor White
Write-Host "- Assets (images, icônes)" -ForegroundColor White
Write-Host "- Documentation de version (VERSION_INFO.txt)" -ForegroundColor White
Write-Host "- Script de restauration (RESTORE.ps1)" -ForegroundColor White
Write-Host ""
Write-Host "🔄 Pour restaurer: Décompresser et exécuter RESTORE.ps1" -ForegroundColor Green