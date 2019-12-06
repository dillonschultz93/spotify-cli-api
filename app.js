const inquirer = require('inquirer');
// const fs = require('fs');
const open = require('open');
// const controller = require('./controllers/controller');
const db = require('./db/index');
const config = require('./config/config');
const rp = require('request-promise');

// Setting up inquirer
const initalPrompts = {
  type: 'list',
  name: 'initial',
  message: 'What do you want to do?',
  choices: ['Login', 'Refresh Tokens'],
};

const readPlaylists = {
  type: 'list',
  name: 'readPlaylists',
  message: 'Now that you have your tokens, what do you want to do?',
  choices: ['Show my playlists', 'Exit'],
};

// Global Variables
let url;

// Getting Spotify keys and create an initial url
db.collection('spotify_credentials')
    .doc('tokens')
    .get()
    .then((doc) => {
      if (!doc.exists) {
        console.log('No such document exists');
      } else {
        const data = doc.data();
        url = {
          url: `https://api.spotify.com/v1/users/${config.userID}/playlists?offset=0&limit=50`,
          headers: {Authorization: 'Bearer ' + data.access_token},
          json: true,
        };
        return url;
      }
    })
    .catch((err) => {
      console.log('Error getting document', err);
    });

// A function that calls the Spotify Playlist API endpoint
const callSpotify = (passedURL, passedHeader, passedParsingOption) => {
  return rp({
    url: passedURL,
    headers: passedHeader,
    json: passedParsingOption,
  });
};

// A function that makes a playlist object for each playlist that the user owns
const processPlaylists = async ({url, headers, json}) => {
  const rawData = await callSpotify(url, headers, json);
  return rawData.items.map((playlist, index) => ({
    index: index,
    playlist_id: playlist.id,
    playlist_name: playlist.name,
    tracks: playlist.tracks.href,
  }));
};

// A function that maps through the user's playlist objects,
// calls the Spotify API, and builds track objects for each object
const getTracks = async (url) => {
  const trackData = await processPlaylists(url);
  return Promise.all(trackData.map(async (playlist) => {
    const {tracks: trackUrl} = playlist;

    const tracks = await callSpotify(trackUrl, url.headers, url.json);

    const parsedTracks = tracks.items.map(({track}, index) => {
      const {album, artists} = track;
      return {
        album: album.name,
        artists: artists.map(({name}) => ({name})),
        track_title: track.name,
        track_index: index,
      };
    });

    return {
      ...playlist,
      tracks: parsedTracks,
    };
  }));
};

const savePlaylist = async ({playlist, db}) => {
  await db.collection('playlists')
      .add({playlist});
};

// Initial statup of the CLI app

const startApp = async () => {
  // console.log('Redirecting to Spotify');
  // open('http://localhost:8888/login/', {app: 'google chrome'});
  // const parsedPlaylist = await getTracks(url);
  // fs.writeFileSync('playlist.json', JSON.stringify(parsedPlaylist, null, 2));
  // console.log('💾 Playlists saved to a .json file 💾');

  inquirer.prompt(initalPrompts).then((answers) => {
    if (answers.initial === 'Login') {
      console.log('Redirecting to Spotify');
      open('http://localhost:8888/login/', {app: 'google chrome'});
      afterLogin();
    } else {
      console.log('This will be coded later');
    }
  });
};

const afterLogin = () => {
  inquirer.prompt(readPlaylists).then(async (answers) => {
    if (answers.readPlaylists === 'Show my playlists') {
      console.log('Getting playlist data...');
      // controller.showPlaylists();
      const parsedPlaylist = await getTracks(url);

      require('fs').writeFileSync('playlist.json', JSON.stringify(parsedPlaylist, null, 2));
      // await savePlaylist({playlist: parsedPlaylist, db});
      // console.log('Saved!');
    } else {
      console.log('Goodbye!');
      return;
    }
  });
};

startApp();
