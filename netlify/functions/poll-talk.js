const https = require('https');

const DID_API_KEY = 'bWFvYW1hYW5AZ21haWwuY29t:RMgkc1QkKRJGs1mHOok4D';

function httpsRequest(url, options) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'GET',
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
    const { talkId } = JSON.parse(event.body);

    const result = await httpsRequest(`https://api.d-id.com/talks/${talkId}`, {
      headers: {
        'Authorization': `Basic ${DID_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    console.log('D-ID poll status:', result.status, 'body:', JSON.stringify(result.body));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: result.body.status,
        result_url: result.body.result_url || null,
        error: result.body.error || null
      })
    };
  } catch (err) {
    console.error('poll-talk error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
