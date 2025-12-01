<?php
// server/read.php
// IMPORTANT: Les en-têtes CORS doivent être envoyés EN PREMIER
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-KEY, Authorization');
header('Content-Type: application/json');

// Gérer les requêtes preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Lit le fichier calendar.json dans le même dossier
$path = __DIR__ . '/calendar.json';
if (file_exists($path)) {
    echo file_get_contents($path);
} else {
    // Renvoie un tableau vide par défaut si le fichier n'existe pas
    echo json_encode([]);
}

