<?php
// ============================================
// 🔐 ENDPOINT D'AUTHENTIFICATION
// ============================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-KEY');

// Gestion des requêtes OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-API-KEY');
    header('Access-Control-Max-Age: 86400');
    exit;
}

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

// Vérifier le mot de passe
if (!isset($eleve['password']) || $eleve['password'] !== $password) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Mot de passe incorrect']);
    exit;
}

// Authentification réussie - retourner les données (sans le mot de passe)
unset($eleve['password']);
http_response_code(200);
echo json_encode(['success' => true, 'eleve' => $eleve]);
