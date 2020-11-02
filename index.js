global.L = (console || undefined).log;

const logger = require('./libs/log');

async function Desire(confServ) {
	try {
		logger(confServ.name, confServ.log.level, confServ.log.path);

		// 解析参数
		let mainConf = { apps: [], path: {} };

		let lineer = await require('./libs/conf/loadLine')();

		let parseConf = require('./libs/conf/parseConf');
		let parseLine = require('./libs/conf/parseLine');

		if(lineer.config) {
			await parseConf(RD(lineer.config), mainConf, 'log');
		}
		else {
			if(lineer.args.length) {
				await parseLine(lineer, mainConf);
			}
			else {
				await parseConf(RD('config.js'), mainConf, 'log');
			}
		}

		// 加载服务器日志
		await GG.addCataServ(mainConf.path.log, mainConf.logLevel || 'all');

		if(mainConf.apps.length) {
			let text = '[应用路径]列表:\r\n';

			for(let path of mainConf.apps) {
				text += `\t${path}\r\n`;
			}

			GG.serv.info(text.replace(/\r\n$/, ''));
		}
		else {
			GG.serv.fatal('启动 [服务器]: 失败, 缺少[应用路径]');
		}

		// 加载应用
		let loadApp = require('./libs/app/load');

		for(let path of mainConf.apps) {
			GG.log.info('----------------------------');

			await loadApp(path, mainConf.path.log);
		}
	}
	catch(e) {
		LE(e);

		GG.serv.error(e.message);
	}
}

module.exports = Desire;