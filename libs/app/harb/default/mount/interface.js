module.exports = async function($, before = [], after = []) {
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
			Router[rout.method](rout.path, Multer.any());
		}

		// 前置中间件
		for(let func of before) {
			Router[rout.method](rout.path, func);
		}

		// 主中间件
		let main;
		if(before.length) {
			main = async function(ctx, next) {
				ctx.rout = rout;

				await next();

				if(ctx.access) {
					try {
						ctx.body = await func(ctx.raw, ctx);
					}
					catch(e) {
						ctx.status == 500;

						G.error(e.message || e);
					}
				}
				else {
					ctx.status = 403;
				}
			};
		}
		else {
			main = async function(ctx, next) {
				ctx.rout = rout;

				await next();

				try {
					ctx.body = await func(ctx.raw, ctx);
				}
				catch(e) {
					ctx.status == 500;

					G.error(e.message || e);
				}
			};
		}

		Router[rout.method](rout.path, main);

		// 后置中间件
		for(let func of after) {
			Router[rout.method](rout.path, func);
		}
	};
};