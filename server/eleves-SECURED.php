<?php
/**
 * 🔒 SÉCURISÉ - API Élèves avec Authentification Obligatoire
 * Tous les endpoints (GET, POST, PUT, DELETE) requièrent la clé API
 */

ini_set('memory_limit', '512M');
ini_set('max_execution_time', '60');
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH');
header('Access-Control-Allow-Headers: Content-Type, X-API-KEY');

$elevesFile = dirname(__DIR__, 2) . '/priv/eleves.json';
$logsDir = dirname(__DIR__, 2) . '/priv/api_logs';

// ⚠️  CLÉ API - À STOCKER DANS LES VARIABLES D'ENVIRONNEMENT EN PRODUCTION
$ALLOWED_KEYS = ['Mac131080'];

// Créer le dossier de logs
@mkdir($logsDir, 0755, true);

/**
 * Log les accès API pour audit
 */
function logApiAccess($method, $apiKey, $status, $details = '') {
    global $logsDir;
    $logFile = $logsDir . '/access.log';
    $keyMask = !empty($apiKey) ? substr($apiKey, 0, 3) . '***' . substr($apiKey, -3) : 'NONE';
    $logEntry = date('Y-m-d H:i:s') . " | $method | Key: $keyMask | Status: $status | IP: {$_SERVER['REMOTE_ADDR']} | $details\n";
    @file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}

/**
 * Extrait la clé API depuis le header X-API-KEY
 */
function getApiKey() {
    $apiKey = '';
    
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        $apiKey = $headers['X-API-KEY'] ?? $headers['x-api-key'] ?? '';
    }
    
    if (empty($apiKey)) {
        $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
    }
    
    if (empty($apiKey) && function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        $apiKey = $headers['X-API-KEY'] ?? $headers['x-api-key'] ?? '';
    }
    
    return $apiKey;
}

// CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$apiKey = getApiKey();

// ✅ VÉRIFICATION OBLIGATOIRE DE LA CLÉ API POUR TOUS LES ENDPOINTS
if (!in_array($apiKey, $ALLOWED_KEYS)) {
    http_response_code(401);
    logApiAccess($method, $apiKey, 401, 'Unauthorized - Invalid or missing API key');
    echo json_encode(['error' => 'Unauthorized', 'message' => 'Invalid or missing API key']);
    exit;
}

// Fonctions helper
function readEleves($file) {
    if (!file_exists($file)) return [];
    $content = @file_get_contents($file);
    return json_decode($content, true) ?: [];
}

function saveEleves($file, $data) {
    $tempFile = $file . '.tmp';
    if (@file_put_contents($tempFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX) === false) {
        throw new Exception('Failed to write data');
    }
    if (!@rename($tempFile, $file)) {
        @unlink($tempFile);
        throw new Exception('Failed to save data');
    }
    @chmod($file, 0666);
}

// Routage selon la méthode HTTP
try {
    switch ($method) {
        case 'GET':
            // ✅ SÉCURISÉ - Récupérer tous les élèves (authentification requise)
            logApiAccess($method, $apiKey, 200, 'Fetched all students');
            
            $data = readEleves($elevesFile);
            
            // IMPORTANT: Filtrer les passwords AVANT de retourner les données
            if (is_array($data) && count($data) > 0) {
                $filtered = array_map(function($eleve) {
                    if (isset($eleve['password'])) unset($eleve['password']);
                    return $eleve;
                }, $data);
                echo json_encode($filtered);
            } else {
                echo json_encode([]);
            }
            break;
            
        case 'POST':
            // ✅ SÉCURISÉ - Créer un nouvel élève (authentification requise)
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                http_response_code(400);
                logApiAccess($method, $apiKey, 400, 'Invalid JSON');
                echo json_encode(['error' => 'Bad Request', 'message' => 'Invalid JSON']);
                exit;
            }
            
            // Accepter soit un tableau 'data' soit directement les champs
            $eleveToAdd = null;
            if (isset($input['data']) && is_array($input['data']) && count($input['data']) > 0) {
                $eleveToAdd = $input['data'][0];
            } else if (isset($input['nom'])) {
                $eleveToAdd = $input;
            }
            
            if (!$eleveToAdd || !isset($eleveToAdd['nom']) || !isset($eleveToAdd['prenom'])) {
                http_response_code(400);
                logApiAccess($method, $apiKey, 400, 'Missing required fields');
                echo json_encode(['error' => 'Missing required fields', 'message' => 'nom and prenom are required']);
                exit;
            }
            
            $data = readEleves($elevesFile);
            if (!is_array($data)) $data = [];
            
            $data[] = $eleveToAdd;
            saveEleves($elevesFile, $data);
            
            http_response_code(201);
            logApiAccess($method, $apiKey, 201, 'Created student');
            echo json_encode(['success' => true, 'message' => 'Élève ajouté avec succès']);
            break;
            
        case 'PUT':
            // ✅ SÉCURISÉ - Modifier un élève (authentification requise)
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input || !isset($input['id'])) {
                http_response_code(400);
                logApiAccess($method, $apiKey, 400, 'Missing student ID');
                echo json_encode(['error' => 'Missing student ID']);
                exit;
            }
            
            $data = readEleves($elevesFile);
            $found = false;
            
            foreach ($data as &$eleve) {
                if ($eleve['id'] === $input['id']) {
                    $found = true;
                    foreach ($input as $key => $value) {
                        if ($key !== 'id') {
                            $eleve[$key] = $value;
                        }
                    }
                    $eleve['updatedAt'] = date('Y-m-d H:i:s');
                    break;
                }
            }
            
            if (!$found) {
                http_response_code(404);
                logApiAccess($method, $apiKey, 404, 'Student not found');
                echo json_encode(['error' => 'Student not found']);
                exit;
            }
            
            saveEleves($elevesFile, $data);
            logApiAccess($method, $apiKey, 200, 'Updated student: ' . $input['id']);
            echo json_encode(['success' => true, 'message' => 'Élève modifié avec succès']);
            break;
            
        case 'DELETE':
            // ✅ SÉCURISÉ - Supprimer un élève (authentification requise)
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input || !isset($input['id'])) {
                http_response_code(400);
                logApiAccess($method, $apiKey, 400, 'Missing student ID');
                echo json_encode(['error' => 'Missing student ID']);
                exit;
            }
            
            $data = readEleves($elevesFile);
            $initialCount = count($data);
            
            $data = array_values(array_filter($data, function($eleve) use ($input) {
                return $eleve['id'] !== $input['id'];
            }));
            
            if (count($data) === $initialCount) {
                http_response_code(404);
                logApiAccess($method, $apiKey, 404, 'Student not found');
                echo json_encode(['error' => 'Student not found']);
                exit;
            }
            
            saveEleves($elevesFile, $data);
            logApiAccess($method, $apiKey, 200, 'Deleted student: ' . $input['id']);
            echo json_encode(['success' => true, 'message' => 'Élève supprimé avec succès']);
            break;
            
        default:
            http_response_code(405);
            logApiAccess($method, $apiKey, 405, 'Method not allowed');
            echo json_encode(['error' => 'Method Not Allowed']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    logApiAccess($method, $apiKey, 500, 'Exception: ' . $e->getMessage());
    echo json_encode(['error' => 'Internal Server Error', 'message' => $e->getMessage()]);
}

?>
