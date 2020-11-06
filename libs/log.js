const L = (console || undefined).log;
const PA = require('path');

module.exports = function(nameLog, levelLog, pathSave = null) {
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

	let loggerStack;

	const logFormatterConsole = function({ startTime, level: { colour, levelStr }, data: datas }) {
		const time = Moment(startTime).format('YYYY-MM-DD HH:mm:ss:SSS');
		const color = colour;
		const level = levelStrCH[levelStr];
		const system = datas[0];

		const texts = [];
		const errors = [];
		for(let i = 1; i < datas.length; i++) {
			const data = datas[i];

			if(data instanceof Error || (data.stack && data.message)) {
				errors.push(data);

				texts.push(String(data.message).trim());
			}
			else if(data.message) {
				texts.push(String(data.message).trim());
			}
			else {
				texts.push(String(data).trim());
			}
		}

		const textHighlight = colorful(texts.join('\n\t'));

		const textFinal = Chalk[color](`[${time}][${level}][${nameLog}] > [${system}] ${textHighlight}`);

		if(errors.length) {
			loggerStack[levelStr.toLowerCase()](
				[
					textFinal,
					'---------------',
					errors
						.map(error => `${Chalk[color](error.message)}\n${error.stack.replace(/ {4}/g, '\t')}${error.data ? `${error.data}` : ''}`)
						.join('\n--------------\n'),
					'---------------',
				].join('\n')
			);
		}

		return textFinal;
	};
	const logFormatterFile = function({ startTime, level: { colour, levelStr }, data: datas }) {
		const time = Moment(startTime).format('YYYY-MM-DD HH:mm:ss:SSS');
		const color = colour;
		const level = levelStrCH[levelStr];
		const system = datas[0];

		const texts = [];
		const errors = [];
		for(let i = 1; i < datas.length; i++) {
			const data = datas[i];

			if(data instanceof Error || (data.stack && data.message)) {
				errors.push(data);

				texts.push(String(data.message).trim());
			}
			else if(data.message) {
				texts.push(String(data.message).trim());
			}
			else {
				texts.push(String(data).trim());
			}
		}

		const textHighlight = colorful(texts.join('\n\t'));

		return Chalk[color](`[${time}][${level}][${nameLog}] > [${system}] ${textHighlight}`);
	};

	if(!pathSave) {
		return L(logFormatterConsole({
			level: { colour: 'yellow', levelStr: 'WARN' },
			data: ['日志', '路径未定义, 退出日志系统']
		}));
	}

	Log4js.addLayout('colorConsole', function() { return logFormatterConsole; });

	Log4js.configure({
		appenders: {
			console: {
				type: 'console',
				layout: { type: 'colorConsole' }
			},
			file: {
				type: 'file',
				filename: PA.join(pathSave, nameLog + '.log'),
				maxLogSize: 20971520,
				layout: { type: 'pattern', pattern: '%x{message}', tokens: { message: logFormatterFile } }
			},
			fileStack: {
				type: 'file',
				filename: PA.join(pathSave, nameLog + '.stack.log'),
				maxLogSize: 20971520,
				layout: { type: 'basic', }
			},
			stack: {
				type: 'logLevelFilter',
				appender: 'fileStack',
				level: 'error'
			}
		},
		categories: {
			default: { appenders: ['console', 'file'], level: levelLog },
			stack: { appenders: ['stack'], level: levelLog },
		},
		pm2: true
	});

	loggerStack = Log4js.getLogger('stack');

	return Log4js.getLogger('default');
};