<?php
// server/save.php
// Endpoint pour sauvegarder un JSON avec authentification centralisée

require_once dirname(dirname(__DIR__)) . '/priv/api-auth.php';

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
