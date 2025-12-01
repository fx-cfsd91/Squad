const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const csvFile = path.join(__dirname, '../Desktop/export.csv');
const outputFile = path.join(__dirname, '../data/eleves-import.json');

function parseDate(dateStr) {
  if (!dateStr) return '';
  const [d, m, y] = dateStr.split('/');
  if (!d || !m || !y) return '';
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function cleanString(str) {
  return (str || '').replace(/\s+/g, ' ').trim();
}

function csvToJson(csv) {
  const lines = csv.split(/\r?\n/).filter(l => l.trim());
  const header = lines[0].split(';');
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(';');
    if (row.length < 9) continue;
    const nomPrenom = cleanString(row[2]).split(' ');
    const nom = nomPrenom[0] || '';
    const prenom = nomPrenom.slice(1).join(' ') || '';
    data.push({
      id: uuidv4(),
      nom,
      prenom,
      naissance: parseDate(row[4]),
      jour: '',
      discipline: cleanString(row[0]),
      combattant: false,
      etudiant: false,
      renouvellement: false,
      telUrgence: cleanString(row[9] || ''),
      telEleve: cleanString(row[8] || ''),
      email: cleanString(row[7] || ''),
      adresse: `${cleanString(row[5])}, ${cleanString(row[6])}`,
      poids: null,
      licence: cleanString(row[1] || ''),
      ceinture: '',
      photo: '',
      createdAt: ''
    });
  }
  return data;
}

fs.readFile(csvFile, 'utf8', (err, csv) => {
  if (err) throw err;
  const json = csvToJson(csv);
  fs.writeFile(outputFile, JSON.stringify(json, null, 2), err => {
    if (err) throw err;
    console.log('Conversion terminée :', outputFile);
  });
});
