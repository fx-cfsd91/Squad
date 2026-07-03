// Vercel serverless proxy - contourne le CORS pour l'authentification
const UPSTREAM_URLS = [
  // Endpoint principal utilisé par l'app mobile
  'https://cfsd91.com/appli/php/identification.php',
  // Fallback legacy (si infra ancienne)
  'https://cfsd91.com/login.php',
  'https://cfsd91.com/appli/php/login.php',
];

function normalizeBody(body) {
  if (body == null) return {};
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  if (typeof body === 'object') return body;
  return {};
}

function shortSnippet(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-KEY');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const payload = normalizeBody(req.body);
  let lastFailure = null;
  let lastAuthFailure = null;

  for (const url of UPSTREAM_URLS) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-API-KEY': process.env.API_KEY || '',
        },
        body: JSON.stringify(payload),
      });

      const raw = await response.text();
      let parsed = null;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = null;
      }

      if (parsed) {
        if (parsed.ok === true || parsed.success === true) {
          return res.status(response.status).json({
            ok: true,
            eleve: parsed.eleve || null,
          });
        }

        // Continuer vers le prochain endpoint au lieu d'échouer immédiatement.
        // Cela evite un faux negatif si une URL legacy renvoie 401 mais que
        // l'endpoint principal accepte bien le mot de passe mis a jour.
        lastAuthFailure = {
          status: response.status,
          error: parsed.error || parsed.message || 'Authentification echouee',
          details: {
            url,
            status: response.status,
            snippet: shortSnippet(raw),
          },
        };
        continue;
      }

      lastFailure = {
        url,
        status: response.status,
        snippet: shortSnippet(raw),
      };
    } catch (error) {
      lastFailure = {
        url,
        status: 0,
        snippet: String(error && error.message ? error.message : error),
      };
    }
  }

  if (lastAuthFailure) {
    return res.status(lastAuthFailure.status || 401).json({
      ok: false,
      error: lastAuthFailure.error,
      details: lastAuthFailure.details,
    });
  }

  return res.status(502).json({
    ok: false,
    error: 'Le serveur d\'authentification a retourne une reponse invalide.',
    details: lastFailure,
  });
};
