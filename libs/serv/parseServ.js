module.exports = async function({ G, serv, koa, router }, { host, port }) {
	// 加载路由
	koa.use(router.routes());

	// 监听请求
	serv.on('request', koa.callback());

	// 监听错误
	serv.on('error', function(error) {
		if(error.code == 'EADDRINUSE') {
			G.fatal('服务', `监听 [端口]{${host}:${port}}: 端口已被占用`);

			process.exit();
		}
		else {
			G.error('服务', error);
		}
	});

	// 监听端口
	await new Promise(function(resolve, reject) {
		serv.listen(port, host, function(error) {
			if(error) {
				reject(error);
			}
			else {
				resolve();
			}
		});
	});



	// 降低权限
	try {
		const env = process.env,
			uid = parseInt(env['SUDO_UID'] || process.getuid(), 10),
			gid = parseInt(env['SUDO_GID'] || process.getgid(), 10);

		process.setgid(gid);
		process.setuid(uid);
	}
	catch(e) { true; }
};