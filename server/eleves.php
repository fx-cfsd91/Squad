<?php
// ============================================
// 🔒 API SÉCURISÉE - AUTHENTIFICATION REQUISE
// ============================================

ini_set('memory_limit', '512M');
ini_set('max_execution_time', '60');
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH');
header('Access-Control-Allow-Headers: Content-Type, X-API-KEY');

// Déterminer le chemin du fichier eleves.json
// __DIR__ = /home/u285984816/public_html/cfsd91/server
// dirname(__DIR__, 2) = /home/u285984816/public_html
$elevesFile = dirname(__DIR__, 2) . '/priv/eleves.json';
$logsDir = dirname(__DIR__, 2) . '/priv/api_logs';

// ⚠️  CLÉ API SÉCURISÉE - À STOCKER DANS LES VARIABLES D'ENVIRONNEMENT EN PRODUCTION
$ALLOWED_KEYS = ['Mac131080'];

// Créer le dossier de logs
@mkdir($logsDir, 0755, true);

// Fonction pour logger les accès API
function logApiAccess($method, $apiKey, $status, $details = '') {
    global $logsDir;
    $logFile = $logsDir . '/access.log';
    $keyMask = !empty($apiKey) ? substr($apiKey, 0, 3) . '***' . substr($apiKey, -3) : 'NONE';
    $logEntry = date('Y-m-d H:i:s') . " | $method | Key: $keyMask | Status: $status | IP: {$_SERVER['REMOTE_ADDR']} | $details\n";
    @file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}

// Fonction pour extraire la clé API
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

// Gestion des requêtes OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-API-KEY, Authorization');
    header('Access-Control-Max-Age: 86400');
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$apiKey = getApiKey();

// ✅ AUTHENTIFICATION REQUISE POUR TOUTES LES REQUÊTES (GET, POST, PUT, DELETE)
if (!in_array($apiKey, $ALLOWED_KEYS)) {
    http_response_code(401);
    logApiAccess($method, $apiKey, 401, 'Unauthorized');
    echo json_encode(['error' => 'Unauthorized', 'message' => 'Invalid or missing API key']);
    exit;
}

// Fonctions helper
function readEleves($file) {
    if (!file_exists($file)) {
        return [];
    }
    $content = file_get_contents($file);
    return json_decode($content, true) ?: [];
}

function saveEleves($file, $data) {
    $dir = dirname($file);
    // Créer le répertoire s'il n'existe pas
    @mkdir($dir, 0755, true);
    
    $tempFile = $file . '.tmp';
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
    // Écrire dans le fichier temporaire
    if (file_put_contents($tempFile, $json) === false) {
        return false;
    }
    
    // Renommer le fichier temporaire
    if (rename($tempFile, $file) === false) {
        @unlink($tempFile);
        return false;
    }
    
    // Définir les permissions
    @chmod($file, 0666);
    return true;
}

