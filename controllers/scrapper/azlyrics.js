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
                  done({
                      artist: $('.lyricsh h2').text().replace(" LYRICS", ""),
                      title: $('.lyricsh').next().next().text().replace(/^"(.*)"$/, '$1'),
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