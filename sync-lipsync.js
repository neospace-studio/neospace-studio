const https = require('https');

const SYNCSO_KEY = 'sk-m51khn-_QM63kEX0ygs1_Q.O-lhj5CM4A2gV9106CriIBJJcjuQmCKt';

function httpsReq(hostname, path, method, headers, body) {
  return new Promise((resolve, reject) => {
    const opts = { hostname, path, method, headers };
    const req = https.request(opts, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        try { resolve({ statusCode: res.statusCode, body: JSON.parse(raw) }); }
        catch (e) { resolve({ statusCode: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
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
    const { videoUrl, audioBase64 } = JSON.parse(event.body);

    // Submit lip sync job to Sync.so
    const payload = JSON.stringify({
      model: 'sync-1.9.0',
      input: [
        { type: 'video', url: videoUrl },
        { type: 'audio', url: `data:audio/mpeg;base64,${audioBase64}` }
      ],
      options: { output_format: 'mp4', active_speaker: true }
    });

    const submitRes = await httpsReq(
      'api.sync.so',
      '/lipsync',
      'POST',
      {
        'x-api-key': SYNCSO_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      payload
    );

    console.log('Sync.so submit:', submitRes.statusCode, JSON.stringify(submitRes.body));

    if (submitRes.statusCode !== 200 && submitRes.statusCode !== 201) {
      // If Sync.so fails, return original video URL so video still works
      return { statusCode: 200, headers, body: JSON.stringify({ id: null, fallback: videoUrl }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ id: submitRes.body.id }) };

  } catch (err) {
    console.error('sync-lipsync error:', err.message);
    // Return fallback so video still works even if sync fails
    return { statusCode: 200, headers, body: JSON.stringify({ id: null, fallback: null }) };
  }
};
