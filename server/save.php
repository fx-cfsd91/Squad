<?php
// server/save.php
// Endpoint simple pour sauvegarder un JSON (vérifier X-API-KEY)
// IMPORTANT: remplace la clé par une vraie valeur et stocke-la hors du repo
$SECRET = getenv('SAVE_API_KEY') ?: 'REMPLACE_PAR_TA_CLE_SECRETE';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-KEY, Authorization');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$headers = getallheaders();
$provided = isset($headers['X-API-KEY']) ? $headers['X-API-KEY'] : (isset($headers['x-api-key']) ? $headers['x-api-key'] : null);
if (!$provided || $provided !== $SECRET) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$body = file_get_contents('php://input');
if (!$body) {
    http_response_code(400);
    echo json_encode(['error' => 'Empty body']);
    exit;
}

$data = json_decode($body, true);
if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

// Sauvegarder calendar.json à la RACINE publique (un niveau au-dessus de /priv/)
$file = dirname(__DIR__) . '/calendar.json';
$tmp = $file . '.tmp';
if (file_put_contents($tmp, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Write failed']);
    exit;
}

rename($tmp, $file);

echo json_encode(['ok' => true, 'saved_at' => date('c')]);
