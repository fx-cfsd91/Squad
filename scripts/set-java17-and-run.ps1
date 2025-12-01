# set-java17-and-run.ps1
# Installe Temurin JDK 17 (si winget disponible), configure JAVA_HOME et lance la build Android

Write-Host "=== Setup JDK 17 and build Android (Skquad) ==="

# Tenter d'installer via winget (peut demander élévation)
try {
  Write-Host "Tentative d'installation Temurin JDK 17 via winget..."
  winget install --id Eclipse.Adoptium.Temurin.17 -e --accept-package-agreements --accept-source-agreements
} catch {
  Write-Host "winget install a retourné une erreur ou requiert des droits: $_"
}

# Vérifier java
$javaCmd = Get-Command java -ErrorAction SilentlyContinue
if ($null -eq $javaCmd) {
  Write-Host "java non trouvé après tentative d'installation. Vérifie l'installation manuelle ou installe JDK 17 depuis https://adoptium.net/" -ForegroundColor Red
  exit 1
}

$javaExe = $javaCmd.Source
$jdkBin = Split-Path $javaExe -Parent
$jdkHome = Split-Path $jdkBin -Parent

Write-Host "java.exe trouvé: $javaExe"
Write-Host "Configuration JAVA_HOME => $jdkHome"

# Définit JAVA_HOME pour l'utilisateur et ajoute bin au PATH utilisateur si nécessaire
setx JAVA_HOME $jdkHome | Out-Null
$oldPath = [Environment]::GetEnvironmentVariable('PATH','User')
if ($oldPath -notlike "*${jdkBin}*") {
  setx PATH "$oldPath;${jdkBin}" | Out-Null
}

# Met à jour la session courante
$env:JAVA_HOME = $jdkHome
$env:Path = "$oldPath;${jdkBin}"

# Affiche la version
java -version

# Lancer la build Android via Expo
Write-Host "Lancement du build Android (expo run:android) — ceci peut prendre plusieurs minutes..." -ForegroundColor Cyan
Set-Location (Join-Path $PSScriptRoot '..')

npx expo run:android
