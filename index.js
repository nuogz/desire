const Desire = async function(C, ronf) {
	const G = Desire.G;

	const loadServ = require('./libs/serv');

	G.info('系统', '----------------------------');

	try {
		await loadServ(C, G, ronf);

		G.info('系统', '✔');
	}
	catch(error) {
		G.fatal('系统', `启动 [应用]{${C.name}} 失败`, error);
	}

	G.info('系统', '----------------------------');
};

Desire.initLogger = function(nameLog, levelLog, pathSave = null) {
	const logger = require('./libs/log');

	const G = logger(nameLog || 'default', levelLog || 'all', pathSave);

	G.info('日志', '✔', `保存路径{${pathSave}}`);

	return Desire.G = G;
};

module.exports = Desire;