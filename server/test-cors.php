<?php
// test-cors.php - Fichier de test CORS minimal
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-KEY, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

echo json_encode([
    'status' => 'ok',
    'message' => 'CORS fonctionne!',
    'timestamp' => date('c'),
    'calendar_exists' => file_exists(__DIR__ . '/calendar.json'),
    'dir' => __DIR__
]);
