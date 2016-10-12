var fs  =   require('fs');
var _   =   require('underscore');

const dict = JSON.parse(fs.readFileSync('dictionary.json', 'utf8'));

function getValues(key) {
    if (_.has(dict,key)){
        return dict[key];
    }
    return undefined;
}

module.exports = {
    getValues: getValues,
    getRandomValue: function (key) {
        var values = getValues(key);
        if (_.isArray(values) && !_.isEmpty(values)){
            return values[Math.floor(Math.random()*values.length)];
        }
        return undefined;
    }
};