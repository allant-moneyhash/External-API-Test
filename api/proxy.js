export const config = {
  api: { bodyParser: true }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.query.debug) {
    return res.status(200).json({ version: 'v7', query: req.query });
  }

  const { path, apikey, vaulturl, vaultsecret } = req.query;

  try {
    let url, headers;

    if (vaulturl) {
      // Vault call — full URL provided directly, use MH-AUTHORIZATION
      url = decodeURIComponent(vaulturl);
      headers = {
        'Content-Type': 'application/json',
        'MH-AUTHORIZATION': decodeURIComponent(vaultsecret),
      };
    } else {
      // Standard MoneyHash API call
      if (!apikey || !path) return res.status(400).json({ error: 'Missing apikey or path', version: 'v7' });
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

    // Always try JSON, fall back to text for debugging
    const text = await upstream.text();
    let data;
    try { data = JSON.parse(text); }
    catch(e) { return res.status(upstream.status).json({ error: 'Non-JSON response from upstream', body: text.slice(0, 500), url }); }

    return res.status(upstream.status).json(data);

  } catch (e) {
    return res.status(500).json({ error: e.message, version: 'v7' });
  }
}
