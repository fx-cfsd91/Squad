<?php
/**
 * reset-password.php
 * Page web ouverte depuis le lien reçu par email.
 * Valide le token et permet à l'élève de définir un nouveau mot de passe.
 */

// ─── Traitement du formulaire POST ───────────────────────────────────────────
$error   = '';
$success = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $token           = trim($_POST['token'] ?? '');
    $newPassword     = $_POST['password'] ?? '';
    $confirmPassword = $_POST['confirm_password'] ?? '';

    // Validation des champs
    if (empty($token)) {
        $error = 'Token manquant.';
    } elseif (!preg_match('/^[0-9a-f]{64}$/', $token)) {
        $error = 'Token invalide.';
    } elseif (strlen($newPassword) < 8 ||
              !preg_match('/[A-Z]/', $newPassword) ||
              !preg_match('/[a-z]/', $newPassword) ||
              !preg_match('/\d/', $newPassword)    ||
              !preg_match('/[^a-zA-Z\d\s]/', $newPassword)) {
        $error = 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.';
    } elseif ($newPassword !== $confirmPassword) {
        $error = 'Les mots de passe ne correspondent pas.';
    } else {
        $tokensFile = dirname(__DIR__, 2) . '/priv/reset-tokens.json';
        $tokens = json_decode(@file_get_contents($tokensFile), true);

        if (!is_array($tokens) || !isset($tokens[$token])) {
            $error = 'Ce lien est invalide ou a déjà été utilisé.';
        } elseif ($tokens[$token]['expiry'] < time()) {
            // Supprimer le token expiré
            unset($tokens[$token]);
            @file_put_contents($tokensFile, json_encode($tokens, JSON_PRETTY_PRINT), LOCK_EX);
            $error = 'Ce lien a expiré. Veuillez refaire une demande depuis l\'application.';
        } else {
            $eleveId = $tokens[$token]['id'];

            // Charger les élèves
            $elevesFile = dirname(__DIR__, 2) . '/priv/eleves.json';
            $eleves = json_decode(@file_get_contents($elevesFile), true);

            if (!is_array($eleves)) {
                $error = 'Erreur interne. Veuillez réessayer.';
            } else {
                $updated = false;
                foreach ($eleves as &$e) {
                    if (($e['id'] ?? '') === $eleveId) {
                        $e['password'] = password_hash($newPassword, PASSWORD_DEFAULT);
                        $updated = true;
                        break;
                    }
                }
                unset($e);

                if (!$updated) {
                    $error = 'Compte introuvable.';
                } else {
                    $tmpFile = $elevesFile . '.tmp';
                    if (@file_put_contents($tmpFile, json_encode($eleves, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX) === false ||
                        !@rename($tmpFile, $elevesFile)) {
                        @unlink($tmpFile);
                        $error = 'Erreur lors de la sauvegarde. Veuillez réessayer.';
                    } else {
                        // Invalider le token (usage unique)
                        unset($tokens[$token]);
                        @file_put_contents($tokensFile, json_encode($tokens, JSON_PRETTY_PRINT), LOCK_EX);
                        $success = true;
                    }
                }
            }
        }
    }
}

// ─── Validation du token en GET ──────────────────────────────────────────────
$token = '';
$tokenValid = false;

if (!$success && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $token = trim($_GET['token'] ?? '');
    if (preg_match('/^[0-9a-f]{64}$/', $token)) {
        $tokensFile = dirname(__DIR__, 2) . '/priv/reset-tokens.json';
        $tokens = json_decode(@file_get_contents($tokensFile), true);
        if (is_array($tokens) && isset($tokens[$token]) && $tokens[$token]['expiry'] > time()) {
            $tokenValid = true;
        } else {
            $error = 'Ce lien est invalide ou a expiré. Veuillez refaire une demande depuis l\'application.';
        }
    } else {
        $error = 'Lien invalide.';
    }
} elseif (!$success && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $token = trim($_POST['token'] ?? '');
    $tokenValid = empty($error); // si pas d'erreur avant, on peut ré-afficher le form
}

