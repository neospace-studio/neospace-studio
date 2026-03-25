// D-ID key: already base64(email:key) — use as-is for Basic auth
const DID_EMAIL = 'maoamaan@gmail.com';
const DID_KEY = 'IveqbttS8H5F-a5PGBqXm';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    const { audioBase64, photoUrl } = JSON.parse(event.body);

    // Proper Basic auth: base64(email:key)
    const authToken = Buffer.from(`${DID_EMAIL}:${DID_KEY}`).toString('base64');

    const res = await fetch('https://api.d-id.com/talks', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        source_url: photoUrl,
        script: {
          type: 'audio',
          audio_url: `data:audio/mpeg;base64,${audioBase64}`
        },
        config: { fluent: true, pad_audio: 0.5, stitch: true, result_format: 'mp4' }
      })
    });

    const data = await res.json();
    console.log('D-ID response:', JSON.stringify(data));

    if (!res.ok) return {
      statusCode: res.status,
      headers,
      body: JSON.stringify({ error: data.description || data.message || JSON.stringify(data) })
    };
    return { statusCode: 200, headers, body: JSON.stringify({ id: data.id }) };
  } catch (err) {
    console.error('Function error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
