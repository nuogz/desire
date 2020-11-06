module.exports = async function($) {
	const { C: { mare }, G, router, multer } = $;

	return async function(rout) {
		const handle = rout.handle;

		if(!handle) {
			G.warn('海港', `加载 [接口], 路由{${rout.path}}`, '缺少对应的[流程]代码');

			return;
		}
		else {
			G.debug('海港', `加载 [接口], 路由{${rout.path}}`);
		}

		if(rout.upload === true) {
			router[rout.method](rout.path, multer.any());
		}

		// 前置中间件
		for(const middleware of mare.before || []) {
			router[rout.method](rout.path, middleware);
		}

		// 主函数
		router[rout.method](rout.path, async function(ctx, next) {
			ctx.rout = rout;

			await next();

			try {
				ctx.body = await handle(ctx.raw, ctx);
			}
			catch(error) {
				ctx.status == 500;

				G.error('路由', error);
			}
		});

		// 后置中间件
		for(const middleware of mare.after || []) {
			router[rout.method](rout.path, middleware);
		}
	};
};