$tokenEscaped = htmlspecialchars($token, ENT_QUOTES, 'UTF-8');
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Réinitialisation du mot de passe – CFSD91</title>
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #09090b;
            color: #e5e7eb;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
        }
        .card {
            background: #18181b;
            border: 1px solid #27272a;
            border-radius: 12px;
            padding: 36px 32px;
            max-width: 420px;
            width: 100%;
        }
        .logo { color: #b40a0a; font-size: 28px; font-weight: 800; margin-bottom: 8px; }
        h1 { font-size: 20px; font-weight: 700; margin-bottom: 24px; color: #f4f4f5; }
        label { display: block; font-size: 14px; color: #a1a1aa; margin-bottom: 6px; margin-top: 16px; }
        input[type="password"] {
            width: 100%;
            background: #09090b;
            border: 1px solid #3f3f46;
            border-radius: 8px;
            color: #f4f4f5;
            padding: 12px 14px;
            font-size: 15px;
            outline: none;
            transition: border-color .15s;
        }
        input[type="password"]:focus { border-color: #b40a0a; }
        .hint { font-size: 12px; color: #71717a; margin-top: 8px; }
        button {
            width: 100%;
            background: #b40a0a;
            color: #fff;
            border: none;
            border-radius: 8px;
            padding: 13px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 24px;
            transition: background .15s;
        }
        button:hover { background: #991b1b; }
        .error {
            background: #3f0d0d;
            border: 1px solid #b40a0a;
            border-radius: 8px;
            color: #fca5a5;
            padding: 12px 16px;
            font-size: 14px;
            margin-bottom: 16px;
        }
        .success-box {
            text-align: center;
        }
        .success-icon { font-size: 56px; margin-bottom: 16px; }
        .success-title { font-size: 22px; font-weight: 700; color: #22c55e; margin-bottom: 12px; }
        .success-text { color: #a1a1aa; line-height: 1.6; }
        .back-link { display: block; text-align: center; margin-top: 20px; color: #71717a; font-size: 14px; text-decoration: none; }
        .back-link:hover { color: #b40a0a; }
    </style>
</head>
<body>
<div class="card">
    <div class="logo">CFSD91</div>

    <?php if ($success): ?>
        <div class="success-box">
            <div class="success-icon">✅</div>
            <div class="success-title">Mot de passe modifié !</div>
            <p class="success-text">Votre mot de passe a été mis à jour avec succès.<br>Vous pouvez maintenant vous connecter depuis l'application.</p>
        </div>
    <?php elseif (!empty($error) && !$tokenValid): ?>
        <h1>Réinitialisation du mot de passe</h1>
        <div class="error"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></div>
        <p style="color:#71717a;font-size:14px;">Retournez dans l'application et faites une nouvelle demande de réinitialisation.</p>
    <?php else: ?>
        <h1>Choisissez un nouveau mot de passe</h1>

        <?php if (!empty($error)): ?>
            <div class="error"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></div>
        <?php endif; ?>

        <form method="POST" action="">
            <input type="hidden" name="token" value="<?= $tokenEscaped ?>">

            <label for="password">Nouveau mot de passe</label>
            <input type="password" id="password" name="password" required autofocus autocomplete="new-password">

            <label for="confirm_password">Confirmer le mot de passe</label>
            <input type="password" id="confirm_password" name="confirm_password" required autocomplete="new-password">

            <p class="hint">8 caractères minimum · une majuscule · une minuscule · un chiffre · un caractère spécial</p>

            <button type="submit">Enregistrer le nouveau mot de passe</button>
        </form>
    <?php endif; ?>

    <a class="back-link" href="https://cfsd91.com">← Retour au site</a>
</div>
</body>
</html>
