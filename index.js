const Desire = async function(C) {
	const G = Desire.G;

	const loadServ = require('./libs/serv');

	G.info('服务', '----------------------------');

	try {
		await loadServ(C, G);

		G.info('服务', '✔', `监听地址{${C.http2.enabled ? 'http2' : 'http'}://${C.host}:${C.port}}`);
	}
	catch(error) {
		G.fatal('服务', `启动 [服务]{${C.name}}`, error);
	}

	G.info('服务', '----------------------------');
};

Desire.initLogger = function(nameLog, levelLog, pathSave = null) {
	const logger = require('./libs/log');

	const G = logger(nameLog || 'default', levelLog || 'all', pathSave);

	G.info('日志', '✔', `保存路径{${pathSave}}`);

	return Desire.G = G;
};

module.exports = Desire;