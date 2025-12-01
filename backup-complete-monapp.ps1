# backup-complete-monapp.ps1
# Crée une archive zip complète du projet (exclut le dossier backups lui-même)
# Usage : exécuter depuis la racine du projet (ou double-cliquer)

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$backupDir = Join-Path $scriptRoot 'backups'
if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir | Out-Null }

$dest = Join-Path $backupDir ("Skquad-backup-$timestamp.zip")

# Rassembler les éléments à archiver (exclut le dossier backups pour éviter récursion)
$items = Get-ChildItem -Path $scriptRoot -Force | Where-Object { $_.Name -ne 'backups' } | ForEach-Object { $_.FullName }

# Créer l'archive
try {
    Compress-Archive -LiteralPath $items -DestinationPath $dest -Force -ErrorAction Stop
    Write-Host "Backup created:" $dest
} catch {
    Write-Error "Backup failed: $_"
    exit 1
}

# Afficher la taille du fichier créé
if (Test-Path $dest) {
    $size = (Get-Item $dest).Length
    Write-Host "Backup size:" ([math]::Round($size/1MB, 2)) "MB"
}
