const rp = require('request-promise');
// const fs = require('fs');

const callPlaylistAPI = {
  readPlaylist: (url) => {
    rp(url)
        .then((response) => {
          const rawPlaylists = response.items.map((playlist, index) => {
            return {
              index: index,
              playlist_id: playlist.id,
              playlist_name: playlist.name,
              tracks: playlist.tracks.href,
            };
          });
          return rawPlaylists;
        })
        .then((response) => {
          const parsedPlaylists = [];
          response.forEach((playlist) => {
            rp(`${playlist.tracks}`, {headers: url.headers, json: true})
                .then((response) => {
                  const tracks = response.items.map((item) => {
                    return {
                      album: item.track.album.name,
                      artists: item.track.artists.map((artist) => {
                        return {name: artist.name};
                      }),
                      track_title: item.track.name,
                    };
                  });
                  playlist.tracks = tracks;
                  parsedPlaylists.push(playlist);
                  return parsedPlaylists;
                });
          });
        }).catch((err) => {
          console.log('GET request failed', err);
        });
  },
};

module.exports = callPlaylistAPI;
