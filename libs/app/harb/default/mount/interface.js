module.exports = async function($) {
	let { G, Router, Multer } = $;

	return async function(rout) {
		let func = rout.func;

		if(!func) {
			G.warn(`加载 [接口], ID: {${rout.id}}, 路径: {${rout.path}}, 错误: 缺少对应的[流程]代码`);

			return;
		}
		else {
			G.trace(`加载 [接口], ID: {${rout.id}}, 路径: {${rout.path}}`);
		}

		if(rout._stat.upload == 1) {
			$.router[rout.method](rout.path, Multer.any());
		}

		Router[rout.method](rout.path, async function(ctx, next) {
			ctx.rout = rout;

			await next();

			if(ctx.access) {
				ctx.body = await func(ctx.raw);
			}

			if(ctx.body.type) {
				ctx.type = ctx.body.type || 'json';
			}
		});
	};
};