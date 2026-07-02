# 🔒 Rapport d'audit de sécurité — CFSD91 WebApp (V3.0)

**Cible :** https://cfsd91.vercel.app/tabs + backend PHP `cfsd91.com`
**Stack :** Expo / React Native (expo-router) exporté en web sur Vercel + serverless proxies (`api/`) + backend PHP mutualisé (`server/`), données dans des fichiers JSON (`/priv/eleves.json`).
**Date :** 2 juillet 2026
**Destinataire :** Claude Code (VSCode) — ce document est un plan d'action directement exploitable.

> ⚠️ **À lire d'abord.** Le modèle de sécurité repose entièrement sur une clé API `X-API-KEY` censée être secrète. Or cette clé est **compilée en clair dans le bundle web public** (vérifié : 3 occurrences dans `dist/_expo/static/js/web/entry-*.js`). N'importe quel visiteur peut l'extraire en 30 secondes. **En pratique, tous les endpoints « protégés » sont donc publics et non authentifiés.** C'est la racine de la majorité des failles ci-dessous.

---

## Tableau de synthèse

| # | Sévérité | Faille | Fichier(s) |
|---|----------|--------|-----------|
| 1 | 🔴 Critique | Clé API en dur, embarquée dans le bundle client | `constants/config.ts:37`, `dist/`, `api/login.js`, `api/delete-account.js`, `server/identification.php`, `server/eleves-append.php` |
| 2 | 🔴 Critique | Contrôle d'accès cassé sur `eleves.php` (CRUD complet ouvert) | `server/eleves.php` |
| 3 | 🔴 Critique | Suppression de compte sans vérification de mot de passe | `api/delete-account.js`, `server/eleves.php` (DELETE) |
| 4 | 🔴 Critique | Mots de passe stockés en clair | `server/reset-password.php`, `server/eleves.php`, `server/login.php`, `server/identification.php` |
| 5 | 🟠 Élevé | Accès admin contrôlé uniquement côté client (PIN `3107` en dur) | `app/tabs/index.tsx:56,289` |
| 6 | 🟠 Élevé | Dépendances vulnérables (30 vulns, 1 critique / 8 élevées) | `package.json` (`xlsx`, `yaml`, …) |
| 7 | 🟠 Élevé | Lecture/écriture non authentifiée de `calendar.json` | `server/read.php`, `server/save.php` |
| 8 | 🟠 Élevé | Secret présent dans l'historique Git | historique `git` |
| 9 | 🟡 Moyen | CORS `*` sur tous les endpoints, y compris l'authentification | tous les `.php`, `.htaccess` |
| 10 | 🟡 Moyen | Fuite d'informations (chemins serveur, erreurs PHP, fichier cassé) | `server/eleves.php`, `server/identification.php`, `server/eleves-append.php` |
| 11 | 🟡 Moyen | Aucune protection anti-bruteforce sur le login | `server/login.php`, `server/identification.php` |
| 12 | 🟡 Moyen | Toute la base élèves (PII) téléchargée sur chaque client | `lib/api.ts` `fetchEleves`, `app/tabs/identification.tsx` |
| 13 | 🟡 Moyen | WebView `originWhitelist=['*']` + JS activé | `app/form.tsx` |
| 14 | 🟢 Faible | La clé API est loggée dans la console navigateur | `lib/api.ts:24` |
| 15 | 🟢 Faible | Fichiers de test/debug laissés en prod, logique d'auth dupliquée | `server/test-cors.php`, `server/login.php` vs `identification.php` |

---

## 🔴 Failles critiques

### 1. Clé API en dur et embarquée dans le bundle client
**Fichiers :** `constants/config.ts:37`, présent aussi dans `api/login.js`, `api/delete-account.js`, `server/identification.php`, `server/eleves-append.php`.

```ts
// constants/config.ts
export const API_HEADERS = {
  'Content-Type': 'application/json',
  'X-API-KEY': 'a7f8d9e2b3c4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5a6b7c8d9e',
};
```

