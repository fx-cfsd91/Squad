# optimize-images.ps1
# Script pour optimiser les images PNG du projet

Write-Host "=== Optimisation des images ===" -ForegroundColor Cyan
Write-Host ""

# Vérifier si pngquant est installé (sinon on va installer via npm sharp)
$sharpInstalled = npm list sharp --depth=0 2>$null
if (-not $sharpInstalled) {
    Write-Host "Installation de sharp pour l'optimisation d'images..." -ForegroundColor Yellow
    npm install --save-dev sharp
}

# Créer un script Node.js temporaire pour optimiser les images
$optimizeScript = @"
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const imagesDir = path.join(__dirname, 'assets', 'images');
const backupDir = path.join(__dirname, 'assets', 'images_backup_' + Date.now());

// Créer un dossier de backup
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

console.log('Backup des images originales dans:', backupDir);

// Lister tous les fichiers PNG
const files = fs.readdirSync(imagesDir).filter(f => f.endsWith('.png'));

console.log(`\nOptimisation de ${files.length} images PNG...\n`);

let total = 0;
let saved = 0;

Promise.all(files.map(async (file) => {
    const originalPath = path.join(imagesDir, file);
    const backupPath = path.join(backupDir, file);
    const stats = fs.statSync(originalPath);
    const originalSize = stats.size;
    
    // Copier l'original vers backup
    fs.copyFileSync(originalPath, backupPath);
    
    // Optimiser avec sharp
    await sharp(originalPath)
        .png({ quality: 85, compressionLevel: 9 })
        .toFile(originalPath + '.tmp');
    
    // Remplacer l'original
    fs.unlinkSync(originalPath);
    fs.renameSync(originalPath + '.tmp', originalPath);
    
    const newStats = fs.statSync(originalPath);
    const newSize = newStats.size;
    const savedBytes = originalSize - newSize;
    const percentSaved = ((savedBytes / originalSize) * 100).toFixed(1);
    
    total += originalSize;
    saved += savedBytes;
    
    console.log(`✓ ${file}: ${(originalSize/1024).toFixed(1)}KB → ${(newSize/1024).toFixed(1)}KB (${percentSaved}% réduit)`);
})).then(() => {
    const totalSavedMB = (saved / 1024 / 1024).toFixed(2);
    const percentTotal = ((saved / total) * 100).toFixed(1);
    console.log(`\n✅ Optimisation terminée!`);
    console.log(`   Total économisé: ${totalSavedMB} MB (${percentTotal}%)`);
    console.log(`   Backup disponible: ${backupDir}`);
}).catch(err => {
    console.error('Erreur:', err);
    process.exit(1);
});
"@

# Écrire le script temporaire
$optimizeScript | Out-File -FilePath "optimize-temp.js" -Encoding utf8

Write-Host "Lancement de l'optimisation..." -ForegroundColor Green
node optimize-temp.js

# Nettoyer le script temporaire
Remove-Item "optimize-temp.js" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=== Terminé ===" -ForegroundColor Cyan
Write-Host "Les images optimisées sont dans assets/images" -ForegroundColor Green
Write-Host "Un backup des originaux a été créé (dossier images_backup_*)" -ForegroundColor Yellow
