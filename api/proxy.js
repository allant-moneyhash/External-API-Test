export const config = {
  api: { bodyParser: true }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Debug: always check first — visit ?debug=1 to inspect
  if (req.query.debug) {
    return res.status(200).json({
      version: 'v4',
      method: req.method,
      received_headers: req.headers,
      query: req.query,
    });
  }

  const { path } = req.query;
  if (!path) return res.status(400).json({ error: 'Missing path', version: 'v4' });

  // Accept key from header OR query param (fallback for debugging)
  const apiKey = req.headers['x-api-key'] || req.query.apikey;
  if (!apiKey) {
    return res.status(400).json({
      error: 'Missing API key',
      version: 'v4',
      headers_received: Object.keys(req.headers),
    });
  }

  const url = 'https://staging-web.moneyhash.io' + decodeURIComponent(path);

  try {
    const fetchOptions = {
      method: req.method,
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
    };

    if (req.method === 'POST' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const upstream = await fetch(url, fetchOptions);
    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message, version: 'v4' });
  }
}
