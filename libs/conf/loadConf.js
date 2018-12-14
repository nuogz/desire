module.exports = async function(configPath, cata = 'serv') {
	let config;

	try {
		config = require(configPath);

		if(typeof config == 'function') {
			config = await config();
		}

		if(!config) {
			GG[cata].warn(`加载 [配置文件]{${configPath}}: 错误, 结果为[空]`);

			config = undefined;
		}
		else if(typeof config != 'object') {
			GG[cata].warn(`加载 [配置文件]{${configPath}}: 错误, 结果非[对象]`);

			config = undefined;
		}
	}
	catch(error) {
		if(error.code == 'MODULE_NOT_FOUND') {
			GG[cata].warn(`加载 [配置文件]{${configPath}}: 失败, 文件不存在`);
		}
		else {
			GG[cata].warn(`加载 [配置文件]{${configPath}}: 错误, ${error.message}`);
		}

		config = undefined;
	}

	return config;
};