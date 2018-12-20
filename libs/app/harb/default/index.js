module.exports = async function($) {
	let { Router } = $;

	return async function(info) {
		// 文件上传
		$.Multer = require('koa-multer')({ dest: $.C.path.temp || _os.tmpdir() });

		// 前置中间件
		for(let func of (info.before || [])) {
			Router.use(await func($));
		}

		// 挂载
		let static = await require('./mount/static')($);
		let interface = await require('./mount/interface')($);
		let proxy = await require('./mount/proxy')($);

		for(let rout of info.routs) {
			// 接口
			if(rout.type == 1) {
				await interface(rout);
			}
			// 代理
			else if(rout.type == 2) {
				await proxy(rout);
			}
			// 静态
			if(rout.type == 3) {
				await static(rout);
			}
		}

		// 后置中间件
		for(let func of (info.after || [])) {
			Router.use(await func($));
		}
	};
};