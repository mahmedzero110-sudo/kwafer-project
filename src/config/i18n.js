const i18n = require('i18n');
const path = require('path');

i18n.configure({
    locales: ['ar', 'en'],
    directory: path.join(__dirname, '../locales'),
    defaultLocale: 'ar',
    cookie: 'lang',
    queryParameter: 'lang',
    objectNotation: true,
    updateFiles: false
});

module.exports = i18n;
