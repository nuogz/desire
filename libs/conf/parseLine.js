module.exports = async function(paramer, mainConfig) {
	for(let path of paramer.args) {
		mainConfig.apps.push(RC(path));
	}

	if(paramer.log) {
		mainConfig.path.log = RC(paramer.log);
	}

	GG.log.info('加载 [命令行]');
};