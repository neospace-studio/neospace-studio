const DID_API_KEY = 'bWFvYW1hYW5AZ21haWwuY29t:RMgkc1QkKRJGs1mHOok4D';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    const { talkId } = JSON.parse(event.body);

    const res = await fetch(`https://api.d-id.com/talks/${talkId}`, {
      headers: {
        'Authorization': `Basic ${DID_API_KEY}`,
        'Accept': 'application/json'
      }
    });
    const data = await res.json();
    console.log('D-ID poll response:', JSON.stringify(data));
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ status: data.status, result_url: data.result_url || null, error: data.error || null })
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
