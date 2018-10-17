module.exports = async function() {
	// Node模块 下划线 + 2~4个小写字母
	global._fs = require('fs');
	global._pa = require('path');
	global._qs = require('querystring');
	global._ul = require('url');
	global._os = require('os');
	global._cr = require('crypto');
	// 第三方模块 大写开头的英文单词

	// 常用全局功能 1~2个大写字母
	global.J = global._pa.resolve;
	global.L = global.console.log;
	global.LE = global.console.error;

	global.P = {
		cwd: process.cwd(),
		dir: J(__dirname, '..')
	};

	global.E = {
		Chalk: require('chalk'),
		Moment: require('moment')
	};

	E.Moment.locale('zh-cn');

	global.JC = function(...paths) { return global.J(P.cwd, ...paths); };
	global.JD = function(...paths) { return global.J(P.dir, ...paths); };

	// 初始化日志
	global.G = require('./log');
};