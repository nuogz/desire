module.exports = async function(confPath, cata = 'serv') {
	let conf;

	try {
		conf = require(confPath);

		if(typeof conf == 'function') {
			conf = await conf();
		}

		if(!conf) {
			GG[cata].warn(`加载 [配置文件]{${confPath}}: 错误, 结果为[空]`);

			conf = undefined;
		}
		else if(typeof conf != 'object') {
			GG[cata].warn(`加载 [配置文件]{${confPath}}: 错误, 结果非[对象]`);

			conf = undefined;
		}
	}
	catch(error) {
		if(error.code == 'MODULE_NOT_FOUND') {
			GG[cata].warn(`加载 [配置文件]{${confPath}}: 失败, 文件不存在`);
		}
		else {
			GG[cata].warn(`加载 [配置文件]{${confPath}}: 错误, ${error.message}`);
		}

		conf = undefined;
	}

	return conf;
};