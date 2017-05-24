module.exports = async() => {
	global.fs = require('fs');
	global.path = require('path');
	global.qs = require('querystring');
	global.URL = require('url');

	global._c = console;
	global._l = _c.log;
	global._d = path.join(__dirname, '..');

	global.CleanCSS = require('clean-css');
	global.UglifyJS = require('uglify-js');
	global.Request = require('request');
};