module.exports = async function($) {
	let { C, Router } = $;

	return async function(info) {
		// 文件上传
		$.Multer = require('koa-multer')({ dest: $.C.path.temp || _os.tmpdir() });

		if(C.serv.wock && C.serv.wock.enabled) {
			await require('./wock')($, info.wock);
		}

		// 前置中间件
		for(let func of (info.before || [])) {
			Router.use(await func($));
		}

		// 挂载
		let static = await require('./mount/static')($);
		let interface = await require('./mount/interface')($);
		let proxy = await require('./mount/proxy')($);

		// Wock
		let interfaceWock = await require('./wock/interface')($, info.wock);
		let proxyWock = await require('./wock/proxy')($, info.wock);

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
			else if(rout.type == 3) {
				await static(rout);
			}

			// Wock
			if(rout.type == 4 || (rout.type == 1 && rout.wockType)) {
				await interfaceWock(rout);
			}
			else if(rout.type == 2 && rout.wockType) {
				await proxyWock(rout);
			}
		}

		// 后置中间件
		for(let func of (info.after || [])) {
			Router.use(await func($));
		}
	};
};