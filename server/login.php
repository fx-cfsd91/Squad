<?php
// ============================================
// 🔐 ENDPOINT D'AUTHENTIFICATION
// ============================================

// Importer l'authentification centralisée
require_once dirname(dirname(__DIR__)) . '/priv/api-auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

// Lire le fichier des élèves avec les mots de passe
$elevesFile = dirname(__DIR__, 2) . '/priv/eleves.json';

if (!file_exists($elevesFile)) {
    http_response_code(500);
    echo json_encode(['error' => 'Élèves file not found']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['nom']) || !isset($input['prenom']) || !isset($input['password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields: nom, prenom, password']);
    exit;
}

// Charger les élèves
$elevesContent = file_get_contents($elevesFile);
$elevesData = json_decode($elevesContent, true);
$eleves = is_array($elevesData) ? $elevesData : [];

// Normaliser les strings pour la comparaison
function normalizeString($str) {
    return strtolower(trim(preg_replace('/\s+/', ' ', $str)));
}

// Chercher l'élève
$nom = normalizeString($input['nom']);
$prenom = normalizeString($input['prenom']);
$password = $input['password'];

$eleve = null;
foreach ($eleves as $e) {
    if (normalizeString($e['nom']) === $nom && normalizeString($e['prenom']) === $prenom) {
        $eleve = $e;
        break;
    }
}

if (!$eleve) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Nom ou prénom non reconnu']);
    exit;
}

// Vérifier le mot de passe (supporte les hash bcrypt ET le texte clair)
if (!isset($eleve['password'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Aucun mot de passe défini pour ce compte']);
    exit;
}
$storedPwd = $eleve['password'];
$isHashed = strlen($storedPwd) >= 60 && str_starts_with($storedPwd, '$2');
if ($isHashed) {
    $passwordOk = password_verify($password, $storedPwd);
} else {
    // Mot de passe en clair (legacy) — on vérifie puis on migre vers bcrypt
    $passwordOk = ($storedPwd === $password);
    if ($passwordOk) {
        $elevesData = json_decode(file_get_contents($elevesFile), true);
        foreach ($elevesData as &$row) {
            if (($row['id'] ?? '') === $eleve['id']) {
                $row['password'] = password_hash($password, PASSWORD_DEFAULT);
                break;
            }
        }
        unset($row);
        @file_put_contents($elevesFile, json_encode($elevesData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
    }
}

if (!$passwordOk) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Mot de passe incorrect']);
    exit;
}

// Authentification réussie - retourner les données (sans le mot de passe)
unset($eleve['password']);
http_response_code(200);
echo json_encode(['success' => true, 'eleve' => $eleve]);
