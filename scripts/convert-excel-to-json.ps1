# Script PowerShell pour convertir ton Excel en JSON pour l'app CFSD91
# Usage: .\convert-excel-to-json.ps1 -ExcelPath "C:\chemin\vers\ton\fichier.xlsx"

param(
    [Parameter(Mandatory=$true)]
    [string]$ExcelPath,
    
    [Parameter(Mandatory=$false)]
    [string]$OutputPath = ".\data\mes-eleves.json"
)

function Convert-ExcelToJson {
    param($ExcelPath, $OutputPath)
    
    Write-Host "🔄 Conversion de ton Excel en cours..." -ForegroundColor Yellow
    
    try {
        # Vérifier si le fichier existe
        if (!(Test-Path $ExcelPath)) {
            throw "Fichier Excel non trouvé : $ExcelPath"
        }
        
        # Importer Excel (nécessite ImportExcel module)
        try {
            Import-Module ImportExcel -ErrorAction Stop
        } catch {
            Write-Host "❌ Module ImportExcel manquant. Installation..." -ForegroundColor Red
            Install-Module ImportExcel -Scope CurrentUser -Force
            Import-Module ImportExcel
        }
        
        # Lire le fichier Excel
        $excelData = Import-Excel -Path $ExcelPath
        
        if ($excelData.Count -eq 0) {
            throw "Aucune donnée trouvée dans le fichier Excel"
        }
        
        Write-Host "📊 $($excelData.Count) lignes trouvées dans l'Excel" -ForegroundColor Green
        
        # Convertir chaque ligne
        $elevesJson = @()
        $counter = 1
        
        foreach ($row in $excelData) {
            # Vérifier que la ligne n'est pas vide
            if ([string]::IsNullOrWhiteSpace($row.'Nom Prénom')) {
                continue
            }
            
            # Séparer nom et prénom
            $nomComplet = $row.'Nom Prénom' -split ' '
            $nom = $nomComplet[0]
            $prenom = ($nomComplet[1..($nomComplet.Length-1)] -join ' ')
            
            # Déterminer si c'est un compétiteur
            $competiteur = $false
            if ($row.'Competiteur') {
                $compValue = $row.'Competiteur'.ToString().Trim().ToLower()
                $competiteur = $compValue -notin @('', 'non', '0', 'false', 'no')
            }
            
            # Créer l'objet élève
            $eleve = @{
                id = "eleve_$(Get-Date -UFormat '%s')_$counter"
                nom = $nom
                prenom = $prenom
                naissance = $row.'Date de naissance'
                jour = ""
                discipline = "MMA"  # Par défaut, tu peux changer après
                combattant = $competiteur
                etudiant = $false
                renouvellement = $false
                telUrgence = ""
                telEleve = $row.'tel'
                email = $row.'Mail'
                adresse = $row.'Adresse'
                ville = $row.'Villes' 
                licence = $row.'Code Adh.'
                genre = $row.'H/F'
                age = $row.'Age'
                ceinture = ""
                photo = ""
                createdAt = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ss.fffZ')
            }
            
            $elevesJson += $eleve
            $counter++
        }
        
        # Créer le dossier de sortie si nécessaire
        $outputDir = Split-Path $OutputPath -Parent
        if ($outputDir -and !(Test-Path $outputDir)) {
            New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
        }
        
        # Sauvegarder en JSON
        $elevesJson | ConvertTo-Json -Depth 10 | Set-Content -Path $OutputPath -Encoding UTF8
        
        Write-Host "✅ Conversion terminée !" -ForegroundColor Green
        Write-Host "📁 Fichier JSON créé : $OutputPath" -ForegroundColor Cyan
        Write-Host "👥 $($elevesJson.Count) élèves convertis" -ForegroundColor Cyan
        
        # Afficher un aperçu des premiers élèves
        Write-Host "`n🔍 Aperçu des premiers élèves :" -ForegroundColor Yellow
        $elevesJson | Select-Object -First 3 | ForEach-Object {
            Write-Host "   • $($_.nom) $($_.prenom) - $($_.discipline) - $($_.email)" -ForegroundColor White
        }
        
        return $OutputPath
        
    } catch {
        Write-Host "❌ Erreur : $($_.Exception.Message)" -ForegroundColor Red
        throw
    }
}

# Exécuter la conversion
try {
    $resultPath = Convert-ExcelToJson -ExcelPath $ExcelPath -OutputPath $OutputPath
    
    Write-Host "`n🎯 Prochaines étapes :" -ForegroundColor Magenta
    Write-Host "1. Copie le contenu de $resultPath" -ForegroundColor White
    Write-Host "2. Remplace les données dans adhesion.tsx" -ForegroundColor White
    Write-Host "3. Teste l'import dans l'app" -ForegroundColor White
    
} catch {
    Write-Host "❌ Échec de la conversion" -ForegroundColor Red
    exit 1
}