var request     =   require('request');
var cheerio     =   require('cheerio');
var Promise     =   require('promise');
var winston     =   require('winston');

exports.scrape = function (url) {
    winston.log('debug', 'Scrapper start', {
        url: url
    });
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

                      var result = {
                          artist: artist.text().replace(" LYRICS", ""),
                          title: title.text().replace(/^"(.*)"$/, '$1'),
                          url: url
                      };

                      winston.log('debug', 'Scrapper success', {
                          result: result
                      });

                      done(result);
                  }
                  catch (e){
                      winston.log('debug', 'Scrapper error', {
                          err: e
                      });
                      done(null);
                  }
              }
          })
    })
};