var request     =   require('request');
var cheerio     =   require('cheerio');
var Promise     =   require('promise');

exports.scrape = function (url) {
  return new Promise(function (done, fail) {
      request(url, function(error, response, html){
          if(error) {
              fail(error);
          }
          else{
              try{
                  var $ = cheerio.load(html);

                  var artist = $('.lyricsh h2');
                  var title =  $('.lyricsh').next().next();

                  done({
                      artist: artist.text().replace(" LYRICS", ""),
                      title: title.text().replace(/^"(.*)"$/, '$1'),
                      url: url
                  });
              }
              catch (e){
                  done(null);
              }
          }
      })
  })
};