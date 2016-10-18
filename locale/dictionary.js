var fs      =   require('fs');
var _       =   require('underscore');
var path    =   require('path');

const dict = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'dictionary.json'), 'utf8'));

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