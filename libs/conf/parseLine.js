module.exports = async function(paramer, mainConf) {
	for(let path of paramer.args) {
		mainConf.apps.push(RC(path));
	}

	if(paramer.log) {
		mainConf.path.log = RC(paramer.log);
	}

	GG.log.info('加载 [命令行]');
};