// Routage selon la méthode HTTP
switch ($method) {
    case 'GET':
        // Récupérer tous les élèves - SÉCURISÉ avec authentification
        logApiAccess($method, $apiKey, 200, 'Fetching all students');
        
        // Récupérer les données
        $data = readEleves($elevesFile);
        
        // Filtrer les mots de passe avant de retourner
        if (is_array($data)) {
            $filtered = array_map(function($eleve) {
                unset($eleve['password']);
                return $eleve;
            }, $data);
            echo json_encode($filtered);
        } else {
            echo json_encode([]);
        }
        break;
        
    case 'POST':
        // Ajouter un ou plusieurs nouveaux élèves
        $input = json_decode(file_get_contents('php://input'), true);
        // Log temporaire pour debug : retour de la donnée reçue et du champ photo
        if (!$input) {
            http_response_code(400);
            logApiAccess($method, $apiKey, 400, 'Invalid JSON');
            echo json_encode(['error' => 'Bad Request', 'message' => 'Invalid JSON']);
            exit;
        }
        // Afficher le champ photo reçu (pour debug)
        $debugPhoto = '';
        if (isset($input['photo'])) {
            $debugPhoto = substr($input['photo'], 0, 50) . (strlen($input['photo']) > 50 ? '...' : '');
        } elseif (isset($input['data'][0]['photo'])) {
            $debugPhoto = substr($input['data'][0]['photo'], 0, 50) . (strlen($input['data'][0]['photo']) > 50 ? '...' : '');
        }
        // Accepter soit un tableau de data soit directement les données
        $elevesToAdd = isset($input['data']) ? $input['data'] : [$input];
        // Valider que c'est un tableau
        if (!is_array($elevesToAdd)) {
            http_response_code(400);
            echo json_encode(['error' => 'Bad Request', 'message' => 'data must be an array']);
            exit;
        }
        $eleves = readEleves($elevesFile);
        $addedEleves = [];
        foreach ($elevesToAdd as $eleve) {
            // Valider les champs obligatoires
            $requiredFields = ['id', 'nom', 'prenom', 'naissance', 'jour', 'discipline', 'password'];
            $missing = [];
            foreach ($requiredFields as $field) {
                if (!isset($eleve[$field]) || $eleve[$field] === '') {
                    $missing[] = $field;
                }
            }
            if (!empty($missing)) {
                http_response_code(400);
                echo json_encode(['error' => 'Bad Request', 'message' => 'Missing required fields: ' . implode(', ', $missing)]);
                exit;
            }
            // Ajouter à la liste
            $newEleve = [
                'id' => $eleve['id'],
                'nom' => trim($eleve['nom']),
                'prenom' => trim($eleve['prenom']),
                'naissance' => $eleve['naissance'], // YYYY-MM-DD
                'jour' => $eleve['jour'],
                'discipline' => $eleve['discipline'],
                'combattant' => $eleve['combattant'] ?? false,
                'etudiant' => $eleve['etudiant'] ?? false,
                'renouvellement' => $eleve['renouvellement'] ?? false,
                'telUrgence' => $eleve['telUrgence'] ?? '',
                'telEleve' => $eleve['telEleve'] ?? '',
                'email' => $eleve['email'] ?? '',
                'adresse' => $eleve['adresse'] ?? '',
                'poids' => $eleve['poids'] ?? null,
                'licence' => $eleve['licence'] ?? '',
                'ceinture' => $eleve['ceinture'] ?? '',
                'photo' => $eleve['photo'] ?? '', // base64 ou vide
                'password' => $eleve['password'],
                'createdAt' => $eleve['createdAt'] ?? date('Y-m-d H:i:s')
            ];
            $eleves[] = $newEleve;
            $addedEleves[] = $newEleve;
        }
        saveEleves($elevesFile, $eleves);
        logApiAccess($method, $apiKey, 201, 'Created ' . count($addedEleves) . ' student(s)');
        // Réponse enrichie pour debug
        echo json_encode([
            'success' => true,
            'ok' => true,
            'message' => count($addedEleves) . ' élève(s) ajouté(s)',
            'eleves' => $addedEleves,
            'debug' => [
                'input' => $input,
                'photo' => $debugPhoto
            ]
        ]);
        break;
        
    case 'PUT':
        // Modifier un élève existant
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Bad Request', 'message' => 'Missing eleve ID']);
            exit;
        }
        
        // Vérifier si le fichier existe
        if (!file_exists($elevesFile)) {
            http_response_code(500);
            logApiAccess($method, $apiKey, 500, "File not found: $elevesFile");
            echo json_encode(['error' => 'Server Error', 'message' => 'Eleves file not found', 'path' => $elevesFile, 'exists' => file_exists($elevesFile)]);
            exit;
        }
        
        $eleves = readEleves($elevesFile);
        if (empty($eleves)) {
            http_response_code(500);
            logApiAccess($method, $apiKey, 500, "Eleves data is empty from: $elevesFile");
            echo json_encode(['error' => 'Server Error', 'message' => 'Eleves data is empty', 'path' => $elevesFile]);
            exit;
        }
        
        $eleveFound = false;
        
        foreach ($eleves as &$eleve) {
            if ($eleve['id'] === $input['id']) {
                $eleveFound = true;
                
                // Mettre à jour les champs fournis
                $updatableFields = ['nom', 'prenom', 'naissance', 'jour', 'discipline', 'combattant', 'etudiant', 'renouvellement', 'telUrgence', 'telEleve', 'email', 'adresse', 'poids', 'licence', 'ceinture', 'photo', 'password'];
                
                foreach ($updatableFields as $field) {
                    if (isset($input[$field])) {
                        $eleve[$field] = $input[$field];
                    }
                }
                
                $eleve['updatedAt'] = date('Y-m-d H:i:s');
                break;
            }
        }
        
        if (!$eleveFound) {
            http_response_code(404);
            logApiAccess($method, $apiKey, 404, "Student not found: {$input['id']}");
            echo json_encode(['error' => 'Not Found', 'message' => 'Eleve not found', 'searchId' => $input['id']]);
            exit;
        }
        
        // Sauvegarder les modifications
        if (!saveEleves($elevesFile, $eleves)) {
            http_response_code(500);
            logApiAccess($method, $apiKey, 500, "Failed to save eleves to: $elevesFile");
            echo json_encode(['error' => 'Server Error', 'message' => 'Failed to save changes', 'path' => $elevesFile]);
            exit;
        }
        
        logApiAccess($method, $apiKey, 200, 'Updated student: ' . $input['id']);
        echo json_encode(['success' => true, 'message' => 'Eleve updated successfully']);
        break;
        
    case 'DELETE':
        // Supprimer un élève
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Bad Request', 'message' => 'Missing eleve ID']);
            exit;
        }
        
        $eleves = readEleves($elevesFile);
        $initialCount = count($eleves);
        
        $eleves = array_values(array_filter($eleves, function($eleve) use ($input) {
            return $eleve['id'] !== $input['id'];
        }));
        
        if (count($eleves) === $initialCount) {
            http_response_code(404);
            echo json_encode(['error' => 'Not Found', 'message' => 'Eleve not found']);
            exit;
        }
        
        saveEleves($elevesFile, $eleves);
        logApiAccess($method, $apiKey, 200, 'Deleted student: ' . $input['id']);
        echo json_encode(['success' => true, 'message' => 'Eleve deleted']);
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method Not Allowed']);
        break;
}
