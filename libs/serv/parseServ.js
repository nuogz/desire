module.exports = async function({ C, G, Serv, Koa, Router }) {
	// 加载路由
	Koa.use(Router.routes());

	// 监听请求
	Serv.on('request', Koa.callback());

	// 监听错误
	Serv.on('error', function(error) {
		if(error.code == 'EADDRINUSE') {
			G.fatal(`监听 [端口]{${C.serv.host}:${C.serv.port}}: 失败, 端口可能已被占用`);

			process.exit();
		}
		else {
			G.error(`[服务器]: 错误, ${error.message}`);
		}
	});

	// 监听端口
	await new Promise(function(resolve, reject) {
		Serv.listen(C.serv.port, C.serv.host, function(err) {
			if(err) {
				reject(err);
			}
			else {
				resolve();
			}
		});
	});

	G.info(`监听 [端口]{${C.serv.http2 ? 'http2' : 'http'}://${C.serv.host}:${C.serv.port}}`);

	// 降低权限
	try {
		let env = process.env,
			uid = parseInt(env['SUDO_UID'] || process.getuid(), 10),
			gid = parseInt(env['SUDO_GID'] || process.getgid(), 10);

		process.setgid(gid);
		process.setuid(uid);
	}
	catch(e) { true; }
};