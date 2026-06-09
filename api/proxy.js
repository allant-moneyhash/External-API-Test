export const config = {
  api: { bodyParser: true }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Debug endpoint - check this first before any other validation
  if (req.query.debug) {
    return res.status(200).json({ headers: req.headers, query: req.query });
  }

  const { path } = req.query;
  if (!path) return res.status(400).json({ error: 'Missing path' });

  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(400).json({ error: 'Missing API key', received_headers: Object.keys(req.headers) });
  }

  // Staging base URL
  const url = 'https://staging-web.moneyhash.io' + decodeURIComponent(path);

  try {
    const fetchOptions = {
      method: req.method,
      headers: {
        'Authorization': 'Api-Key ' + apiKey,
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
    return res.status(500).json({ error: e.message });
  }
}
