module.exports = async function({ G, st }) {
	return async function(static) {
		let path = static.path;

		try {
			let stat = _fs.statSync(path);

			if(stat.isDirectory()) {
				await st(path, static.prefix, static.option);
			}
			else {
				throw Error(`目录路径{[${path}]}非文件夹`);
			}
		}
		catch(error) {
			if(error.code == 'ENOENT') {
				G.error(`加载 [静态资源]: 失败, 目录路径{[${path}]}不存在`);
			}

			else {
				G.error(`加载 [静态资源]: 失败, ${error.message}`);
			}

			throw error;
		}

		G.info(`加载 [静态资源], 路径: ${path}`);
	};
};