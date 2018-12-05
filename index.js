// 校验路径
let validPaths = function(rawPaths_) {
	let rawPaths = rawPaths_;

	let result = [];

	if(!rawPaths || !(rawPaths instanceof Array)) {
		GG.serv.error('校验 [应用路径]：错误，参数非数组');
	}

	for(let path of rawPaths) {
		try {
			let stat = _fs.statSync(path);

			if(stat.isDirectory()) {
				result.push(path);
			}
			else {
				GG.serv.warn(`校验 [应用路径]{${path}}：失败，路径非文件夹`);
			}
		} catch (error) {
			if(error.code == 'ENOENT') {
				GG.serv.warn(`校验 [应用路径]{${path}}：失败，路径不存在`);
			}
			else {
				throw error;
			}
		}
	}

	return result;
};
// 转换路径
let convertPaths = function(paths, dirPath) {
	let result = [];

	for(let path of paths) {
		path = J(dirPath, path);

		result.push(path);
	}

	return result;
};

// 加载配置
let initConfig = async function(configPath, lastConfig, isSkipPath = false) {
	let config;

	try {
		config = require(configPath);

		if(typeof config == 'function') {
			config = await config();
		}

		if(!config) {
			GG.serv.warn(`加载 [配置文件]{${configPath}}：错误，结果为[空]`);

			config = undefined;
		}
		else if(typeof config != 'object') {
			GG.serv.warn(`加载 [配置文件]{${configPath}}：错误，结果非[对象]`);

			config = undefined;
		}
	}
	catch(error) {
		if(error.code == 'MODULE_NOT_FOUND') {
			GG.serv.warn(`加载 [配置文件]{${configPath}}：失败，文件不存在`);
		}
		else {
			GG.serv.warn(`加载 [配置文件]{${configPath}}：错误，${error.message}`);
		}

		config = undefined;
	}
	// 覆盖配置
	if(config && lastConfig) {
		for(let key in config) {
			let value = config[key];

			if(key == 'path') {
				if(isSkipPath) {
					continue;
				}

				if(value instanceof Array && value.length > 0) {
					lastConfig.path = convertPaths(value, _pa.parse(configPath).dir);
				}
				else if(typeof value == 'string') {
					lastConfig.path = [value];
				}
				else {
					lastConfig.path = [];
				}
			}
			else if(key == 'serv') {
				let serv = lastConfig.serv;

				serv.host = value.host || serv.host;
				serv.port = ~~value.port || serv.port;
				serv.http2 = (typeof value.http2 == 'boolean' ? value.http2 : serv.http2);

				serv.cors = (typeof value.cors == 'boolean' ? value.cors : serv.cors);

				if(typeof value.http2 == 'boolean' && value.http2 && value.pems) {
					serv.pems = value.pems;
				}
			}
		}
	}
	else if(lastConfig) {
		return lastConfig;
	}
	else {
		return config;
	}
};

// 解析参数
let initParam = async function(lastConfig) {
	let configPathDefault = JD('./config');

	GG.serv.info(`加载 默认[配置文件]{${configPathDefault}}`);
	await initConfig(configPathDefault, lastConfig);

	let commander = require('commander');

	commander
		.version('2.0.0 alpha', '-v, --version')
		.usage('[options] <serv folders ...>')
		.option('-c, --config [path]', 'the specified js file of config')
		.parse(process.argv);

	if(commander.config) {
		let configPath = JC(commander.config);

		GG.serv.info(`加载 来自[命令行]的[配置文件]{${configPath}}`);

		await initConfig(configPath, lastConfig);
	}

	if(commander.args.length) {
		GG.serv.info('加载 来自[命令行]的[应用路径]');

		lastConfig.path = convertPaths(commander.args, P.cwd);
	}
	// 校验应用路径
	lastConfig.path = validPaths(lastConfig.path);
	// 单应用情况下，应用的配置会覆盖最终配置
	if(lastConfig.path.length == 1) {
		let configPathApp = J(lastConfig.path[0], 'config');

		GG.serv.info(`加载 [唯一应用]{${lastConfig.path[0]}}的[配置文件]`);

		await initConfig(configPathApp, lastConfig, true);
	}
};

// 加载服务
let initServ = async function(lastConfig) {
	GG.serv.info('加载 应用的[配置文件]');

	let nameApps = [];
	let configAppDict = {};

	// 预加载应用配置
	for(let path of lastConfig.path) {
		let configApp = await initConfig(J(path, 'config'));

		if(configApp) {
			let nameApp = configApp.name || _pa.parse(path).base;

			if(!configAppDict[nameApp]) {
				nameApps.push(nameApp);
				configAppDict[nameApp] = {
					path,
					config: configApp
				};
			}
			else {
				GG.serv.warn(`加载 [应用配置]{${path}}：跳过，存在相同名称的[应用]`);
			}
		}
	}

	if(!nameApps.length) {
		GG.serv.fatal('启动 [服务器]：失败，缺少有效的[应用路径]');

		process.exit(-1);
	}

	GG.serv.info('加载 [日志目录]');
	await GG.appendCatas(nameApps);

	let serv = await require('./libs/serv')(lastConfig);

	let countSuccess = 0;

	for(let nameApp in configAppDict) {
		GG.serv.info(`-------------- Serv 加载[应用]{${nameApp}} --------------`);

		let infoApp = configAppDict[nameApp];

		try {
			countSuccess += await serv.addApp(nameApp, infoApp.path, infoApp.config);
		} catch (error) {
			GG.serv.warn(`加载 [应用]{${infoApp.path}}：错误，${error.message}`);

			if(error.stack) {
				GG.serv.trace(error.stack);
			}
		}
	}

	if(!countSuccess) {
		GG.serv.fatal('启动 [服务器]：失败，缺少成功加载的[应用]');

		process.exit(-1);
	}
	else {
		// 启动服务
		serv.start();
	}
};

async function welcomeDesire() {
	try {
		await require('./libs/init')();
		GG.serv.info('-------------- Serv 加载环境 --------------');

		GG.serv.info('-------------- Serv 加载配置 --------------');

		let lastConfig = {
			path: [],

			serv: {
				host: '127.0.0.1',
				port: 80,

				http2: false,
				cors: false,
			}
		};

		await initParam(lastConfig);

		GG.serv.info('-------------- Serv 加载服务 --------------');

		if(!lastConfig.path.length) {
			GG.serv.fatal('启动 [服务器]：失败，缺少有效的[应用路径]');
		}
		else {
			initServ(lastConfig);
		}
	}
	catch(e) {
		GG.serv.error(e.message);
	}
}

welcomeDesire();