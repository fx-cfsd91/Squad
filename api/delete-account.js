// Vercel serverless proxy - suppression de compte sans CORS navigateur
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-KEY');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const payload = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

  try {
    const upstream = await fetch('https://cfsd91.com/eleves.php', {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-API-KEY': 'a7f8d9e2b3c4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5a6b7c8d9e',
      },
      body: JSON.stringify(payload),
    });

    const raw = await upstream.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return res.status(502).json({ ok: false, error: 'Réponse serveur invalide', details: raw.slice(0, 180) });
    }

    if (upstream.ok && (data.ok || data.success)) {
      return res.status(200).json({ ok: true, success: true, message: data.message || 'Compte supprimé' });
    }

    return res.status(upstream.status || 400).json({
      ok: false,
      error: data.error || data.message || 'Suppression impossible',
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: 'Erreur proxy: ' + (error?.message || String(error)) });
  }
};
