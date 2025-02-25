// .netlify/functions/auth.js

const querystring = require('querystring');

exports.handler = async (event, context) => {
  // Extract code and state from query parameters (if any)
  const { code, state } = event.queryStringParameters || {};

  // Load Auth0 configuration from environment variables
  const auth0Domain = process.env.AUTH0_DOMAIN; // e.g., 'jtmancino.auth0.com'
  const clientId = process.env.AUTH0_CLIENT_ID;
  const clientSecret = process.env.AUTH0_CLIENT_SECRET;
  // The redirect URI should be the URL to this function.
  const redirectUri = process.env.AUTH0_CALLBACK_URL; // e.g., 'https://your-site.netlify.app/.netlify/functions/auth'

  if (!code) {
    // No code present, so start the OAuth flow by redirecting to Auth0's authorize endpoint.
    const params = querystring.stringify({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: 'openid profile email', // Adjust scopes as needed.
      state: 'some_secure_random_state'  // In production, generate a secure random value and validate it on return.
    });
    const authUrl = `https://${auth0Domain}/authorize?${params}`;
    return {
      statusCode: 302,
      headers: {
        Location: authUrl
      },
      body: ''
    };
  } else {
    // Code is present; exchange it for tokens.
    const tokenUrl = `https://${auth0Domain}/oauth/token`;
    const payload = {
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      redirect_uri: redirectUri
    };

    try {
      const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        return {
          statusCode: tokenResponse.status,
          body: errorText
        };
      }
      const tokenData = await tokenResponse.json();

      // At this point, tokenData will contain tokens (e.g., access_token, id_token, etc.).
      // You might want to do additional processing here (e.g., set a cookie or redirect the user).

      // For demonstration, we're just returning the token data as JSON.
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tokenData)
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      };
    }
  }
};
