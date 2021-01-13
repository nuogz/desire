module.exports = function(nameLog = 'default', levelLog = 'all', pathSave = null, isColorText = true) {
	const PA = require('path');

	const Log4js = require('log4js');
	const Chalk = require('chalk');
	const Moment = require('moment');

	const levelStrCH = {
		ALL: '信息',
		TRACE: '跟踪', DEBUG: '调试', INFO: '信息', WARN: '警告',
		ERROR: '错误', FATAL: '致命', MARK: '标记',
		OFF: '关闭',
	};

	const chalkTextWord = Chalk.underline.bold('$1');
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
		const action = datas[1];

		const texts = [];
		const errors = [];
		for(let i = 2; i < datas.length; i++) {
			const data = datas[i];

			if(data === undefined) { continue; }

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

		const textHighlight = isColorText ? colorful(texts.join('\n\t')) : texts.join('\n\t');
		const systemHighlight = isColorText ? colorful(system) : system;
		const actionHighlight = isColorText ? colorful(action) : action;

		const textFinal = Chalk[color](
			`[${time}][${level}][${nameLog}] ${systemHighlight}` +
			(action ? ` >  ${actionHighlight}` : '') +
			(texts.length ? `  ${textHighlight}` : '')
		);

		if(errors.length) {
			loggerStack[levelStr.toLowerCase()](
				[
					textFinal,
					'\n-------------- Stack --------------',
					errors
						.map(error => `${Chalk[color](error.message)}\n${error.stack.replace(/ {4}/g, '\t')}${error.data ? `${error.data}` : ''}`)
						.join('\n--------------\n'),
					'\n\n==============================\n\n',
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

			if(data === undefined) { continue; }

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

		const textHighlight = isColorText ? colorful(texts.join('\n\t')) : texts.join('\n\t');
		const systemHighlight = isColorText ? colorful(system) : system;

		return Chalk[color](`[${time}][${level}][${nameLog}] ${systemHighlight} > ${textHighlight}`);
	};

	Log4js.addLayout('colorConsole', function() { return logFormatterConsole; });

	const appenders = pathSave ?
		{
			console: {
				type: 'console',
				layout: { type: 'colorConsole' }
			},
			file: {
				type: 'file',
				filename: PA.join(pathSave, nameLog + '.log'),
				maxLogSize: 1024 * 1024 * 20,
				layout: { type: 'pattern', pattern: '%x{message}', tokens: { message: logFormatterFile } }
			},
			fileStack: {
				type: 'file',
				filename: PA.join(pathSave, nameLog + '.stack.log'),
				maxLogSize: 1024 * 1024 * 20,
				layout: { type: 'pattern', pattern: '%m' }
			},
			stack: {
				type: 'logLevelFilter',
				appender: 'fileStack',
				level: 'all'
			}
		} :
		{
			console: {
				type: 'console',
				layout: { type: 'colorConsole' }
			},
			stack: {
				type: 'console',
			},
		};

	Log4js.configure({
		appenders,
		categories: {
			default: { appenders: pathSave ? ['console', 'file'] : ['console'], level: levelLog },
			stack: { appenders: ['stack'], level: levelLog },
		},
		pm2: true
	});

	loggerStack = Log4js.getLogger('stack');

	const logger = Log4js.getLogger('default');
	logger.info('日志', '加载', pathSave ? `✔  日志路径{${pathSave}}` : '✔');

	return logger;
};