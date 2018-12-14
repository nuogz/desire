module.exports = async function({ C, Serv, Koa, Router }) {
	// 加载路由
	Koa.use(Router.routes());

	// 监听请求
	Serv = Serv.on('request', Koa.callback());

	// 监听错误
	Serv.on('error', function(error) {
		GG.log.error(error.message);
	});

	// 监听端口
	Serv.listen(C.serv.port, C.serv.host);

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