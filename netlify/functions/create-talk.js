const https = require('https');

const DID_API_KEY = 'bWFvYW1hYW5AZ21haWwuY29t:RMgkc1QkKRJGs1mHOok4D';

function httpsReq(hostname, path, method, headers, body) {
  return new Promise((resolve, reject) => {
    const opts = { hostname, path, method, headers };
    const req = https.request(opts, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks);
        try { resolve({ statusCode: res.statusCode, body: JSON.parse(raw.toString()) }); }
        catch (e) { resolve({ statusCode: res.statusCode, body: raw.toString() }); }
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

    // Step 1: Upload audio buffer to D-ID's audio endpoint first
    const audioBuf = Buffer.from(audioBase64, 'base64');
    
    // Use multipart form upload to D-ID
    const boundary = '----FormBoundary' + Date.now();
    const formHeader = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="audio"; filename="voice.mp3"\r\nContent-Type: audio/mpeg\r\n\r\n`
    );
    const formFooter = Buffer.from(`\r\n--${boundary}--\r\n`);
    const formBody = Buffer.concat([formHeader, audioBuf, formFooter]);

    const uploadRes = await httpsReq(
      'api.d-id.com',
      '/audios',
      'POST',
      {
        'Authorization': `Basic ${DID_API_KEY}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': formBody.length
      },
      formBody
    );

    console.log('Audio upload status:', uploadRes.statusCode, JSON.stringify(uploadRes.body));

    if (uploadRes.statusCode !== 200 && uploadRes.statusCode !== 201) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Audio upload failed: ' + JSON.stringify(uploadRes.body) }) };
    }

    const audioUrl = uploadRes.body.url;
    console.log('Audio URL:', audioUrl);

    // Step 2: Create talk with audio URL
    const talkPayload = JSON.stringify({
      source_url: photoUrl,
      script: { type: 'audio', audio_url: audioUrl },
      config: { fluent: true, pad_audio: 0.5, stitch: true, result_format: 'mp4' }
    });

    const talkRes = await httpsReq(
      'api.d-id.com',
      '/talks',
      'POST',
      {
        'Authorization': `Basic ${DID_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(talkPayload)
      },
      talkPayload
    );

    console.log('Talk create status:', talkRes.statusCode, JSON.stringify(talkRes.body));

    if (talkRes.statusCode !== 200 && talkRes.statusCode !== 201) {
      return { statusCode: talkRes.statusCode, headers, body: JSON.stringify({ error: talkRes.body.description || talkRes.body.message || JSON.stringify(talkRes.body) }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ id: talkRes.body.id }) };

  } catch (err) {
    console.error('Error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
