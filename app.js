const fs = require('fs');
const inquirer = require('inquirer');
// const fs = require('fs');
const open = require('open');
const db = require('./db/index');
const config = require('./config/config');
const rp = require('request-promise');

// Setting up inquirer
const initalPrompts = {
  type: 'list',
  name: 'initial',
  message: 'What do you want to do?',
  choices: ['Sign in to Spotify', 'Exit'],
};

const readPlaylists = {
  type: 'list',
  name: 'readPlaylists',
  message: 'Now that you are signed in, what do you want to do?',
  choices: ['Save my playlist data', 'Exit'],
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

const savePlaylist = async ({playlists, db}) => {
  await db.collection('playlists').doc('user_playlists')
      .set({playlists});
};

// Initial statup of the CLI app

const startApp = async () => {
  inquirer.prompt(initalPrompts).then((answers) => {
    if (answers.initial === 'Sign in to Spotify') {
      console.log('Redirecting to Spotify');
      console.log('----------------------');
      console.log('Return to this terminal after signing in');
      open('http://localhost:8888/login/', {app: 'google chrome'});
      afterLogin();
    } else {
      console.log('Goodbye!');
      return;
    }
  });
};

const afterLogin = () => {
  inquirer.prompt(readPlaylists).then(async (answers) => {
    if (answers.readPlaylists === 'Save my playlist data') {
      console.log('Fetching playlist data...');
      console.log('Saving data to a .json file');
      console.log('Saving data to the database');
      const parsedPlaylist = await getTracks(url);
      // Save data to a .json file and to the database
      // eslint-disable-next-line max-len
      fs.writeFileSync('playlist.json', JSON.stringify(parsedPlaylist, null, 2));
      await savePlaylist({playlists: parsedPlaylist, db});
      console.log('Saved 💾');
    } else {
      console.log('Goodbye!');
      return;
    }
  });
};

startApp();
