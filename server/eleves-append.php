<?php
// Version append : ajoute un élève au lieu d'écraser

declare(strict_types=1);
ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-KEY, cache-control');
header('Cache-Control: no-store, no-cache, must-revalidate, private');
header('X-Content-Type-Options: nosniff');

$path = dirname(__DIR__, 2) . '/priv/eleves.json';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!is_file($path)) {
        echo "[]";
        exit;
    }
    $data = @file_get_contents($path);
    if ($data === false) {
        http_response_code(500);
        echo json_encode(['ok'=>false,'error'=>'Erreur lecture fichier']);
        exit;
    }
    echo $data;
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
    if ($apiKey !== 'Mac131080') {
        http_response_code(403);
        echo json_encode(['ok'=>false,'error'=>'Clé API invalide']);
        exit;
    }

    $in = json_decode(file_get_contents('php://input'), true);
    if (!is_array($in) || !isset($in['data']) || !is_array($in['data'])) {
        http_response_code(400);
        echo json_encode(['ok'=>false,'error'=>'Payload invalide: { "data": [...] } attendu']);
        exit;
    }

    // Ajoute le nouvel élève à la liste existante
    $list = [];
    if (is_file($path)) {
        $current = @file_get_contents($path);
        if ($current !== false) {
            $list = json_decode($current, true);
            if (!is_array($list)) $list = [];
        }
    }
    function uuidv4() {
        // Génère un UUID v4 simple
        return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
    foreach ($in['data'] as $eleve) {
        if (!isset($eleve['id']) || !$eleve['id']) {
            $eleve['id'] = uuidv4();
        }
        if (isset($eleve['password']) && $eleve['password']) {
            $eleve['password'] = password_hash($eleve['password'], PASSWORD_DEFAULT);
        }
        $list[] = $eleve;
    }
    $json = json_encode($list, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    if ($json === false) {
        http_response_code(500);
        echo json_encode(['ok'=>false,'error'=>'Échec encodage JSON']);
        exit;
    }
    $json .= "\n";
    $tmp = $path . '.tmp';
    if (@file_put_contents($tmp, $json, LOCK_EX) === false) {
        http_response_code(500);
        echo json_encode(['ok'=>false,'error'=>'Écriture échouée (tmp)']);
        exit;
    }
    if (!@rename($tmp, $path)) {
        @unlink($tmp);
        http_response_code(500);
        echo json_encode(['ok'=>false,'error'=>'Remplacement échoué']);
        exit;
    }
    @chmod($path, 0600);

    echo json_encode(['ok'=>true,'count'=>count($list)], JSON_UNESCAPED_UNICODE);
    exit;
}

http_response_code(405);
echo json_encode(['ok'=>false,'error'=>'Méthode non supportée']);

<?php
// eleves-append.php : ajoute un élève avec mot de passe haché dans /priv/eleves.json
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-KEY');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
if ($apiKey !== 'Mac131080') {
    http_response_code(403);
    echo json_encode(['ok'=>false,'error'=>'Clé API invalide']);
    exit;
}

$in = json_decode(file_get_contents('php://input'), true);
if (!is_array($in) || !isset($in['nom'], $in['prenom'], $in['password'])) {
    http_response_code(400);
    echo json_encode(['ok'=>false,'error'=>'Champs manquants']);
    exit;
}

$path = dirname(__DIR__, 2) . '/priv/eleves.json';
if (!is_file($path)) {
    file_put_contents($path, '[]');
}
$data = @file_get_contents($path);
$list = json_decode($data, true);
if (!is_array($list)) $list = [];

function normalize($str) {
    $str = preg_replace('/[\x{0300}-\x{036f}]/u', '', normalizer_normalize($str, Normalizer::FORM_D));
    return strtolower(str_replace(' ', '', $str));
}

// Vérifie si l'élève existe déjà
foreach ($list as $eleve) {
    if (normalize($eleve['nom'] ?? '') === normalize($in['nom']) &&
        normalize($eleve['prenom'] ?? '') === normalize($in['prenom'])) {
        http_response_code(409);
        echo json_encode(['ok'=>false,'error'=>'Élève déjà existant']);
        exit;
    }
}

// Génère un UUID v4
function uuidv4() {
    $data = random_bytes(16);
    $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
    $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

$eleve = [
    'id' => uuidv4(),
    'nom' => $in['nom'],
    'prenom' => $in['prenom'],
    'naissance' => $in['naissance'] ?? '',
    'jour' => $in['jour'] ?? '',
    'discipline' => $in['discipline'] ?? '',
    'combattant' => $in['combattant'] ?? false,
    'etudiant' => $in['etudiant'] ?? false,
    'renouvellement' => $in['renouvellement'] ?? false,
    'telUrgence' => $in['telUrgence'] ?? '',
    'telEleve' => $in['telEleve'] ?? '',
    'email' => $in['email'] ?? '',
    'adresse' => $in['adresse'] ?? '',
    'poids' => $in['poids'] ?? '',
    'licence' => $in['licence'] ?? '',
    'ceinture' => $in['ceinture'] ?? '',
    'photo' => $in['photo'] ?? '',
    'createdAt' => date('c'),
    'password' => password_hash($in['password'], PASSWORD_DEFAULT)
];

$list[] = $eleve;
file_put_contents($path, json_encode($list, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
echo json_encode(['ok'=>true,'id'=>$eleve['id']]);
?>
