const config = require('../config/config');
const request = require('request');
const querystring = require('querystring');
const router = require('express').Router();
const controller = require('../controllers/controller');

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */

// Generating a random number for the cookie state
const generateRandomString = (length) => {
  let text = '';
  const possibleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
  }
  return text;
};

// Setting up cookie state
const stateKey = 'spotify_auth_state';

// Setting up routes
// Login Route
router.get('/login', (req, res) => {
  const state = generateRandomString(16);
  res.cookie(stateKey, state);

  const scope = 'playlist-read-private';
  res.redirect('https://accounts.spotify.com/authorize?' +
      querystring.stringify({
        response_type: 'code',
        client_id: config.clientID,
        scope: scope,
        redirect_uri: config.redirectURI,
        state: state,
      }));
});

// Callback Route
router.get('/callback', (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;
  const storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
        querystring.stringify({
          error: 'state_mismatch',
        }));
  } else {
    res.clearCookie(stateKey);
    const authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: config.redirectURI,
        grant_type: 'authorization_code',
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(config.clientID + ':' + config.clientSecret).toString('base64')),
      },
      json: true,
    };

    request.post(authOptions, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const accessToken = body.access_token;
        const refreshToken = body.refresh_token;
        controller.addTokens(accessToken, refreshToken);
      } else {
        res.redirect('/#' + querystring.stringify({
          error: 'invalid_token',
        }));
      }
    });
  }
});

router.get('/refresh_token', (req, res) => {

});

module.exports = router;
