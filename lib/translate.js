module.exports = function translate(i18n, string) {
    const lang = require('./../helpers/loadJson')(__dirname + '/../i18n/' + i18n + '.json');
    return lang[string];
}