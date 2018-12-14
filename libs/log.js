module.exports = async function() {
	let log4js = require('log4js');
	let Chalk = require('Chalk');
	let Moment = require('Moment');

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

	let chalkTextWord = Chalk.inverse.bold('$1');
	let chalkTextValue = Chalk.white('[$1]');

	let colorful = function(str) {
		return str
			.replace(/\[(.*?)\]/g, chalkTextWord)
			.replace(/\{(.*?)\}/g, chalkTextValue);
	};

	log4js.addLayout('colorConsole', function() {
		return function(logEvent) {
			let time = Moment().format('YYYY-MM-DD HH:mm:ss:SSS');
			let color = logEvent.level.colour;
			let levelStr = levelStrCH[logEvent.level.levelStr];
			let colorText = colorful(logEvent.data.join('\n'));

			return Chalk[color](`[${time}][${levelStr}][${logEvent.categoryName}]: ${colorText}`);
		};
	});

	let appenders = {
		console: {
			type: 'console',
			layout: {
				type: 'colorConsole'
			}
		},
	};

	let categories = {
		default: { appenders: [ 'console' ], level: 'all' }
	};

	let conf = {
		appenders,
		categories,
		pm2: true
	};

	log4js.configure(conf);

	let defaultPath = RC('./logs');

	global.GG = {
		addCata: async function(cata, cataPath = defaultPath) {
			appenders[cata] = {
				type: 'multiFile',
				base: cataPath,
				property: 'categoryName',
				extension: '.log',
				maxLogSize: 20971520,
				layout: {
					type: 'pattern',
					pattern: '[%d{yyyy-MM-dd hh:mm:ss:SSS}][%p][%c]: %m'
				}
			};

			categories[cata] = { appenders: [ 'console', cata ], level: 'all' };

			return new Promise(function(resolve) {
				log4js.shutdown(function() {
					log4js.configure(conf);

					GG[cata] = log4js.getLogger(cata);

					GG.log.info(`添加 [日志]分类{${cata}}, 目录{${cataPath}}`);

					resolve(GG[cata]);
				});
			});
		},
		addCataServ: async function(cataPath = defaultPath) {
			await GG.addCata('serv', cataPath);

			defaultPath = cataPath;
		},
		log: log4js.getLogger('default')
	};

	GG.log.info('加载 [日志]');

	return;
};