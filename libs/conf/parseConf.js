module.exports = async function(configPath, mainConfig, cata) {
	let config = await require('./loadConf')(configPath, cata);

	if(config.apps instanceof Array) {
		mainConfig.apps = mainConfig.apps.concat(config.apps);
	}

	if(config.path && config.path.log) {
		mainConfig.path.log = RC(config.path.log);
	}

	GG[cata].info(`加载 主[配置]: 路径{${configPath}}`);

	return config;
};