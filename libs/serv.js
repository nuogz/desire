let getPems = (pems) => {
	// {
	// 	key: J(configPath, '..', value.pems.key),
	// 	cert: J(configPath, '..', value.pems.cert)
	// };
	return {
		allowHTTP1: true,
		key: _fs.readFileSync(pems.key),
		cert: _fs.readFileSync(pems.cert)
	};
};

module.exports = async function(configServ) {
	// 模块引用
	let http1 = require('http');
	let http2 = require('http2');

	let Koa = require('koa');

	let Router = require('koa-router');
	let Helmet = require('koa-helmet');
	let Mount = require('koa-mount');
	let Static = require('koa-static');
	let Favicon = require('koa-favicon');

	let serv = new Koa();

	// 创建服务器
	let httpServ;

	if(configServ.serv.http2) {
		httpServ = http2.createSecureServer(getPems());
	}
	else {
		httpServ = http1.createServer();
	}

	// zlib压缩
	serv.use(require('koa-compress')({ threshold: 2048, flush: require('zlib').Z_SYNC_FLUSH }));

	// 请求参数解析
	serv.use(require('koa-bodyparser')());
	// 请求参数解析2，将get和post的参数合并到raw参数中
	serv.use(async function(ctx, next) {
		let raw = ctx.raw || {};

		if(ctx.request && ctx.request.body) {
			for(let key in ctx.request.body) {
				raw[key] = ctx.request.body[key];
			}
		}

		if(ctx.query) {
			for(let key in ctx.query) {
				raw[key] = ctx.query[key];
			}
		}

		ctx.raw = raw;

		await next();
	});

	// cors请求头
	if(configServ.serv.cors) {
		serv.use(require('@koa/cors')());
	}
	// hsts请求头
	if(configServ.serv.http2) {
		serv.use(Helmet());
	}

	let dashServ = {
		serv,
		addApp: async function(nameApp, pathApp, configApp) {
			// 创建子路由器
			let router = Router({ prefix: configApp.serv.path || nameApp });
			// 子应用的接口变量$
			let $ = {
				// 绝对路径转换
				J: function(...paths) {
					return J(pathApp, ...paths);
				},
				// 网站图标
				fv: function(pathIcon) {
					serv.use(Favicon(pathIcon));
				},
				// 绝对路径引用，js文件、json文件，支持重新加载
				rq: function(...paths) {
					let pathRequire = J(pathApp, ...paths);

					return require(pathRequire);
				},
				// 挂载静态目录
				st: async function(path, option, prefix) {
					serv.use(Mount(prefix || configApp.serv.path || '/'+nameApp, Static(path, option)));
				},
				// 常用变量
				C: configApp,
				G: G[nameApp],
				// 对子应用透明 配置和子koa，方便高级开发
				E: E[nameApp] = {},
				serv,
				httpServ,
				router
			};
			// 挂载子应用
			await require(pathApp)($, router);
			serv.use(router.routes());

			G.serv.info(`加载 [应用]{${nameApp}} 成功`);

			return 1;
		},
		start: function() {
			// 挂载服务
			httpServ = httpServ.on('request', serv.callback());
			// 监听端口
			httpServ.listen(configServ.serv.port, configServ.serv.host);

			try {
				let env = process.env,
					uid = parseInt(env['SUDO_UID'] || process.getuid(), 10),
					gid = parseInt(env['SUDO_GID'] || process.getgid(), 10);

				process.setgid(gid);
				process.setuid(uid);
			}
			catch(e) { true; }

			G.serv.info(`-------------- Serv 启动完成{${configServ.serv.host}}{${configServ.serv.port}} --------------`);
		}
	};

	return dashServ;
};