module.exports = async function(confPath, mainConf, cata) {
	let conf = await require('./loadConf')(confPath, cata);

	if(conf.apps instanceof Array) {
		let apps = [];

		for(let path of conf.apps) {
			apps.push(RC(_pa.parse(confPath).dir, path));
		}

		mainConf.apps = mainConf.apps.concat(apps);
	}

	if(conf.path && conf.path.log) {
		mainConf.path.log = RC(_pa.parse(confPath).dir, conf.path.log);
	}

	GG[cata].info(`加载 主[配置]: 路径{${confPath}}`);

	return conf;
};