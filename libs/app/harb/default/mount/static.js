module.exports = async function({ G, st }) {
	return async function(static) {
		let path = static.path;

		try {
			st(path, static.prefix, static.option);
		}
		catch(error) {
			G.error(`加载 [静态资源]: 失败, ${error.message}`);

			throw error;
		}

		G.info(`加载 [静态资源], 路径: ${path}`);
	};
};