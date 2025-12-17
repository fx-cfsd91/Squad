#!/usr/bin/env node

/**
 * Script pour synchroniser les mots de passe avec le serveur IONOS
 * Ajoute "CFSD91@Yerres" à tous les élèves qui n'en ont pas
 */

const http = require('http');
const https = require('https');

const API_KEY = 'Mac131080';
const SERVER_URL = 'https://cfsd91.com/eleves.php';

// Helper pour faire des requêtes HTTPS
function makeRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: body ? JSON.parse(body) : null });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function syncPasswords() {
  console.log('🔄 Synchronisation des mots de passe...\n');

  try {
    // Étape 1: Récupérer tous les élèves
    console.log('📥 Téléchargement des élèves du serveur...');
    const fetchRes = await makeRequest(SERVER_URL, {
      method: 'GET',
      headers: {
        'X-API-KEY': API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (fetchRes.status !== 200) {
      throw new Error(`Erreur serveur: ${fetchRes.status}`);
    }

    const eleves = Array.isArray(fetchRes.body) ? fetchRes.body : [];
    console.log(`✅ ${eleves.length} élèves chargés\n`);

    // Étape 2: Ajouter le mot de passe par défaut s'il manque
    let updated = 0;
    const elevesWithPasswords = eleves.map(e => {
      if (!e.password || e.password === null || e.password === '') {
        updated++;
        return { ...e, password: 'CFSD91@Yerres' };
      }
      return e;
    });

    console.log(`⚙️  ${updated} élève(s) nécessite(nt) un mot de passe\n`);

    if (updated === 0) {
      console.log('✅ Tous les élèves ont déjà un mot de passe!');
      return;
    }

    // Étape 3: Envoyer les mises à jour au serveur
    console.log('📤 Envoi des mises à jour au serveur...');
    
    for (let i = 0; i < elevesWithPasswords.length; i++) {
      const e = elevesWithPasswords[i];
      if (eleves[i] && !eleves[i].password) {
        const updateRes = await makeRequest(SERVER_URL, {
          method: 'PUT',
          headers: {
            'X-API-KEY': API_KEY,
            'Content-Type': 'application/json'
          }
        }, {
          id: e.id,
          password: 'CFSD91@Yerres'
        });

        if (updateRes.status === 200) {
          console.log(`  ✅ ${e.nom || 'ID:' + e.id}: Mot de passe ajouté`);
        } else {
          console.log(`  ⚠️  ${e.nom || 'ID:' + e.id}: Erreur ${updateRes.status}`);
        }
      }
    }

    console.log(`\n✅ Synchronisation complétée! ${updated} mot(s) de passe ajouté(s)`);

  } catch (error) {
    console.error('💥 Erreur:', error.message);
    process.exit(1);
  }
}

syncPasswords();
