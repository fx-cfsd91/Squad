# Script de conversion Excel vers JSON pour CFSD91
# Usage: .\convert-cfsd91-excel.ps1

Write-Host "=== CONVERTISSEUR EXCEL CFSD91 ===" -ForegroundColor Green

# Vérifier si le module ImportExcel est installé
if (!(Get-Module -ListAvailable -Name ImportExcel)) {
    Write-Host "Installation du module ImportExcel..." -ForegroundColor Yellow
    Install-Module ImportExcel -Force -Scope CurrentUser
}

# Fonction de conversion d'une ligne Excel vers objet JSON
function ConvertFrom-ExcelRow {
    param(
        [PSCustomObject]$row,
        [int]$index
    )
    
    # Mapping des disciplines selon les codes CFSD91
    $discipline = "MMA"  # Par défaut
    $competiteur = $row."Competiteur"
    
    if ($competiteur -like "*k*") {
        $discipline = "Krav-Maga"
    } elseif ($competiteur -like "*w*") {
        $discipline = "MMA"
    } elseif ($competiteur -eq "oui" -or $competiteur -eq "oui +") {
        $discipline = "MMA"
    } elseif ($competiteur -eq "OUI" -or $competiteur -eq "OK +") {
        $discipline = "MMA"
    }
    
    # Déterminer le genre depuis "H/F"
    $genre = switch ($row."H/F") {
        "H" { "H" }
        "F" { "F" }
        "kh" { "M" }  # enfant masculin krav
        "wh" { "M" }  # enfant masculin MMA
        "kf" { "F" }  # enfant féminin krav
        "wf" { "F" }  # enfant féminin MMA
        default { "H" }
    }
    
    # Déterminer si c'est un combattant actif
    $combattant = $competiteur -like "*+*" -or $competiteur -eq "oui" -or $competiteur -eq "OUI"
    
    # Créer l'objet élève
    $eleve = @{
        id = "eleve_cfsd91_$(($index + 1).ToString("000"))"
        nom = ($row."Nom Prénom" -split " ")[0]
        prenom = (($row."Nom Prénom" -split " ", 2)[1] -replace "^\s+", "")
        naissance = $row."Date de naissance"
        jour = ""
        discipline = $discipline
        combattant = $combattant
        etudiant = $false
        renouvellement = $false
        telUrgence = ""
        telEleve = ""
        email = $row."Mail"
        adresse = "$($row."Adresse"), $($row."Villes")"
        ville = $row."Villes"
        licence = $row."Code Adh."
        genre = $genre
        age = [int]$row."Age"
        ceinture = ""
        photo = ""
        createdAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    }
    
    return $eleve
}

# Traitement principal
try {
    # Demander le fichier Excel
    $excelPath = Read-Host "Chemin vers le fichier Excel CFSD91 (glisser-déposer le fichier ici)"
    $excelPath = $excelPath.Trim('"')
    
    if (!(Test-Path $excelPath)) {
        Write-Host "Fichier non trouvé: $excelPath" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Lecture du fichier Excel..." -ForegroundColor Yellow
    $data = Import-Excel -Path $excelPath
    
    Write-Host "Conversion de $($data.Count) lignes..." -ForegroundColor Yellow
    
    $eleves = @()
    $progressCount = 0
    
    foreach ($row in $data) {
        # Ignorer les lignes vides ou sans nom
        if ([string]::IsNullOrWhiteSpace($row."Nom Prénom")) {
            continue
        }
        
        $eleve = ConvertFrom-ExcelRow -row $row -index $progressCount
        $eleves += $eleve
        
        $progressCount++
        if ($progressCount % 10 -eq 0) {
            Write-Host "Traité: $progressCount élèves..." -ForegroundColor Cyan
        }
    }
    
    # Sauvegarder le fichier JSON
    $outputPath = ".\data\eleves-cfsd91-complet.json"
    $eleves | ConvertTo-Json -Depth 10 | Out-File -FilePath $outputPath -Encoding UTF8
    
    Write-Host "=== CONVERSION TERMINÉE ===" -ForegroundColor Green
    Write-Host "Fichier créé: $outputPath" -ForegroundColor Green
    Write-Host "Total élèves convertis: $($eleves.Count)" -ForegroundColor Green
    
    # Afficher un aperçu
    Write-Host "`n=== APERÇU DES DONNÉES ===" -ForegroundColor Yellow
    $eleves | Select-Object -First 3 nom, prenom, discipline, genre, age | Format-Table -AutoSize
    
    # Statistiques
    $stats = @{
        "MMA" = ($eleves | Where-Object { $_.discipline -eq "MMA" }).Count
        "Krav-Maga" = ($eleves | Where-Object { $_.discipline -eq "Krav-Maga" }).Count
        "Hommes" = ($eleves | Where-Object { $_.genre -eq "H" }).Count
        "Femmes" = ($eleves | Where-Object { $_.genre -eq "F" }).Count
        "Enfants M" = ($eleves | Where-Object { $_.genre -eq "M" }).Count
        "Enfants F" = ($eleves | Where-Object { $_.genre -eq "F" -and $_.age -lt 18 }).Count
        "Combattants" = ($eleves | Where-Object { $_.combattant -eq $true }).Count
    }
    
    Write-Host "`n=== STATISTIQUES ===" -ForegroundColor Yellow
    $stats.GetEnumerator() | Sort-Object Name | ForEach-Object {
        Write-Host "$($_.Key): $($_.Value)" -ForegroundColor Cyan
    }
    
} catch {
    Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`nTu peux maintenant utiliser ces données dans ton app ! 🥋" -ForegroundColor Green