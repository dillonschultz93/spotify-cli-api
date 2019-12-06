const db = require('../db/index');
const config = require('../config/config');
const callDate = require('./currentDate'); // Adds a timestamp to the database
// const callPlaylistAPI = require('./api');

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
  // Function to call the database
  showPlaylists: () => {
    db.collection('spotify_credentials').doc('tokens').get().then((doc) => {
      if (!doc.exists) {
        console.log('No such document exists');
      } else {
        const data = doc.data();
        const playlistURL = {
          url: `https://api.spotify.com/v1/users/${config.userID}/playlists?offset=0&limit=50`,
          headers: {'Authorization': 'Bearer ' + data.access_token},
          json: true,
        };
      }
    }).catch((err) => {
      console.log('Error getting document', err);
    });
  },
};

module.exports = controller;
