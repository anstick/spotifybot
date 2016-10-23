var request     =   require('request');
var cheerio     =   require('cheerio');
var Promise     =   require('promise');
var winston     =   require('winston');
var utils       =   require('../../utils/search');

exports.scrape = function (url, originalQuery) {
    winston.log('debug', 'Scrapper start', {
        url: url
    });
    return new Promise(function (done) {
          request(url, function(error, response, html){
              try {
                  if (error) {
                      throw error;
                  }
                  else {
                      if (response.statusCode !== 200){
                        throw new Error('Scrapper return HTTP' + response.statusCode);
                      }
                      var $ = cheerio.load(html);

                      var artist = $('.lyricsh h2');
                      var title = $('.lyricsh').next().next();
                      var txt = title.next().next().next();

                      var result = {
                          artist: artist.text().replace(" LYRICS", ""),
                          title: title.text().replace(/^"(.*)"$/, '$1'),
                          coincidence: utils.coincidence(originalQuery, txt.text()),
                          url: url
                      };

                      winston.log('debug', 'Scrapper success', {
                          result: result
                      });

                      done(result);
                  }
              }
              catch (e){
                  winston.log('error', 'Scrapper error', {
                      err: e
                  });
                  done(null);
              }
          })
    })
};