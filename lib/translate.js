module.exports = function translate(lang = 'en', string) {
    const lang = require('./../helpers/loadJson')(__dirname + '/../i18n/' + lang + '.json');
    return lang[string];
}