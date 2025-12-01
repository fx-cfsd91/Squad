# Script de sauvegarde complete avec horodatage
# Date: 09/11/2025

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupName = "Skquad_Backup_$timestamp"
$backupPath = "C:\Users\Windows\$backupName"

Write-Host "Creation de la sauvegarde: $backupName" -ForegroundColor Green

# Creer le dossier de sauvegarde
New-Item -ItemType Directory -Path $backupPath -Force | Out-Null

# Copier tous les fichiers source importants
Write-Host "Copie des fichiers sources..." -ForegroundColor Yellow

# Copier l'ensemble du projet
Copy-Item "C:\Users\Windows\MonApp\*" -Destination $backupPath -Recurse -Exclude @("node_modules", ".expo", "dist", "build", ".git") -Force

# Creer un fichier de version
$versionInfo = @"
SAUVEGARDE APPLICATION SKQUAD
Date de sauvegarde: $(Get-Date -Format "dd/MM/yyyy a HH:mm:ss")
Version: Application complete fonctionnelle

FONCTIONNALITES IMPLEMENTEES:
- Systeme d'authentification (Admin PIN: 3107 + Eleves via serveur)
- Gestion du calendrier avec cours recurrents et evenements ponctuels
- Affichage des prochains cours (3 prochains cours recurrents)
- Section competitions (evenements ponctuels de l'annee sportive)
- Logique d'annee sportive (1er septembre au 5 juillet)
- Persistance via serveur IONOS (calendar.json)
- Interface adaptive selon le mode (visiteur/eleve/admin)
- Gestion des details pour tous les evenements

SERVEUR:
- URL eleves: https://cfsd91.com/eleves.php
- Stockage calendrier: https://cfsd91.com/calendar.json
- PIN Admin: 3107
"@

$versionInfo | Out-File -FilePath "$backupPath\VERSION_INFO.txt" -Encoding UTF8

Write-Host "Creation de l'archive ZIP..." -ForegroundColor Yellow

# Creer une archive ZIP
$zipPath = "C:\Users\Windows\$backupName.zip"
Compress-Archive -Path $backupPath -DestinationPath $zipPath -Force

Write-Host "Sauvegarde creee avec succes!" -ForegroundColor Green
Write-Host "Dossier: $backupPath" -ForegroundColor Cyan
Write-Host "Archive: $zipPath" -ForegroundColor Cyan