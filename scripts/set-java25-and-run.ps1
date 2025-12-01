# set-java25-and-run.ps1
$jdkHome = 'C:\Program Files\Eclipse Adoptium\jdk-25.0.0.36-hotspot'
$jdkBin = "$jdkHome\bin"

Write-Host "Setting JAVA_HOME to $jdkHome"
setx JAVA_HOME $jdkHome | Out-Null
$oldPath = [Environment]::GetEnvironmentVariable('PATH','User')
if ($oldPath -notlike "*$jdkBin*") {
  setx PATH ("$jdkBin;$oldPath") | Out-Null
}

# Update current session
$env:JAVA_HOME = $jdkHome
$env:Path = "$jdkBin;$oldPath"

Write-Host "JAVA_HOME now: $env:JAVA_HOME"
java -version

Write-Host "Launching Android build (expo run:android)..."
Set-Location (Join-Path $PSScriptRoot '..')

npx expo run:android
