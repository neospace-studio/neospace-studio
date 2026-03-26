const https = require('https');

const DID_API_KEY = 'bWFvYW1hYW5AZ21haWwuY29t:RMgkc1QkKRJGs1mHOok4D';

function httpsRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: options.method || 'GET',
      headers: options.headers || {}
    };
    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    const { audioBase64, photoUrl } = JSON.parse(event.body);

    const payload = JSON.stringify({
      source_url: photoUrl,
      script: { type: 'audio', audio_url: `data:audio/mpeg;base64,${audioBase64}` },
      config: { fluent: true, pad_audio: 0.5, stitch: true, result_format: 'mp4' }
    });

    const result = await httpsRequest('https://api.d-id.com/talks', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${DID_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, payload);

    console.log('D-ID status:', result.status, 'body:', JSON.stringify(result.body));

    if (result.status !== 201 && result.status !== 200) {
      return { statusCode: result.status, headers, body: JSON.stringify({ error: result.body.description || result.body.message || JSON.stringify(result.body) }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ id: result.body.id }) };
  } catch (err) {
    console.error('create-talk error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
