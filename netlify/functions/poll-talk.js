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
    const { talkId } = JSON.parse(event.body);
    const authToken = Buffer.from(`${DID_EMAIL}:${DID_KEY}`).toString('base64');

    const res = await fetch(`https://api.d-id.com/talks/${talkId}`, {
      headers: {
        'Authorization': `Basic ${authToken}`,
        'Accept': 'application/json'
      }
    });
    const data = await res.json();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ status: data.status, result_url: data.result_url || null, error: data.error || null })
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
