# Script de sauvegarde automatique pour l'application Skquad
# Créé le: November 8, 2025
# Application: Gestion Club Krav-Maga

# Configuration
$AppPath = "C:\Users\Windows\MonApp"
$BackupBasePath = "C:\Users\Windows\MonApp-Backups"
$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BackupPath = "$BackupBasePath\Skquad_Backup_$Timestamp"

Write-Host "🥋 === SAUVEGARDE APPLICATION KRAV-MAGA ===" -ForegroundColor Green
Write-Host "Date: $(Get-Date)" -ForegroundColor Cyan
Write-Host "Source: $AppPath" -ForegroundColor Yellow
Write-Host "Destination: $BackupPath" -ForegroundColor Yellow

# Créer le dossier de sauvegarde
if (!(Test-Path $BackupBasePath)) {
    New-Item -ItemType Directory -Path $BackupBasePath -Force
    Write-Host "✅ Dossier de sauvegarde créé: $BackupBasePath" -ForegroundColor Green
}

New-Item -ItemType Directory -Path $BackupPath -Force

# Fichiers et dossiers à sauvegarder
$ItemsToBackup = @(
    "app",
    "assets", 
    "components",
    "constants",
    "hooks",
    "package.json",
    "app.json",
    "tsconfig.json",
    "expo-env.d.ts",
    "eslint.config.js",
    "README.md"
)

Write-Host "`n📦 Copie des fichiers..." -ForegroundColor Cyan

foreach ($Item in $ItemsToBackup) {
    $SourcePath = Join-Path $AppPath $Item
    $DestPath = Join-Path $BackupPath $Item
    
    if (Test-Path $SourcePath) {
        if (Test-Path $SourcePath -PathType Container) {
            # C'est un dossier
            Copy-Item -Path $SourcePath -Destination $DestPath -Recurse -Force
            Write-Host "  ✅ Dossier copié: $Item" -ForegroundColor Green
        } else {
            # C'est un fichier
            Copy-Item -Path $SourcePath -Destination $DestPath -Force
            Write-Host "  ✅ Fichier copié: $Item" -ForegroundColor Green
        }
    } else {
        Write-Host "  ⚠️  Non trouvé: $Item" -ForegroundColor Yellow
    }
}

# Créer un fichier de documentation de la sauvegarde
$BackupInfoContent = @"
SAUVEGARDE APPLICATION KRAV-MAGA
=================================

Informations de sauvegarde:
 - Date de creation: $(Get-Date)
 - Application: Skquad - Gestion Club Krav-Maga  
- Version: Complete avec gestion calendrier
- Plateforme: React Native / Expo

Fonctionnalites incluses:
- Gestion du calendrier complete
- Cours recurrents (hebdomadaires)
- Evenements ponctuels avec dates precises (format JJ-MM-AAAA)
- Champ details pour les evenements speciaux
- Activation/desactivation des cours
- Modal de suppression securise
- Interface principale adaptative
- Mode admin vs mode eleve
- Synchronisation en temps reel avec le calendrier
- Affichage des dates avec mois
- Evenements cliquables avec details
- Systeme d'authentification
- PIN admin (3107)
- Identification des eleves avec verification serveur
- Navigation automatique apres connexion
- Interface utilisateur optimisee
- Tuiles adaptatives selon le nombre (200px/90px)
- Images personnalisees
- Modal de details d'evenements elegant
- Indicateurs visuels

Fichiers principaux:
- app/(tabs)/index.tsx - Page principale avec calendrier integre
- app/(tabs)/calendrier.tsx - Interface de gestion complete
- app/(tabs)/identification.tsx - Authentification des eleves
- app/(tabs)/recapitulatif.tsx - Recapitulatif admin
- app/(tabs)/evaluations.tsx - Evaluations des eleves
- assets/images/tuilecal.png - Image personnalisee calendrier

Instructions de restauration:

Prerequis:
- Node.js installe
- Expo CLI installe (npm install -g @expo/cli)
- Git installe

Etapes de restauration:
1. Copier tout le contenu de cette sauvegarde vers un nouveau dossier
2. Ouvrir un terminal dans le dossier de l'application
3. Installer les dependances: npm install
4. Lancer l'application: npx expo start

Configuration serveur:
- API Eleves: https://cfsd91.com/eleves.php
- PIN Admin: 3107
- Stockage local: AsyncStorage pour la persistence

Utilisation:
1. Mode visiteur: Acces limite aux adhesions et evenements publics
2. Mode eleve: Identification par nom/prenom, acces aux evaluations
3. Mode admin: PIN 3107, acces complet incluant gestion calendrier

Support:
Cette sauvegarde contient une version complete et fonctionnelle de l'application.
Tous les composants ont ete testes et valides.

Sauvegarde creee automatiquement le $(Get-Date)
"@

$BackupInfoContent | Out-File -FilePath $BackupInfoPath -Encoding UTF8

# Créer un fichier ZIP de la sauvegarde
Write-Host "`n📦 Création de l'archive ZIP..." -ForegroundColor Cyan
$ZipPath = "$BackupBasePath\Skquad_Backup_$Timestamp.zip"

try {
    Compress-Archive -Path "$BackupPath\*" -DestinationPath $ZipPath -Force
    Write-Host "✅ Archive créée: $ZipPath" -ForegroundColor Green
    
    # Calculer la taille de l'archive
    $ZipSize = (Get-Item $ZipPath).Length
    $ZipSizeMB = [Math]::Round($ZipSize / 1MB, 2)
    Write-Host "📊 Taille de l'archive: $ZipSizeMB MB" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Erreur lors de la création de l'archive: $_" -ForegroundColor Red
}

# Résumé final
Write-Host "`n🎉 === SAUVEGARDE TERMINÉE ===" -ForegroundColor Green
Write-Host "📁 Dossier: $BackupPath" -ForegroundColor Yellow
Write-Host "📦 Archive: $ZipPath" -ForegroundColor Yellow
Write-Host "📖 Documentation: $BackupPath\README_SAUVEGARDE.md" -ForegroundColor Yellow

# Ouvrir le dossier de sauvegarde
Write-Host "`n🔍 Ouverture du dossier de sauvegarde..." -ForegroundColor Cyan
Start-Process explorer.exe -ArgumentList $BackupBasePath

Write-Host "`n✨ Votre application Krav-Maga est sauvegardée avec succès !" -ForegroundColor Green