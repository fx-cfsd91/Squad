# 🚀 GUIDE DE DÉPLOIEMENT - API SÉCURISÉE

## ⚠️  IMPORTANT: Deux fichiers eleves.php

### Fichier ACTUEL (serveur en production)
```
/appli/php/eleves.php
```
- Status: GET est PUBLIC
- Problem: Les données sont accessibles sans authentification

### Fichier SÉCURISÉ (local, prêt à déployer)
```
server/eleves-SECURED.php
```
- Status: Authentification REQUISE pour GET, POST, PUT, DELETE
- Authentification: `X-API-KEY: Mac131080`

---

## 📋 Checklist de Déploiement

### Étape 1: Sauvegarder l'ancien fichier
```bash
# Sur le serveur FTP:
cp /appli/php/eleves.php /appli/php/eleves.php.backup
```

### Étape 2: Télécharger le nouveau fichier sécurisé
```bash
# Renommer: eleves-SECURED.php → eleves.php
# Uploader vers: /appli/php/eleves.php
```

### Étape 3: Tester la sécurité

**Test 1: Sans clé API (doit retourner 401)**
```bash
curl https://cfsd91.com/appli/php/eleves.php
# Attendu: {"error":"Unauthorized"...}
# Status: 401
```

**Test 2: Avec clé API (doit retourner 200)**
```bash
curl https://cfsd91.com/appli/php/eleves.php \
  -H "X-API-KEY: Mac131080"
# Attendu: [{"id":...},...]
# Status: 200
```

**Test 3: Vérifier que password est filtré**
```bash
curl https://cfsd91.com/appli/php/eleves.php \
  -H "X-API-KEY: Mac131080" | grep -i password
# Attendu: Aucun résultat
```

### Étape 4: Vérifier les logs
```bash
# Voir les accès API:
cat /priv/api_logs/access.log
```

Format des logs:
```
2025-12-14 15:30:45 | GET | Key: Mac***1080 | Status: 200 | IP: 192.168.1.100 | Fetched all students
2025-12-14 15:30:46 | GET | Key: NONE | Status: 401 | IP: 192.168.1.101 | Unauthorized - Invalid or missing API key
```

---

## 📱 Frontend - Rien à changer

Le frontend fonctionne déjà correctement grâce à:
- `constants/config.ts` qui contient la clé API
- `lib/api.ts` qui ajoute automatiquement le header X-API-KEY

Tous les composants (recapitulatif.tsx, Presence.tsx, adhesion.tsx) utilisent `fetchWithTimeout()` qui ajoute automatiquement:
```typescript
headers: {
  'X-API-KEY': 'Mac131080',
  'Content-Type': 'application/json'
}
```

---

## 🔍 Vérification Post-Déploiement

### Via cURL
```bash
# 1. Test sans clé (doit échouer)
curl -i https://cfsd91.com/appli/php/eleves.php

# 2. Test avec clé (doit réussir)
curl -i https://cfsd91.com/appli/php/eleves.php \
  -H "X-API-KEY: Mac131080"

# 3. Test POST avec clé
curl -i -X POST https://cfsd91.com/appli/php/eleves.php \
  -H "X-API-KEY: Mac131080" \
  -H "Content-Type: application/json" \
  -d '{"nom":"Test","prenom":"User"}'
```

### Via le Frontend
1. Ouvrir l'app React Native
2. Aller à l'onglet "Récapitulatif"
3. Vérifier que la liste des élèves charge correctement
4. Essayer d'ajouter un nouvel élève (adhesion.tsx)
5. Vérifier les logs: `/priv/api_logs/access.log`

---

## 🛑 Rollback (Retour en arrière)

Si quelque chose ne fonctionne pas:

```bash
# Sur le serveur FTP:
rm /appli/php/eleves.php
mv /appli/php/eleves.php.backup /appli/php/eleves.php
```

Ou restaurer depuis le backup Git:
```bash
git restore appli/php/eleves.php
```

---

## 🔑 Rotation de Clé (Futur)

Si besoin de changer la clé API `Mac131080`:

### 1. Dans le serveur (eleves.php):
```php
$ALLOWED_KEYS = [
    'Mac131080',      // Ancienne clé (temporaire)
    'nouveauMot2025', // Nouvelle clé
];
```

### 2. Dans le frontend (constants/config.ts):
```typescript
export const API_HEADERS = {
  'X-API-KEY': 'nouveauMot2025',
};
```

### 3. Déployer le frontend
```bash
npm run build
npx expo publish
# ou déployer sur Vercel
```

### 4. Retirer l'ancienne clé du serveur:
```php
$ALLOWED_KEYS = ['nouveauMot2025'];
```

---

## 📊 Différences avant/après

| Aspect | Avant | Après |
|--------|-------|-------|
| GET sans clé | ✅ Accepté | ❌ Rejeté (401) |
| GET avec clé | ✅ Accepté | ✅ Accepté (200) |
| POST sans clé | ❌ Rejeté | ❌ Rejeté (401) |
| POST avec clé | ✅ Accepté | ✅ Accepté (201) |
| Password exposé | ⚠️ Potentiellement | ✅ Toujours filtré |
| Audit logs | ❌ Non | ✅ Oui |

---

## ⚠️ Attention

1. **Ne pas exposer la clé API dans le code** (elle doit rester dans constants/config.ts)
2. **Vérifier que les passwords ne sont jamais loggés** 
3. **Tester avant de déployer en production**
4. **Garder une sauvegarde de l'ancien fichier**
5. **Monitorer les logs après déploiement**

---

## ✅ Checklist Final

- [ ] Fichier `eleves-SECURED.php` prêt à uploader
- [ ] Sauvegarde de `eleves.php.backup` créée
- [ ] Tests locaux effectués (sans clé = 401, avec clé = 200)
- [ ] Logs configurés et testés
- [ ] Frontend testé et fonctionnel
- [ ] Documentation mise à jour
- [ ] Plan de rollback en place

---

**Prêt pour le déploiement?** 🚀

Contactez l'administrateur serveur pour:
1. Remplacer `/appli/php/eleves.php` par `server/eleves-SECURED.php`
2. Tester les endpoints (cf. section "Via cURL")
3. Vérifier les logs créés dans `/priv/api_logs/`

---

**Dernière mise à jour**: 14 décembre 2025
**Version**: 1.1 (Sécurisée)
**Status**: Prêt pour production ✅
