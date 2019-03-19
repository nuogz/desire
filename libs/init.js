module.exports = async function() {
	// Node模块 下划线 + 2~4个小写字母
	global._fs = require('fs');
	global._pa = require('path');
	global._qs = require('querystring');
	global._ul = require('url');
	global._os = require('os');
	global._cr = require('crypto');

	// 常用全局功能 1~2个大写字母
	global.L = global.console.log;
	global.LE = global.console.error;

	global.R = global._pa.resolve;

	global.P = {
		// 当前工作目录
		cwd: process.cwd(),
		// 程序目录
		dir: R(__dirname, '..')
	};

	global.RC = function(...paths) { return global.R(P.cwd, ...paths); };
	global.RD = function(...paths) { return global.R(P.dir, ...paths); };

	global.E = {
		Moment: require('moment')
	};

	E.Moment.locale('zh-cn');
	E.Moment.defaultFormat = 'YYYY-MM-DD HH:mm:ss';

	await require('./log')();
};