<?php
// identification.php : vérifie le mot de passe haché
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-KEY');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
if ($apiKey !== 'a7f8d9e2b3c4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5a6b7c8d9e') {
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

// identification.php est dans /appli/php/ donc 2 niveaux plus profond que la racine
// eleves.php à la racine utilise dirname(__DIR__, 2) → ici il faut dirname(__DIR__, 4)
$path = dirname(__DIR__, 4) . '/priv/eleves.json';
if (!is_file($path)) {
    http_response_code(404);
    echo json_encode(['ok'=>false,'error'=>'Fichier élèves absent','debug_path'=>$path]);
    exit;
}
$data = @file_get_contents($path);
$list = json_decode($data, true);
if (!is_array($list)) $list = [];

function normalize($str) {
    $str = trim($str);
    // Suppression manuelle des accents (sans extension intl)
    $from = ['à','á','â','ã','ä','å','è','é','ê','ë','ì','í','î','ï','ò','ó','ô','õ','ö','ù','ú','û','ü','ý','ÿ','ñ','ç',
             'À','Á','Â','Ã','Ä','Å','È','É','Ê','Ë','Ì','Í','Î','Ï','Ò','Ó','Ô','Õ','Ö','Ù','Ú','Û','Ü','Ý','Ñ','Ç'];
    $to   = ['a','a','a','a','a','a','e','e','e','e','i','i','i','i','o','o','o','o','o','u','u','u','u','y','y','n','c',
             'A','A','A','A','A','A','E','E','E','E','I','I','I','I','O','O','O','O','O','U','U','U','U','Y','N','C'];
    $str = str_replace($from, $to, $str);
    return strtolower(str_replace(' ', '', $str));
}

function checkPassword($input, $stored) {
    // Si le mot de passe stocké est un hash bcrypt
    if (strlen($stored) >= 60 && strpos($stored, '$2') === 0) {
        return password_verify($input, $stored);
    }
    // Sinon comparaison texte brut (ancien système)
    return $input === $stored;
}

foreach ($list as $index => $eleve) {
    if (normalize($eleve['nom'] ?? '') === normalize($in['nom']) &&
        normalize($eleve['prenom'] ?? '') === normalize($in['prenom'])) {

        // Élève trouvé - vérifier le mot de passe
        if (!isset($eleve['password']) || $eleve['password'] === '') {
            echo json_encode(['ok'=>false,'error'=>'Aucun mot de passe défini pour ce compte. Utilisez "Réinitialiser le mot de passe".']);
            exit;
        }

        if (!checkPassword($in['password'], $eleve['password'])) {
            echo json_encode(['ok'=>false,'error'=>'Mot de passe incorrect.']);
            exit;
        }

        // Mot de passe correct - hasher s'il était en texte brut
        if (strlen($eleve['password']) < 60 || strpos($eleve['password'], '$2') !== 0) {
            $list[$index]['password'] = password_hash($in['password'], PASSWORD_DEFAULT);
            file_put_contents($path, json_encode($list, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
        }

        $safe = $eleve;
        unset($safe['password']);
        echo json_encode(['ok'=>true,'eleve'=>$safe], JSON_UNESCAPED_UNICODE);
        exit;
    }
}
echo json_encode(['ok'=>false,'error'=>'Identifiants invalides']);
exit;
