const Mount = require('koa-mount');
const Static = require('koa-static');

module.exports = async function({ koa, G }) {
	return async function(fold) {
		const path = fold.path;
		const prefix = fold.prefix;

		try {
			koa.use(Mount(prefix, Static(path, fold.option)));
		}
		catch(error) {
			G.error('海港', `加载 [映射], 路由{${prefix}}, 文件路径{${path}}`, error);
		}

		G.debug('海港', `加载 [映射], 路由{${prefix}}, 文件路径{${path}}`);
	};
};