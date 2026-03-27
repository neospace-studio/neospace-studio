const https = require('https');

const SYNCSO_KEY = 'sk-m51khn-_QM63kEX0ygs1_Q.O-lhj5CM4A2gV9106CriIBJJcjuQmCKt';

function httpsReq(hostname, path, headers) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname, path, method: 'GET', headers }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        try { resolve({ statusCode: res.statusCode, body: JSON.parse(raw) }); }
        catch (e) { resolve({ statusCode: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
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
    const { jobId } = JSON.parse(event.body);
    const res = await httpsReq('api.sync.so', `/lipsync/${jobId}`, { 'x-api-key': SYNCSO_KEY });

    console.log('Sync.so poll:', res.statusCode, JSON.stringify(res.body));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: res.body.status,
        output_url: res.body.output_url || res.body.video_url || null
      })
    };
  } catch (err) {
    return { statusCode: 200, headers, body: JSON.stringify({ status: 'error', output_url: null }) };
  }
};
