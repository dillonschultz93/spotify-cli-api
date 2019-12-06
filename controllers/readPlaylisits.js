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

    // ========================================================================
    // DON'T ERASE BELOW

    // rp(url, (error, response, body) => {
    //   if (!error && response.statusCode === 200) {
    //     body.items.forEach((element, index) => {
    //       playlists.push({
    //         index: index,
    //         playlist_id: element.id,
    //         playlist_name: element.name,
    //         tracks: element.tracks.href,
    //       });
    //     });
    //     return playlists;
    //   } else {
    //     console.log('get request not valid', error);
    //   }
    // }) .then(() => {
    //   playlists.forEach((playlist) => {
    //     rp({
    //       url: `${playlist.tracks}?offset=0&limit=100`,
    //       headers: url.headers,
    //       json: true,
    //     }, (error, response, body) => {
    //       if (!error && response.statusCode === 200) {
    //         const tracks = body.items.map((item) => {
    //           return {
    //             album: item.track.album.name,
    //             artist: item.track.artists.map((artist) => {
    //               return {name: artist.name};
    //             }),
    //             track_title: item.track.name,
    //           };
    //         });
    //         playlist.tracks = tracks;
    //         return playlists;
    //       } else {
    //         console.log('GET request was invalid');
    //       }
    //     });
    //   });
    //   console.log(playlists[0].tracks.length);
    //   return playlists;
    // });
    // console.log(playlists);
  },
};

module.exports = callPlaylistAPI;
