module.exports = async function($) {
	let { C } = $;

	return async function(info) {
		// 文件上传
		$.Multer = require('koa-multer')({ dest: $.C.path.temp || _os.tmpdir() });

		if(C.serv.wock && C.serv.wock.enabled) {
			await require('./wock')($, info.wock);
		}

		let before = [];
		let after = [];

		for(let func of (info.before || [])) {
			before.push(await func($));
		}
		for(let func of (info.after || [])) {
			after.push(await func($));
		}

		// 挂载
		let static = await require('./mount/static')($, before, after);
		let interface = await require('./mount/interface')($, before, after);
		let proxy = await require('./mount/proxy')($, before, after);

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
	};
};