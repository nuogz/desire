module.exports = async function(confPath, mainConf, cata) {
	let conf = await require('./loadConf')(confPath, cata);

	if(conf.apps instanceof Array) {
		mainConf.apps = mainConf.apps.concat(conf.apps);
	}

	if(conf.path && conf.path.log) {
		mainConf.path.log = RC(conf.path.log);
	}

	GG[cata].info(`加载 主[配置]: 路径{${confPath}}`);

	return conf;
};