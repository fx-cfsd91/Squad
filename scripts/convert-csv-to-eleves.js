const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Parse CSV file
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  // Get header
  const headers = lines[0].split(';').map(h => h.trim());
  
  // Parse rows
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const cells = line.split(';').map(c => c.trim());
    const row = {};
    
    headers.forEach((header, idx) => {
      row[header] = cells[idx] || '';
    });
    
    // Skip empty rows or rows with special text
    if (!row['Nom Prénom'] || row['Nom Prénom'].includes('licence') || 
        row['Nom Prénom'].includes('déjà') || row['Nom Prénom'].includes('Coach') ||
        row['Nom Prénom'].includes('modification') || row['Nom Prénom'].includes('E5')) {
      continue;
    }
    
    rows.push(row);
  }
  
  return rows;
}

// Convert date from MM/DD/YYYY to YYYY-MM-DD
function convertDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const month = parts[0].padStart(2, '0');
    const day = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return '';
}

// Clean phone number
function cleanPhone(phone) {
  if (!phone) return '';
  return phone.replace(/\s+/g, '').replace(/\.+/g, '');
}

// Parse name into nom and prenom (first part is nom, rest is prenom)
function parseName(fullName) {
  if (!fullName) return { nom: '', prenom: '' };
  
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return { nom: '', prenom: '' };
  if (parts.length === 1) return { nom: parts[0], prenom: '' };
  
  // First part is nom, rest is prenom
  const nom = parts[0];
  const prenom = parts.slice(1).join(' ');
  
  return { nom, prenom };
}

// Map discipline names
function mapDiscipline(discipline) {
  const d = discipline.toLowerCase();
  if (d.includes('karate')) return 'Karaté Mix';
  if (d.includes('krav')) return 'Krav-Maga';
  return discipline;
}

// Transform CSV row to Eleve object
function transformRow(row) {
  const { nom, prenom } = parseName(row['Nom Prénom']);
  
  return {
    id: uuidv4(),
    nom: nom.trim(),
    prenom: prenom.trim(),
    naissance: convertDate(row['Date de naissance']),
    jour: '',
    discipline: mapDiscipline(row['Discipline']),
    combattant: false,
    etudiant: false,
    renouvellement: false,
    autorisationDepartSeul: false,
    telUrgence: cleanPhone(row['Urgence']),
    telEleve: cleanPhone(row['eleve']),
    email: row['Mail'] && row['Mail'] !== 'sans' ? row['Mail'] : '',
    adresse: row['Adresse'] ? `${row['Adresse']}\n${row['Villes']}` : row['Villes'],
    poids: null,
    licence: row['N° de License'] || '',
    ceinture: '',
    photo: '',
    createdAt: new Date().toISOString(),
    password: ''
  };
}

// Main function
function main() {
  const csvPath = process.argv[2];
  
  if (!csvPath || !fs.existsSync(csvPath)) {
    console.error('❌ CSV file not found');
    process.exit(1);
  }
  
  console.log(`📄 Reading CSV: ${csvPath}`);
  const csvData = parseCSV(csvPath);
  console.log(`✅ Found ${csvData.length} rows`);
  
  // Transform to eleves
  const eleves = csvData.map(transformRow).filter(e => e.nom && e.prenom);
  
  console.log(`✅ Transformed ${eleves.length} eleves`);
  
  // Save to JSON
  const outputPath = path.join(__dirname, '../data/eleves-import.json');
  fs.writeFileSync(outputPath, JSON.stringify(eleves, null, 2));
  
  console.log(`✅ Saved to: ${outputPath}`);
  console.log('\n📊 Sample (first 2):');
  console.log(JSON.stringify(eleves.slice(0, 2), null, 2));
}

main();
