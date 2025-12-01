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
if ($apiKey !== 'KEYOFSQUAD01@') {
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
    http_response_code(404);
    echo json_encode(['ok'=>false,'error'=>'Fichier élèves absent']);
    exit;
}
$data = @file_get_contents($path);
$list = json_decode($data, true);
if (!is_array($list)) $list = [];

function normalize($str) {
    $str = preg_replace('/[\x{0300}-\x{036f}]/u', '', normalizer_normalize($str, Normalizer::FORM_D));
    return strtolower(str_replace(' ', '', $str));
}

foreach ($list as $eleve) {
    if (normalize($eleve['nom'] ?? '') === normalize($in['nom']) &&
        normalize($eleve['prenom'] ?? '') === normalize($in['prenom']) &&
        isset($eleve['password']) && password_verify($in['password'], $eleve['password'])) {
        echo json_encode(['ok'=>true,'eleve'=>$eleve], JSON_UNESCAPED_UNICODE);
        exit;
    }
}
echo json_encode(['ok'=>false,'error'=>'Identifiants invalides']);
exit;
