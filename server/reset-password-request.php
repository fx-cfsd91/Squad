<?php
/**
 * reset-password-request.php
 * Génère un token de réinitialisation et envoie un email sécurisé à l'élève.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-KEY');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once dirname(dirname(__DIR__)) . '/priv/api-auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !isset($input['nom'], $input['prenom'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Champs nom et prenom requis']);
    exit;
}

function normalizeStr(string $str): string {
    $str = trim(preg_replace('/\s+/', ' ', $str));
    if (function_exists('normalizer_normalize')) {
        $normalized = normalizer_normalize($str, Normalizer::FORM_D);
        if ($normalized !== false) {
            $str = preg_replace('/[\x{0300}-\x{036f}]/u', '', $normalized);
        }
    }
    return strtolower($str);
}

// Réponse générique pour ne pas révéler l'existence d'un compte
$genericResponse = json_encode([
    'success' => true,
    'message' => 'Si un compte correspond à ces informations, un email de réinitialisation a été envoyé.'
]);

$elevesFile = dirname(__DIR__, 2) . '/priv/eleves.json';
$eleves = json_decode(@file_get_contents($elevesFile), true);
if (!is_array($eleves)) {
    // Réponse générique même en cas d'erreur interne
    echo $genericResponse;
    exit;
}

$eleve = null;
foreach ($eleves as $e) {
    if (normalizeStr($e['nom'] ?? '') === normalizeStr($input['nom']) &&
        normalizeStr($e['prenom'] ?? '') === normalizeStr($input['prenom'])) {
        $eleve = $e;
        break;
    }
}

// Pas de compte trouvé ou pas d'email → réponse générique (sécurité)
if (!$eleve || empty($eleve['email'])) {
    echo $genericResponse;
    exit;
}

// Générer un token cryptographiquement sûr (64 caractères hex)
$token = bin2hex(random_bytes(32));
$expiry = time() + 3600; // valide 1 heure

// Charger et nettoyer les tokens existants
$tokensFile = dirname(__DIR__, 2) . '/priv/reset-tokens.json';
$tokens = json_decode(@file_get_contents($tokensFile), true);
if (!is_array($tokens)) $tokens = [];

// Supprimer les tokens expirés
$tokens = array_filter($tokens, fn($t) => isset($t['expiry']) && $t['expiry'] > time());

// Stocker le nouveau token
$tokens[$token] = [
    'id'     => $eleve['id'],
    'expiry' => $expiry,
];

if (@file_put_contents($tokensFile, json_encode($tokens, JSON_PRETTY_PRINT), LOCK_EX) === false) {
    // Erreur d'écriture → réponse générique
    echo $genericResponse;
    exit;
}
@chmod($tokensFile, 0600);

// Construire le lien de réinitialisation
$resetLink = 'https://cfsd91.com/reset-password.php?token=' . urlencode($token);
$prenom    = ucfirst(strtolower($eleve['prenom']));
$to        = $eleve['email'];
$subject   = '=?UTF-8?B?' . base64_encode('Réinitialisation de votre mot de passe CFSD91') . '?=';

$body  = "Bonjour {$prenom},\n\n";
$body .= "Vous avez demandé la réinitialisation de votre mot de passe sur l'application CFSD91.\n\n";
$body .= "Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe :\n";
$body .= $resetLink . "\n\n";
$body .= "Ce lien est valable 1 heure. Passé ce délai, vous devrez refaire une demande.\n\n";
$body .= "Si vous n'avez pas fait cette demande, ignorez simplement cet email — votre mot de passe reste inchangé.\n\n";
$body .= "L'équipe CFSD91";

$headers  = "From: no-reply@cfsd91.com\r\n";
$headers .= "Reply-To: no-reply@cfsd91.com\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "Content-Transfer-Encoding: 8bit\r\n";

mail($to, $subject, $body, $headers);

echo $genericResponse;
