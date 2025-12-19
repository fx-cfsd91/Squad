<?php
/**
 * API Authentication & Configuration - Fichier centralisé
 * Inclure ce fichier dans tous les endpoints API
 * 
 * require_once __DIR__ . '/api-auth.php';
 */

// ============================================
// 📋 CONFIGURATION GLOBALE
// ============================================
// 🔒 CLÉS API - À STOCKER DANS LES VARIABLES D'ENVIRONNEMENT EN PRODUCTION
// Pour générer une nouvelle clé en production, utilisez:
// php -r "echo hash('sha256', bin2hex(random_bytes(32)));"
define('API_ALLOWED_KEYS', getenv('API_KEY') ? explode(',', getenv('API_KEY')) : [
    // Production: remplacer par une clé SHA256 sécurisée générée aléatoirement
    // Development: clé temporaire pour les tests
    'a7f8d9e2b3c4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5a6b7c8d9e'
]);
define('API_LOG_DIR', dirname(__DIR__, 2) . '/priv/api_logs');

// ============================================
// 🔐 AUTHENTIFICATION
// ============================================

/**
 * Extraire la clé API depuis les headers
 * @return string La clé API ou chaîne vide si non trouvée
 */
function getApiKey() {
    $apiKey = '';
    
    // Méthode 1: getallheaders() (Apache + modern PHP)
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        $apiKey = $headers['X-API-KEY'] ?? $headers['x-api-key'] ?? '';
    }
    
    // Méthode 2: $_SERVER (Nginx)
    if (empty($apiKey)) {
        $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
    }
    
    // Méthode 3: apache_request_headers() (fallback)
    if (empty($apiKey) && function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        $apiKey = $headers['X-API-KEY'] ?? $headers['x-api-key'] ?? '';
    }
    
    return trim($apiKey);
}

/**
 * Logger les accès API
 * @param string $method Méthode HTTP
 * @param string $apiKey Clé API utilisée
 * @param int $status Code HTTP
 * @param string $details Détails additionnels
 */
function logApiAccess($method, $apiKey, $status, $details = '') {
    @mkdir(API_LOG_DIR, 0755, true);
    
    $logFile = API_LOG_DIR . '/access.log';
    $keyMask = !empty($apiKey) ? substr($apiKey, 0, 3) . '***' . substr($apiKey, -3) : 'NONE';
    $logEntry = date('Y-m-d H:i:s') . " | $method | Key: $keyMask | Status: $status | IP: {$_SERVER['REMOTE_ADDR']} | $details\n";
    
    @file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}

/**
 * Vérifier la validité de la clé API
 * Retourne automatiquement 401 si la clé est invalide
 * @return string La clé API validée
 */
function validateApiKey() {
    $apiKey = getApiKey();
    
    if (!in_array($apiKey, API_ALLOWED_KEYS)) {
        http_response_code(401);
        logApiAccess($_SERVER['REQUEST_METHOD'], $apiKey, 401, 'Unauthorized');
        echo json_encode(['error' => 'Unauthorized', 'message' => 'Invalid or missing API key']);
        exit;
    }
    
    return $apiKey;
}

// ============================================
// 🌐 CORS HEADERS
// ============================================

/**
 * Configurer les headers CORS
 */
function setupCors() {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-API-KEY, Authorization');
    header('Access-Control-Max-Age: 86400');
}

/**
 * Gestion des requêtes OPTIONS (CORS preflight)
 */
function handleOptionsRequest() {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        setupCors();
        exit;
    }
}

// ============================================
// 🚀 INITIALISATION AUTO
// ============================================

// Configuration globale
header('Content-Type: application/json');
setupCors();
handleOptionsRequest();

// Log automatiquement et valide la clé
$CURRENT_API_KEY = validateApiKey();
