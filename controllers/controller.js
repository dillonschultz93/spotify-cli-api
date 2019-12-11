const db = require('../db/index');
const callDate = require('./currentDate'); // Adds a timestamp to the database

// Set controllers
const controller = {
  addTokens: (token, refresh) => {
    return db.collection('spotify_credentials').doc('tokens').set({
      access_token: token,
      refresh_token: refresh,
      last_updated: callDate.currentDate(),
    }).then(() => {
      console.log('Tokens added to the database.');
    });
  },
};

module.exports = controller;
