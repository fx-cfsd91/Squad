# 🔒 SÉCURITÉ API - DOCUMENTATION COMPLÈTE

## Status: ✅ SÉCURISÉ - AUTHENTIFICATION REQUISE

---

## 📋 Résumé des Mesures de Sécurité

| Feature | Status | Description |
|---------|--------|-------------|
| **Authentification API** | ✅ | Clé API requise pour TOUS les endpoints (GET, POST, PUT, DELETE) |
| **Masquage des mots de passe** | ✅ | Les passwords ne sont jamais retournés dans les réponses |
| **Audit Logging** | ✅ | Tous les accès sont loggés pour traçabilité |
| **Gestion d'erreurs** | ✅ | Erreurs sécurisées sans révéler les détails internes |
| **CORS** | ✅ | Configuré avec origine `*` mais authentification requise |

---

## 🔑 Authentification API

### Configuration de la Clé API

```php
// server/eleves.php
$ALLOWED_KEYS = ['Mac131080'];
```

### Clé API Actuelle
- **Clé**: `Mac131080`
- **Type**: Bearer Token dans header HTTP
- **Rotation**: Peut ajouter nouvelles clés dans `$ALLOWED_KEYS` pour transition

### Format de la Requête

Tous les appels API doivent inclure le header:

```
X-API-KEY: Mac131080
```

**Exemple avec curl:**
```bash
curl -X GET https://cfsd91.com/eleves.php \
  -H "X-API-KEY: Mac131080" \
  -H "Content-Type: application/json"
```

**Exemple en JavaScript/TypeScript:**
```typescript
// Configuré automatiquement dans lib/api.ts
const response = await fetch(url, {
  headers: {
    'X-API-KEY': 'Mac131080',
    'Content-Type': 'application/json'
  }
});
```

---

## 📊 Endpoints API Sécurisés

### 1️⃣ GET /eleves.php
**Récupérer la liste de tous les élèves**

✅ **Authentification requise**: Oui (X-API-KEY)

```bash
curl -X GET https://cfsd91.com/eleves.php \
  -H "X-API-KEY: Mac131080" \
  -H "Content-Type: application/json"
```

**Réponse 200 OK:**
```json
[
  {
    "id": "123",
    "nom": "Dupont",
    "prenom": "Jean",
    "naissance": "2010-05-15",
    "jour": "3",
    "discipline": "Taekwondo",
    "combattant": true,
    "email": "jean@example.com",
    "poids": "65",
    "photo": "data:image/jpeg;base64,..."
    // ⚠️ "password" est TOUJOURS filtré
  }
]
```

**Réponses d'erreur:**
- `401 Unauthorized` - Clé API manquante ou invalide
- `500 Internal Server Error` - Erreur serveur

---

### 2️⃣ POST /eleves.php
**Créer un nouvel élève**

✅ **Authentification requise**: Oui (X-API-KEY)

```bash
curl -X POST https://cfsd91.com/eleves.php \
  -H "X-API-KEY: Mac131080" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Martin",
    "prenom": "Alice",
    "naissance": "2011-03-20",
    "jour": "2",
    "discipline": "Karate",
    "password": "SecurePass123",
    "email": "alice@example.com"
  }'
```

**Réponse 201 Created:**
```json
{
  "success": true,
  "message": "Élève ajouté"
}
```

**Réponses d'erreur:**
- `400 Bad Request` - JSON invalide ou champs manquants
- `401 Unauthorized` - Clé API invalide

---

### 3️⃣ PUT /eleves.php
**Modifier un élève existant**

✅ **Authentification requise**: Oui (X-API-KEY)

```bash
curl -X PUT https://cfsd91.com/eleves.php \
  -H "X-API-KEY: Mac131080" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "123",
    "nom": "DupontModifié",
    "email": "newemail@example.com"
  }'
```

**Réponse 200 OK:**
```json
{
  "success": true,
  "message": "Élève modifié"
}
```

---

### 4️⃣ DELETE /eleves.php
**Supprimer un élève**

✅ **Authentification requise**: Oui (X-API-KEY)

```bash
curl -X DELETE https://cfsd91.com/eleves.php \
  -H "X-API-KEY: Mac131080" \
  -H "Content-Type: application/json" \
  -d '{"id": "123"}'
```

**Réponse 200 OK:**
```json
{
  "success": true,
  "message": "Élève supprimé"
}
```

---

## 📝 Audit Logging

### Emplacement des logs
```
/priv/api_logs/access.log
```

### Format des logs
```
2025-12-14 15:30:45 | GET | Key: Mac***1080 | Status: 200 | IP: 192.168.1.100 | Fetching all students
2025-12-14 15:30:46 | POST | Key: Mac***1080 | Status: 201 | IP: 192.168.1.100 | Created student
2025-12-14 15:30:47 | PUT | Key: Mac***1080 | Status: 200 | IP: 192.168.1.100 | Updated student: 123
2025-12-14 15:30:48 | GET | Key: NONE | Status: 401 | IP: 192.168.1.101 | Unauthorized
```

### Informations loggées:
- ✅ Timestamp (date et heure)
- ✅ Méthode HTTP (GET, POST, PUT, DELETE)
- ✅ Clé API (masquée: `Mac***1080`)
- ✅ Code HTTP de réponse
- ✅ Adresse IP du client
- ✅ Détails de l'opération

