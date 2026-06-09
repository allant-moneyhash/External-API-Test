export const config = {
  api: { bodyParser: true }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.query.debug) {
    return res.status(200).json({ version: 'v6', method: req.method, query: req.query });
  }

  const { path, apikey, vaulturl, vaultsecret } = req.query;
  if (!path) return res.status(400).json({ error: 'Missing path', version: 'v6' });

  try {
    let url, headers;

    if (vaulturl && vaultsecret) {
      // Vault call — uses MH-AUTHORIZATION header
      url = decodeURIComponent(vaulturl);
      headers = {
        'Content-Type': 'application/json',
        'MH-AUTHORIZATION': decodeURIComponent(vaultsecret),
      };
    } else {
      // Standard MoneyHash API call — uses X-Api-Key header
      if (!apikey) return res.status(400).json({ error: 'Missing apikey', version: 'v6' });
      url = 'https://staging-web.moneyhash.io' + decodeURIComponent(path);
      headers = {
        'Content-Type': 'application/json',
        'X-Api-Key': decodeURIComponent(apikey),
      };
    }

    const fetchOptions = { method: req.method, headers };
    if (req.method === 'POST' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const upstream = await fetch(url, fetchOptions);
    const data = await upstream.json();
    return res.status(upstream.status).json(data);

  } catch (e) {
    return res.status(500).json({ error: e.message, version: 'v6' });
  }
}
