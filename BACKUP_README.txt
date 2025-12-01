Sauvegarde du projet Skquad

- Script de sauvegarde:
  - `scripts\backup-project.ps1`
  - Usage exemple (PowerShell):
      cd C:\Users\Windows\MonApp\scripts
      .\backup-project.ps1
  - Par défaut le ZIP est créé dans `%USERPROFILE%\Backups\Skquad`.

- Commande manuelle pour créer une archive maintenant (PowerShell):
    $dt = Get-Date -Format yyyyMMdd_HHmmss; $zip = "$env:USERPROFILE\Skquad_backup_$dt.zip"; Compress-Archive -Path 'C:\Users\Windows\MonApp\*' -DestinationPath $zip -Force; Write-Output "Created: $zip"

Remarques:
- Le script inclut un paramètre `-Source` pour changer le dossier source et `-DestFolder` pour changer l'emplacement de destination.
- Vérifiez que vous avez les droits nécessaires pour lire tous les fichiers et écrire dans le dossier de destination.
