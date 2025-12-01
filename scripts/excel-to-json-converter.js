// Script de conversion Excel → JSON pour CFSD91
// Utilise ce script pour convertir ta liste Excel en format compatible app

const fs = require('fs');
const path = require('path');

// Mapping des colonnes Excel vers format app (NOUVELLE STRUCTURE)
const excelToAppMapping = {
  // Excel → App field
  'Code Adh.': 'licence',                 // Code adhérent → licence
  'Competiteur': 'combattant',            // Compétiteur → boolean
  'Nom Prénom': ['nom', 'prenom'],        // Split nom/prénom
  'H/F': 'genre',                         // H/F → genre
  'Date de naissance': 'naissance',       // Date → format string
  'Adresse': 'adresse',                   // Adresse complète
  'Villes': 'ville',                      // Code postal + ville
  'Age': 'age',                           // Age calculé
  'Mail': 'email',                        // Email
  'tel': 'telEleve'                       // Téléphone élève
};

// Fonction de conversion d'une ligne Excel
function convertExcelRow(excelRow) {
  const eleve = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    jour: '', // À définir selon planning
    discipline: 'MMA', // Par défaut, à ajuster selon besoin
    etudiant: false, // Par défaut
    renouvellement: false, // Par défaut
    ceinture: '', // Par défaut
    photo: '', // Par défaut
    telUrgence: '' // Par défaut
  };

  // Traitement spécial pour Nom Prénom
  if (excelRow['Nom Prénom']) {
    const parts = excelRow['Nom Prénom'].trim().split(' ');
    eleve.nom = parts[0] || '';
    eleve.prenom = parts.slice(1).join(' ') || '';
  }

  // Compétiteur : toute valeur non vide → true
  if (excelRow['Competiteur']) {
    const comp = excelRow['Competiteur'].toString().trim().toLowerCase();
    eleve.combattant = comp !== '' && comp !== 'non' && comp !== '0' && comp !== 'false';
  }

  // Date de naissance : format DD/MM/YYYY
  if (excelRow['Date de naissance']) {
    eleve.naissance = excelRow['Date de naissance'];
  }

  // Mapping direct des autres champs
  eleve.licence = excelRow['Code Adh.'] || '';
  eleve.genre = excelRow['H/F'] || '';
  eleve.adresse = excelRow['Adresse'] || '';
  eleve.ville = excelRow['Villes'] || '';
  eleve.age = excelRow['Age'] || null;
  eleve.email = excelRow['Mail'] || '';
  eleve.telEleve = excelRow['tel'] || '';

  return eleve;
}

function generateId() {
  return 'eleve_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Exemple d'utilisation avec ta nouvelle structure
const exampleData = [
  {
    'Code Adh.': 'ADH001',
    'Competiteur': 'oui',
    'Nom Prénom': 'DUPONT JEAN',
    'H/F': 'H',
    'Date de naissance': '15/03/1990',
    'Adresse': '123 rue de la Paix',
    'Villes': '91000 EVRY',
    'Age': 35,
    'Mail': 'jean.dupont@email.com',
    'tel': '06 12 34 56 78'
  }
];

// Conversion
const elevesConverted = exampleData.map(convertExcelRow);
console.log('Élèves convertis:', JSON.stringify(elevesConverted, null, 2));

module.exports = { convertExcelRow, excelToAppMapping };