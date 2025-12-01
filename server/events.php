<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH');
header('Access-Control-Allow-Headers: Content-Type, X-API-KEY');

$eventsFile = __DIR__ . '/events.json';
$API_KEY = 'Mac131080';

// Gestion OPTIONS pour CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// Vérifier l'authentification pour POST, PUT, DELETE, PATCH
if (in_array($method, ['POST', 'PUT', 'DELETE', 'PATCH'])) {
    // Essayer plusieurs méthodes pour récupérer le header
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
function readEvents($file) {
    if (!file_exists($file)) {
        return ['events' => [], 'lastUpdate' => date('Y-m-d H:i:s')];
    }
    $content = file_get_contents($file);
    return json_decode($content, true) ?: ['events' => [], 'lastUpdate' => date('Y-m-d H:i:s')];
}

function saveEvents($file, $data) {
    $data['lastUpdate'] = date('Y-m-d H:i:s');
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
        // Récupérer tous les événements
        $data = readEvents($eventsFile);
        echo json_encode($data);
        break;
        
    case 'POST':
        // Ajouter un nouvel événement
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['title']) || !isset($input['date']) || !isset($input['type'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Bad Request', 'message' => 'Missing required fields: title, date, type']);
            exit;
        }
        
        // Valider le format de date (YYYY-MM-DD)
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $input['date'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Bad Request', 'message' => 'Invalid date format. Use YYYY-MM-DD']);
            exit;
        }
        
        // Valider le type (competition, stage, autre)
        if (!in_array($input['type'], ['competition', 'stage', 'autre'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Bad Request', 'message' => 'Type must be competition, stage, or autre']);
            exit;
        }
        
        $data = readEvents($eventsFile);
        
        $newEvent = [
            'id' => uniqid('event_', true),
            'title' => trim($input['title']),
            'type' => $input['type'], // competition, stage, autre
            'date' => $input['date'], // YYYY-MM-DD
            'startTime' => $input['startTime'] ?? '', // HH:MM optionnel
            'endTime' => $input['endTime'] ?? '', // HH:MM optionnel
            'location' => $input['location'] ?? '', // Lieu
            'description' => $input['description'] ?? '',
            'visible' => true,
            'createdAt' => date('Y-m-d H:i:s')
        ];
        
        $data['events'][] = $newEvent;
        saveEvents($eventsFile, $data);
        
        echo json_encode(['success' => true, 'event' => $newEvent]);
        break;
        
    case 'PUT':
        // Modifier un événement existant
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Bad Request', 'message' => 'Missing event ID']);
            exit;
        }
        
        $data = readEvents($eventsFile);
        $eventFound = false;
        
        foreach ($data['events'] as &$event) {
            if ($event['id'] === $input['id']) {
                $eventFound = true;
                
                // Mettre à jour les champs fournis
                if (isset($input['title'])) $event['title'] = trim($input['title']);
                if (isset($input['type'])) $event['type'] = $input['type'];
                if (isset($input['date'])) $event['date'] = $input['date'];
                if (isset($input['startTime'])) $event['startTime'] = $input['startTime'];
                if (isset($input['endTime'])) $event['endTime'] = $input['endTime'];
                if (isset($input['location'])) $event['location'] = $input['location'];
                if (isset($input['description'])) $event['description'] = $input['description'];
                if (isset($input['visible'])) $event['visible'] = (bool)$input['visible'];
                
                $event['updatedAt'] = date('Y-m-d H:i:s');
                break;
            }
        }
        
        if (!$eventFound) {
            http_response_code(404);
            echo json_encode(['error' => 'Not Found', 'message' => 'Event not found']);
            exit;
        }
        
        saveEvents($eventsFile, $data);
        echo json_encode(['success' => true, 'message' => 'Event updated']);
        break;
        
    case 'DELETE':
        // Supprimer un événement
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Bad Request', 'message' => 'Missing event ID']);
            exit;
        }
        
        $data = readEvents($eventsFile);
        $initialCount = count($data['events']);
        
        $data['events'] = array_values(array_filter($data['events'], function($event) use ($input) {
            return $event['id'] !== $input['id'];
        }));
        
        if (count($data['events']) === $initialCount) {
            http_response_code(404);
            echo json_encode(['error' => 'Not Found', 'message' => 'Event not found']);
            exit;
        }
        
        saveEvents($eventsFile, $data);
        echo json_encode(['success' => true, 'message' => 'Event deleted']);
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method Not Allowed']);
        break;
}
