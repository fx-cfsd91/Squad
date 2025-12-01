# set-java17-env.ps1
$jdkHome = 'C:\Program Files\Eclipse Adoptium\jdk-17.0.16.8-hotspot'
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
