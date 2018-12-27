let loadConf = require('../conf/loadConf');
let loadServ = require('./serv');

module.exports = async function(pathApp, pathLog) {
	// 应用配置
	let C = await loadConf(R(pathApp, 'config.js'));

	if(!C) { return false; }

	if(!C.path) {
		C.path = { log: pathLog };
	}
	else if(!C.path.log) {
		C.path.log = pathLog;
	}

	C.path.app = pathApp;

	// 配置路径绝对化
	for(let key in C.path) {
		if(typeof C.path[key] == 'string') {
			C.path[key] = R(pathApp, C.path[key]);
		}
	}

	// 应用名称
	if(!C.name) {
		C.name = _pa.parse(pathApp).base;
	}

	// 应用日志
	let G = await GG.addCata(C.name, C.path.log, C.logLevel || 'all');

	try {
		await loadServ(C, G);

		GG.serv.info(`启动 [应用]{${C.name}}: 成功`);
	} catch (error) {
		GG.serv.warn(`启动 [应用]{${C.name}}: 错误, 路径{${pathApp}}, 原因: ${error.message}`);

		if(error.stack) {
			GG.serv.trace(error.stack);
		}
	}

	GG.log.info('----------------------------');
};