`constants/config.ts` est importé par le code React Native → la clé finit **compilée dans le JavaScript public**. Confirmé : `grep` retrouve la clé dans `dist/_expo/static/js/web/entry-268b8d03c0c93cfae69fb418da37a595.js`. Elle est aussi visible dans le proxy `api/login.js` (côté serveur, moins grave) mais **surtout dans `lib/api.ts`** qui appelle directement `cfsd91.com/*.php` depuis le navigateur avec ce header.

**Conséquence :** la clé n'est **pas un secret**. Tout endpoint qui ne vérifie que `X-API-KEY` est de facto ouvert au public.

**Correctif :**
- Ne **jamais** mettre de secret dans `constants/config.ts` ni dans une variable `EXPO_PUBLIC_*` (elles sont inlinées dans le bundle).
- Router **tous** les appels sensibles (élèves, présence, événements, cours, suppression) via des **fonctions serverless Vercel** (`api/*.js`) qui détiennent la clé côté serveur (variable d'env Vercel, non `EXPO_PUBLIC_`). Le client ne parle qu'à `/api/*`, jamais directement à `cfsd91.com`.
- **Révoquer** la clé actuelle et en générer une nouvelle : `php -r "echo hash('sha256', random_bytes(32));"`, stockée uniquement dans la variable d'env `API_KEY` du serveur PHP et dans Vercel.
- Retirer `X-API-KEY` de `API_HEADERS`.

---

### 2. Contrôle d'accès cassé sur `eleves.php` — CRUD complet ouvert au public
**Fichier :** `server/eleves.php` (toutes méthodes).

L'unique garde est `validateApiKey()` (clé publique → cf. #1). Résultat, n'importe qui peut :
- `GET` → lister toute la base élèves (noms, date de naissance, adresse, téléphones, email, photos — le mot de passe est filtré, mais **toutes les autres PII sont exposées**).
- `POST` → créer des élèves arbitraires ; `POST {action:'delete'}` → supprimer.
- `PUT` → **modifier n'importe quel élève par `id`, y compris son `password`** → **prise de contrôle de compte** (`updatableFields` inclut `'password'`).
- `DELETE` → supprimer n'importe quel élève par `id`.

Aucune notion d'utilisateur authentifié, aucune vérification que l'appelant a le droit d'agir sur **cet** `id`. C'est une **Broken Access Control / IDOR** à l'échelle de toute la base.

**Correctif :**
- Introduire une vraie **session authentifiée** (token opaque signé, ex. JWT côté serveur ou token de session stocké dans `/priv`), délivrée au login.
- Chaque mutation doit vérifier : (a) session valide, (b) l'utilisateur agit sur son propre `id`, **ou** (c) rôle admin vérifié **côté serveur**.
- Séparer les endpoints publics (lecture agrégée non nominative) des endpoints admin.
- Ne jamais accepter le champ `password` dans un `PUT` de profil : passer par un flux dédié « changer mot de passe » qui exige l'ancien mot de passe.

---

### 3. Suppression de compte sans vérification du mot de passe
**Fichiers :** `app/tabs/identification.tsx:60-70` → `api/delete-account.js` → `server/eleves.php` (DELETE).

Le client envoie `{ id, password }`, mais le proxy `api/delete-account.js` transmet à `eleves.php DELETE`, qui **supprime uniquement par `id` et ignore totalement le mot de passe**. Comme les `id` sont exposés par le `GET` (#2), **n'importe qui peut supprimer le compte de n'importe quel membre**.

**Correctif :** vérifier le mot de passe (ou la session propriétaire) **côté serveur** avant toute suppression. Rejeter si le mot de passe ne correspond pas au compte ciblé.

---

### 4. Mots de passe stockés en clair
**Fichiers :** `server/reset-password.php`, `server/eleves.php`, `server/login.php`, `server/identification.php`.

- `reset-password.php` écrit le nouveau mot de passe **sans hachage** : `$e['password'] = $newPassword;`
- `eleves.php` (POST/PUT) enregistre le `password` reçu du client **tel quel**.
- `login.php` / `identification.php` acceptent une **comparaison en clair** en repli : `$storedPwd === $password`.

Donc `/priv/eleves.json` contient (au moins en partie) des mots de passe en clair. En cas de fuite du fichier, tous les comptes sont compromis (et les membres réutilisent souvent le même mot de passe ailleurs).

**Correctif :**
- Hacher **systématiquement** à l'écriture : `password_hash($pwd, PASSWORD_DEFAULT)` (dans `reset-password.php`, `eleves.php` POST/PUT, `eleves-append.php`).
- Supprimer toute branche de comparaison en clair : ne garder que `password_verify()`.
- Migration : script one-shot qui re-hache les entrées encore en clair, puis force un reset pour les comptes concernés.

---

## 🟠 Failles élevées

### 5. Accès admin uniquement côté client (PIN en dur `3107`)
**Fichier :** `app/tabs/index.tsx:56,289`.

```ts
const ADMIN_PIN = process.env.EXPO_PUBLIC_ADMIN_PIN ?? '3107';
// ...
if (ADMIN_PIN.length > 0 && pin.trim() === ADMIN_PIN) { setAdmin(true); ... }
```

Deux problèmes : (a) un **PIN de repli `3107` en dur** dans le source ; (b) `EXPO_PUBLIC_ADMIN_PIN` est de toute façon **inliné dans le bundle**. Le passage en mode admin est purement local (`AsyncStorage`), et surtout **les actions admin frappent les mêmes endpoints PHP avec la clé publique** : l'autorisation admin n'existe **pas** côté serveur.

**Correctif :** l'admin doit être un vrai rôle authentifié côté serveur (login admin dédié → session avec rôle). Le PIN client ne doit rien débloquer que le serveur ne revalide. Supprimer le fallback `3107`.

---

### 6. Dépendances vulnérables
**Fichier :** `package.json`. `npm audit` : **30 vulnérabilités (1 critique, 8 élevées, 20 modérées, 1 faible)**.
- `xlsx@0.18.5` : Prototype Pollution + ReDoS, **aucun correctif via npm** (GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9). Migrer vers la distribution officielle SheetJS CDN (`https://cdn.sheetjs.com`) ou remplacer par `exceljs`.
- `yaml` : corrigeable via `npm audit fix`.

**Correctif :** `npm audit fix`, remplacer/mettre à jour `xlsx`, re-auditer. Traiter en priorité la vuln critique restante (voir sortie complète de `npm audit`).

---

### 7. Lecture/écriture non authentifiée de `calendar.json`
**Fichiers :** `server/read.php`, `server/save.php`.

`read.php` n'a **aucune authentification** (lecture publique). `save.php` écrit un JSON arbitraire dans `calendar.json` mais n'est gardé que par la clé publique (#1) → **tout le monde peut réécrire le calendrier** (altération de données / défiguration).

**Correctif :** exiger une session admin pour `save.php`. Valider/normaliser le JSON reçu (schéma attendu) avant écriture.

---

### 8. Secret présent dans l'historique Git
Le fichier `.env.local` n'est **pas** suivi par Git (✅ correctement ignoré). En revanche, la clé API `a7f8…` est **committée** dans plusieurs fichiers suivis (`constants/config.ts`, `api/login.js`, `server/identification.php`, `server/eleves-append.php`). La révoquer ne suffit pas : elle reste dans l'historique.

**Correctif :** révoquer la clé (obligatoire), puis purger l'historique (`git filter-repo` ou BFG) si le dépôt est/sera partagé. Vérifier qu'aucune autre valeur sensible n'a été committée.

---

## 🟡 Failles moyennes

### 9. CORS `*` généralisé, y compris sur l'authentification
`Access-Control-Allow-Origin: *` sur tous les `.php` et dans `.htaccess`. Couplé à la clé publique, aucune origine n'est restreinte.
**Correctif :** restreindre `Allow-Origin` aux origines légitimes (`https://cfsd91.vercel.app`, domaine prod). Une fois les appels passés par `api/*` Vercel, le PHP peut n'accepter que l'origine serveur.

### 10. Fuite d'informations
- `eleves.php` renvoie des **chemins serveur absolus** dans les messages d'erreur (`'path' => $elevesFile`).
- `identification.php` renvoie `debug_path`.
- `eleves-append.php` active `display_errors=1` / `error_reporting(E_ALL)` → traces PHP exposées ; **le fichier contient en plus deux scripts PHP concaténés dont le second a une erreur de syntaxe fatale** (`'password' => password_hash(...)` suivi de `'password' => $in['password']` sans virgule). À nettoyer/supprimer.
**Correctif :** `display_errors=0` en prod, messages d'erreur génériques, retirer les champs de debug, supprimer le code mort/cassé.

### 11. Pas de protection anti-bruteforce
`login.php` / `identification.php` n'ont ni rate-limiting ni verrouillage. La comparaison en clair sur repli n'est pas à temps constant.
**Correctif :** limiter les tentatives par IP/compte (backoff, blocage temporaire), journaliser les échecs, `password_verify` uniquement.

### 12. Toute la base élèves téléchargée sur chaque client
`fetchEleves()` (`lib/api.ts`) récupère **toute** la liste, et `identification.tsx` fait le matching login/suppression **côté client**. Chaque appareil reçoit ainsi les PII de tous les membres.
**Correctif :** faire l'authentification et le matching **côté serveur** ; ne renvoyer au client que les données du membre connecté.

### 13. WebView permissive
`app/form.tsx` : `originWhitelist={['*']}` + `javaScriptEnabled` + `domStorageEnabled` chargeant `cfsd91.com/utilisateur.html`.
**Correctif :** restreindre `originWhitelist` au domaine attendu ; désactiver le JS si non nécessaire.

---

## 🟢 Faible / hygiène

- **14 — `lib/api.ts:24`** : `console.log('🔑 API_HEADERS sent:', finalHeaders)` logge la clé dans la console navigateur. Supprimer tous les `console.log` de headers/données sensibles en prod.
- **15** : `server/test-cors.php` (fichier de test) à retirer de la prod ; logique d'auth **dupliquée et incohérente** entre `login.php` (via `api-auth.php`) et `identification.php` (clé en dur). Unifier sur un seul module d'auth.
- Vérifier que le dossier `/priv` (contenant `eleves.json`, `reset-tokens.json`) est **hors racine web** et non servi (il l'est via `dirname(__DIR__, 2).'/priv'` — à confirmer sur l'hébergement).

---

## Plan d'action priorisé (pour Claude Code)

**Phase 1 — Stopper l'hémorragie (aujourd'hui)**
1. Révoquer la clé API `a7f8…` et en générer une nouvelle (env serveur uniquement).
2. Retirer la clé de `constants/config.ts` / `API_HEADERS` ; supprimer le `console.log` (#14) et le fallback PIN `3107` (#5).
3. Corriger `eleves.php DELETE` et `delete-account` pour **vérifier le mot de passe/propriétaire** (#3).
4. Bloquer le champ `password` dans `eleves.php PUT` et exiger l'ancien mot de passe pour un changement (#2, #4).

**Phase 2 — Réarchitecturer l'accès (cette semaine)**
5. Déplacer tous les appels sensibles derrière des serverless `api/*` Vercel détenant la clé (#1).
6. Mettre en place une **session authentifiée** + rôle admin vérifié serveur (#2, #5, #7).
7. Hacher tous les mots de passe, supprimer les comparaisons en clair, migrer l'existant (#4).

**Phase 3 — Durcissement**
8. Restreindre CORS (#9), rate-limiting login (#11), erreurs génériques + `display_errors=0` (#10).
9. `npm audit fix` + remplacer `xlsx` (#6).
10. Purger le secret de l'historique Git (#8), supprimer `test-cors.php` et le code mort (#15).

---

## Vérification recommandée après correctifs
- `grep -r "a7f8d9e2b3c4f5g6" .` → **0 occurrence** (source + `dist/`).
- Rejouer `npm audit` → 0 critique/élevée.
- Test manuel : appeler `eleves.php` (GET/PUT/DELETE) **sans session valide** → doit répondre `401/403`.
- Confirmer que `eleves.json` ne contient plus **aucun** mot de passe en clair.
- Confirmer que le PIN admin ne débloque plus aucune action côté serveur sans rôle admin authentifié.

*Note méthodologique : audit réalisé en boîte blanche (code source + bundle `dist/`). Aucun test intrusif n'a été effectué contre les données de production ; les impacts « n'importe qui peut… » sont déduits de la lecture du code et de la présence confirmée de la clé dans le bundle public.*
