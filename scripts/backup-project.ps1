param(
  [string]$Source = "$PSScriptRoot\..",
  [string]$DestFolder = "$env:USERPROFILE\Backups\Skquad",
  [string]$Prefix = "Skquad_backup"
)

try {
  $dt = Get-Date -Format "yyyyMMdd_HHmmss"
  if (!(Test-Path $DestFolder)) { New-Item -ItemType Directory -Path $DestFolder | Out-Null }
  $zip = Join-Path $DestFolder ("$Prefix" + "_" + $dt + ".zip")
  Write-Output "Creating backup from: $Source"
  Compress-Archive -Path (Join-Path $Source '*') -DestinationPath $zip -Force
  Write-Output "Backup created: $zip"
} catch {
  Write-Error "Backup failed: $_"
  exit 1
}