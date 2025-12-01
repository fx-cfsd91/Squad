<?php
/**
 * API de gestion des cours récurrents
 * Méthodes : GET (liste), POST (ajouter), PUT (modifier), DELETE (supprimer)
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-KEY');

// Gestion des requêtes OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Configuration
$SECRET = 'Mac131080';
$coursesFile = __DIR__ . '/courses.json';

// Fonction pour lire les cours
function readCourses($file) {
    if (!file_exists($file)) {
        return ['courses' => []];
    }
    $content = file_get_contents($file);
    return json_decode($content, true) ?: ['courses' => []];
}

// Fonction pour sauvegarder les cours
function saveCourses($file, $data) {
    $data['lastUpdate'] = date('Y-m-d H:i:s');
    $temp = $file . '.tmp';
    file_put_contents($temp, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    rename($temp, $file);
    chmod($file, 0644);
}

// Vérification de l'authentification pour les méthodes qui modifient
$method = $_SERVER['REQUEST_METHOD'];
if (in_array($method, ['POST', 'PUT', 'DELETE'])) {
    $headers = getallheaders();
    $apiKey = $headers['X-API-KEY'] ?? $headers['X-Api-Key'] ?? $headers['x-api-key'] ?? '';
    
    if ($apiKey !== $SECRET) {
        http_response_code(403);
        echo json_encode(['error' => 'Unauthorized', 'message' => 'Invalid API key']);
        exit;
    }
}

// Routage selon la méthode HTTP
switch ($method) {
    case 'GET':
        // Récupérer tous les cours
        $data = readCourses($coursesFile);
        echo json_encode($data);
        break;
        
    case 'POST':
        // Ajouter un nouveau cours
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['day']) || !isset($input['startTime']) || !isset($input['endTime']) || !isset($input['title'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Bad Request', 'message' => 'Missing required fields']);
            exit;
        }
        
        // Valider le jour (dimanche = 0, mercredi = 3, vendredi = 5)
        if (!in_array($input['day'], [0, 3, 5])) {
            http_response_code(400);
            echo json_encode(['error' => 'Bad Request', 'message' => 'Day must be 0 (Sunday), 3 (Wednesday) or 5 (Friday)']);
            exit;
        }
        
        $data = readCourses($coursesFile);
        
        $newCourse = [
            'id' => uniqid('course_', true),
            'title' => trim($input['title']), // Intitulé du cours
            'day' => (int)$input['day'], // 0 = dimanche, 3 = mercredi, 5 = vendredi
            'startTime' => $input['startTime'], // Format HH:MM
            'endTime' => $input['endTime'], // Format HH:MM
            'details' => $input['details'] ?? '',
            'active' => true,
            'canceledDates' => [], // Dates annulées
            'createdAt' => date('Y-m-d H:i:s')
        ];
        
        $data['courses'][] = $newCourse;
        saveCourses($coursesFile, $data);
        
        echo json_encode(['success' => true, 'course' => $newCourse]);
        break;
        
    case 'PUT':
        // Modifier un cours existant
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Bad Request', 'message' => 'Missing course ID']);
            exit;
        }
        
        $data = readCourses($coursesFile);
        $found = false;
        
        foreach ($data['courses'] as &$course) {
            if ($course['id'] === $input['id']) {
                // Mettre à jour les champs fournis
                if (isset($input['title'])) $course['title'] = trim($input['title']);
                if (isset($input['day'])) $course['day'] = (int)$input['day'];
                if (isset($input['startTime'])) $course['startTime'] = $input['startTime'];
                if (isset($input['endTime'])) $course['endTime'] = $input['endTime'];
                if (isset($input['details'])) $course['details'] = $input['details'];
                if (isset($input['active'])) $course['active'] = (bool)$input['active'];
                
                $course['updatedAt'] = date('Y-m-d H:i:s');
                $found = true;
                break;
            }
        }
        
        if (!$found) {
            http_response_code(404);
            echo json_encode(['error' => 'Not Found', 'message' => 'Course not found']);
            exit;
        }
        
        saveCourses($coursesFile, $data);
        echo json_encode(['success' => true, 'message' => 'Course updated']);
        break;
        
    case 'DELETE':
        // Supprimer un cours
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Bad Request', 'message' => 'Missing course ID']);
            exit;
        }
        
        $data = readCourses($coursesFile);
        $initialCount = count($data['courses']);
        
        $data['courses'] = array_values(array_filter($data['courses'], function($course) use ($input) {
            return $course['id'] !== $input['id'];
        }));
        
        if (count($data['courses']) === $initialCount) {
            http_response_code(404);
            echo json_encode(['error' => 'Not Found', 'message' => 'Course not found']);
            exit;
        }
        
        saveCourses($coursesFile, $data);
        echo json_encode(['success' => true, 'message' => 'Course deleted']);
        break;
        
    case 'PATCH':
        // Annuler ou réactiver une date spécifique
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['id']) || !isset($input['date']) || !isset($input['action'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Bad Request', 'message' => 'Missing id, date or action']);
            exit;
        }
        
        // Valider le format de date (YYYY-MM-DD)
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $input['date'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Bad Request', 'message' => 'Invalid date format. Use YYYY-MM-DD']);
            exit;
        }
        
        // Valider l'action (cancel ou uncancel)
        if (!in_array($input['action'], ['cancel', 'uncancel'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Bad Request', 'message' => 'Action must be "cancel" or "uncancel"']);
            exit;
        }
        
        $data = readCourses($coursesFile);
        $courseFound = false;
        
        foreach ($data['courses'] as &$course) {
            if ($course['id'] === $input['id']) {
                $courseFound = true;
                
                // Initialiser canceledDates si inexistant (compatibilité anciens cours)
                if (!isset($course['canceledDates'])) {
                    $course['canceledDates'] = [];
                }
                
                if ($input['action'] === 'cancel') {
                    // Ajouter la date si elle n'est pas déjà annulée
                    if (!in_array($input['date'], $course['canceledDates'])) {
                        $course['canceledDates'][] = $input['date'];
                    }
                } else {
                    // Retirer la date des annulations
                    $course['canceledDates'] = array_values(array_filter($course['canceledDates'], function($d) use ($input) {
                        return $d !== $input['date'];
                    }));
                }
                
                $course['updatedAt'] = date('Y-m-d H:i:s');
                break;
            }
        }
        
        if (!$courseFound) {
            http_response_code(404);
            echo json_encode(['error' => 'Not Found', 'message' => 'Course not found']);
            exit;
        }
        
        saveCourses($coursesFile, $data);
        echo json_encode(['success' => true, 'message' => 'Date cancellation updated']);
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method Not Allowed']);
        break;
}
