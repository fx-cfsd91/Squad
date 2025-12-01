// compress-images.js - Script simple de compression d'images
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const imagesDir = path.join(__dirname, 'assets', 'images');
const backupDir = path.join(__dirname, 'assets', 'images_backup_' + Date.now());

console.log('\n=== Compression des images PNG ===\n');

// Créer backup
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

// Lister les PNG
const files = fs.readdirSync(imagesDir).filter(f => f.endsWith('.png'));

console.log(`Trouvé ${files.length} images PNG\n`);
console.log('Backup des originaux dans:', backupDir, '\n');

let totalOriginal = 0;
let totalCompressed = 0;

files.forEach(file => {
    const originalPath = path.join(imagesDir, file);
    const backupPath = path.join(backupDir, file);
    const stats = fs.statSync(originalPath);
    const originalSize = stats.size;
    
    // Copier vers backup
    fs.copyFileSync(originalPath, backupPath);
    
    console.log(`📦 ${file}: ${(originalSize/1024).toFixed(1)} KB`);
    
    totalOriginal += originalSize;
});

const savedMB = ((totalOriginal - totalCompressed) / 1024 / 1024).toFixed(2);

console.log(`\n✅ Backup créé avec succès`);
console.log(`   Total: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
console.log(`   Backup: ${backupDir}`);
console.log(`\nPour compresser les images, installe TinyPNG CLI ou utilise https://tinypng.com`);
console.log(`Ou réduis manuellement la résolution des images de fond (adhesion-bg.png, etc.)\n`);
