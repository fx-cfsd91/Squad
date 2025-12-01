// Génère tous les fichiers JSON discipline/ceinture pour le serveur public
const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '../data');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const combos = [
  // Kids
  { discipline: 'KIDS', belts: ['JauneI','JauneII','JauneIII','OrangeI','OrangeII','OrangeIII'] },
  // Warrior
  { discipline: 'WAR', belts: ['JauneI','JauneII','JauneIII','OrangeI','OrangeII','OrangeIII','Verte','Bleue'] },
  // MMA
  { discipline: 'MMA', belts: ['Jaune','Orange','Verte','Bleue','Violette','Marron'] },
  // Krav-Maga
  { discipline: 'KRAV', belts: ['Jaune','Orange','Verte','Bleue','Violette','Marron'] },
];

for (const { discipline, belts } of combos) {
  for (const belt of belts) {
    const fileName = `${discipline}${belt}.json`;
    const filePath = path.join(outputDir, fileName);
    const data = {
      discipline,
      belt,
      evaluations: [] // À remplir selon vos besoins
    };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log('Créé:', fileName);
  }
}

console.log('Tous les fichiers JSON ont été générés dans', outputDir);