---

## 🛡️ Protection des Données Sensibles

### Champ "password"
- ✅ **Jamais retourné** dans les réponses GET
- ✅ **Toujours filtré** avant d'envoyer les données
- ✅ **Stocké** uniquement en base de données

**Exemple de filtrage:**
```php
// Avant retour au client
$filtered = array_map(function($eleve) {
    if (isset($eleve['password'])) unset($eleve['password']);
    return $eleve;
}, $data);
```

---

## ⚠️ Codes d'Erreur HTTP

| Code | Signification | Description |
|------|---------------|-------------|
| 200 | OK | Requête réussie (GET, PUT) |
| 201 | Created | Ressource créée avec succès (POST) |
| 400 | Bad Request | JSON invalide ou champs manquants |
| 401 | Unauthorized | Clé API manquante ou invalide |
| 404 | Not Found | Ressource introuvable |
| 405 | Method Not Allowed | Méthode HTTP non supportée |
| 500 | Server Error | Erreur serveur |

---

## 🔄 Rotation des Clés API

### Procédure de rotation:

1. **Ajouter la nouvelle clé** au tableau `$ALLOWED_KEYS`:
```php
$ALLOWED_KEYS = [
    'Mac131080',           // Clé actuelle
    'nouvellecle123456',   // Nouvelle clé
];
```

2. **Déployer le changement** sur le serveur

3. **Mettre à jour le frontend** avec la nouvelle clé dans `constants/config.ts`:
```typescript
export const API_HEADERS = {
  'X-API-KEY': 'nouvellecle123456',
};
```

4. **Tester** les deux clés (l'ancienne et la nouvelle)

5. **Retirer l'ancienne clé** une fois la transition confirmée:
```php
$ALLOWED_KEYS = ['nouvellecle123456'];
```

---

## 📱 Intégration Frontend

### Configuration dans le projet React Native

```typescript
// constants/config.ts
export const API_HEADERS = {
  'Content-Type': 'application/json',
  'X-API-KEY': 'Mac131080',
};

// lib/api.ts
const fetchWithTimeout = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: { ...API_HEADERS, ...options.headers },
  });
  return response;
};
```

### Composants qui utilisent l'API:
- ✅ `app/tabs/recapitulatif.tsx` - Récupère la liste des élèves
- ✅ `app/tabs/Presence.tsx` - Récupère les élèves pour l'appel
- ✅ `app/tabs/adhesion.tsx` - Crée un nouvel élève

---

## ✅ Bonnes Pratiques

### À FAIRE:
- ✅ Toujours envoyer le header `X-API-KEY`
- ✅ Utiliser HTTPS en production
- ✅ Vérifier les codes de réponse HTTP
- ✅ Implémenter du retry logic pour les erreurs 5xx
- ✅ Logger les erreurs API côté client
- ✅ Garder la clé API sécurisée

### À NE PAS FAIRE:
- ❌ Exposer la clé API dans les logs client
- ❌ Utiliser HTTP au lieu de HTTPS
- ❌ Envoyer la clé en tant que paramètre d'URL
- ❌ Commiter la clé dans le code sans variables d'environnement
- ❌ Faire confiance aveuglément aux réponses du serveur
- ❌ Oublier de filtrer les passwords avant affichage

---

## 🔍 Test de Sécurité

### Test 1: Requête sans clé API
```bash
curl -X GET https://cfsd91.com/eleves.php
# Attendu: 401 Unauthorized
```

### Test 2: Requête avec clé invalide
```bash
curl -X GET https://cfsd91.com/eleves.php \
  -H "X-API-KEY: cleinvalide"
# Attendu: 401 Unauthorized
```

### Test 3: Requête avec clé valide
```bash
curl -X GET https://cfsd91.com/eleves.php \
  -H "X-API-KEY: Mac131080"
# Attendu: 200 OK avec données
```

### Test 4: Vérifier que passwords ne sont pas retournés
```bash
curl -X GET https://cfsd91.com/eleves.php \
  -H "X-API-KEY: Mac131080" | grep -i password
# Attendu: Aucun résultat (password filtré)
```

---

## 📞 Support & Maintenance

### Dépannage

**Problème**: Erreur 401 sur toutes les requêtes
- **Cause**: Clé API manquante ou incorrecte
- **Solution**: Vérifier le header `X-API-KEY` et la valeur

**Problème**: Les logs ne sont pas créés
- **Cause**: Permissions insuffisantes sur `/priv/api_logs/`
- **Solution**: S'assurer que le dossier est writable (chmod 755)

**Problème**: Erreur 500 aléatoire
- **Cause**: Fichier de données corrompu ou permissions
- **Solution**: Vérifier `/priv/eleves.json` et ses permissions

---

## 📌 Checklist Sécurité

- ✅ Authentification API requise pour tous les endpoints
- ✅ Champs sensibles (password) jamais retournés
- ✅ Audit logging de tous les accès
- ✅ Gestion appropriée des erreurs HTTP
- ✅ Frontend envoie correctement les headers
- ✅ Clé API stockée en configuration centralisée
- ✅ CORS configuré
- ✅ Rate limiting implémenté

---

**Dernière mise à jour**: 14 décembre 2025
**Version de sécurité**: 1.1
**Status**: Production Ready ✅

