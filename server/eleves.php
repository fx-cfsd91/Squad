<?php
// Augmenter les limites pour les uploads de photos en base64
ini_set('upload_max_filesize', '50M');
ini_set('post_max_size', '50M');
ini_set('memory_limit', '256M');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH');
header('Access-Control-Allow-Headers: Content-Type, X-API-KEY');

$elevesFile = __DIR__ . '/eleves.json';
$API_KEY = 'KEYOFSQUAD01@';

// Gestion OPTIONS pour CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// Vérifier l'authentification pour POST, PUT, DELETE, PATCH
if (in_array($method, ['POST', 'PUT', 'DELETE', 'PATCH'])) {
    $apiKey = '';
    
    // Méthode 1: getallheaders() si disponible
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        $apiKey = $headers['X-API-KEY'] ?? $headers['x-api-key'] ?? '';
    }
    
    // Méthode 2: Via $_SERVER
    if (empty($apiKey)) {
        $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
    }
    
    // Méthode 3: Via apache_request_headers() si disponible
    if (empty($apiKey) && function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        $apiKey = $headers['X-API-KEY'] ?? $headers['x-api-key'] ?? '';
    }
    
    if ($apiKey !== $API_KEY) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized', 'message' => 'Invalid API key']);
        exit;
    }
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
    $tempFile = $file . '.tmp';
    file_put_contents($tempFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    rename($tempFile, $file);
    
    if (!file_exists($file)) {
        chmod($file, 0666);
    }
}

// Routage selon la méthode HTTP
switch ($method) {
    case 'GET':
        // Récupérer tous les élèves
        $data = readEleves($elevesFile);
        echo json_encode($data);
        break;
        
    case 'POST':
        // Ajouter un ou plusieurs nouveaux élèves
        $input = json_decode(file_get_contents('php://input'), true);
        // Log temporaire pour debug : retour de la donnée reçue et du champ photo
        if (!$input) {
            http_response_code(400);
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
        
        $eleves = readEleves($elevesFile);
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
            echo json_encode(['error' => 'Not Found', 'message' => 'Eleve not found']);
            exit;
        }
        
        saveEleves($elevesFile, $eleves);
        echo json_encode(['success' => true, 'message' => 'Eleve updated']);
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
        echo json_encode(['success' => true, 'message' => 'Eleve deleted']);
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method Not Allowed']);
        break;
}
