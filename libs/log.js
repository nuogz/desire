module.exports = async function(name, level, defaultPath = null) {
	const Log4js = require('log4js');
	const Chalk = require('chalk');
	const Moment = require('moment');

	const levelStrCH = {
		ALL: '信息',
		TRACE: '跟踪', DEBUG: '调试', INFO: '信息', WARN: '警告',
		ERROR: '错误', FATAL: '致命', MARK: '标记',
		OFF: '关闭',
	};

	const chalkTextWord = Chalk.inverse.bold('$1');
	const chalkTextValue = Chalk.white('[$1]');

	const colorful = function(str) {
		return str
			.replace(/\[(.*?)\]/g, chalkTextWord)
			.replace(/\{(.*?)\}/g, chalkTextValue);
	};

	const logFormatter = function(logEvent) {
		const time = Moment(logEvent.startTime).format('YYYY-MM-DD HH:mm:ss:SSS');
		const color = logEvent.level.colour;
		const levelStr = levelStrCH[logEvent.level.levelStr];
		const system = logEvent.data[0];
		const colorText = colorful(logEvent.data.slice(1).join('\n'));

		return Chalk[color](`[${time}][${levelStr}][${logEvent.categoryName}] ==> [${system}] ${colorText}`);
	};

	if(!defaultPath) {
		return L(logFormatter({
			categoryName: '默认',
			level: { colour: 'yellow', levelStr: 'WARN' },
			data: ['日志', '路径未定义, 退出日志系统']
		}));
	}

	Log4js.addLayout('colorConsole', function() { return logFormatter; });

	const appenders = {
		console: {
			type: 'console',
			layout: {
				type: 'colorConsole'
			}
		},
		file: {
			type: 'multiFile',
			base: defaultPath,
			property: 'categoryName',
			extension: '.log',
			maxLogSize: 20971520,
			layout: {
				type: 'pattern',
				pattern: '[%d{yyyy-MM-dd hh:mm:ss:SSS}]%x{message}',
				tokens: {
					message(logEvent) {
						const levelStr = levelStrCH[logEvent.level.levelStr];
						const system = logEvent.data[0];
						const colorText = colorful(logEvent.data.slice(1).join('\n'));
				
						return `[${levelStr}][${logEvent.categoryName}] ==> [${system}] ${colorText}`;
					}
				}
			}
		}
	};

	const categories = {
		default: { appenders: ['console'], level: 'all' },
		[name]: { appenders: ['console', 'file'], level }
	};


	Log4js.configure({
		appenders,
		categories,
		pm2: true
	});

	global.G = Log4js.getLogger(name);

	G.info('日志', '测试');

	return Log4js.getLogger('default').info('日志', `已加载, 路径: [${defaultPath}]`);
};