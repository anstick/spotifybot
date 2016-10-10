var SpotifyWebApi   =   require('spotify-web-api-node');
var Song            =   require('../models/song');
var Promise         =   require('promise');

var spotifyApi = new SpotifyWebApi();

module.exports.search = function (artist, song) {
  return new Promise(function (done, fail) {
      spotifyApi
          .searchTracks("track:" +song+" artist:"+artist,{
            limit:1
          })
          .then(function(data) {
              if (data.body.tracks){
                  if (data.body.tracks.items.length === 0){
                      done(null);
                  }else{
                      try{
                          var track = data.body.tracks.items[0];
                          var song = new Song(
                              track.name,
                              track.artists[0].name,
                              track.album.images && track.album.images.length? track.album.images[0].url: null,
                              'http://open.spotify.com/track/' + track.uri.split(':')[2],
                              track.preview_url,
                              track
                          );
                          done(song);
                      }
                      catch (e){
                          fail(e);
                      }
                  }
              }
              else{
                  fail(null);
              }

          }, function(err) {
              fail(err);
          });
  });
};