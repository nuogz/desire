let log4js = require('log4js');

let levelStrCH = {
	ALL: '信息',
	TRACE: '跟踪',
	DEBUG: '调试',
	INFO: '信息',
	WARN: '警告',
	ERROR: '错误',
	FATAL: '致命',
	MARK: '标记',
	OFF: '关闭',
};

let chalkTextWord = E.Chalk.inverse.bold('$1');
let chalkTextValue = E.Chalk.white('[$1]');

let colorful = function(str) {
	return str
		.replace(/\[(.*?)\]/g, chalkTextWord)
		.replace(/\{(.*?)\}/g, chalkTextValue);
};

log4js.addLayout('colorConsole', function() {
	return function(logEvent) {
		let time = E.Moment().format('YYYY-MM-DD HH:mm:ss:SSS');
		let color = logEvent.level.colour;
		let levelStr = levelStrCH[logEvent.level.levelStr];
		let colorText = colorful(logEvent.data.join('\n'));

		return E.Chalk[color](`[${time}][${levelStr}][${logEvent.categoryName}]: ${colorText}`);
	};
});

let categories = {
	default: { appenders: [ 'console' ], level: 'all' },
	serv: { appenders: [ 'console', 'file' ], level: 'all' },
};

let config = {
	appenders: {
		console: {
			type: 'console',
			layout: {
				type: 'colorConsole'
			}
		},
		file: {
			type: 'multiFile',
			base: 'logs/',
			property: 'categoryName',
			extension: '.log',
			maxLogSize: 20971520,
			layout: {
				type: 'pattern',
				pattern: '[%d{yyyy-MM-dd hh:mm:ss:SSS}][%p][%c]: %m'
			}
		}
	},
	categories,
	pm2: true
};

log4js.configure(config);

module.exports = {
	appendCatas: async function(catas) {
		for(let cata of catas) {
			categories[cata] = { appenders: [ 'console', 'file' ], level: 'all' };
		}

		await new Promise(function(resolve) {
			log4js.shutdown(function() {
				log4js.configure(config);

				G.serv = log4js.getLogger('serv');

				for(let cata of catas) {
					G[cata] = log4js.getLogger(cata);
				}

				resolve();
			});
		});
	},
	serv: log4js.getLogger('serv'),
};