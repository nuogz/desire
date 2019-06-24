// 模块引用
let http1 = require('http');
let http2 = require('http2');

let KoaServ = require('koa');

let KoaRouter = require('koa-router');
let Mount = require('koa-mount');
let Static = require('koa-static');
let Favicon = require('koa-favicon');

let parseHead = require('./parseHead');
let parseServ = require('./parseServ');

let loadPerm = require('./loadPerm');

module.exports = async function(C, G) {
	let Serv = C.serv.http2 ? http2.createSecureServer(await loadPerm(C.serv.perm)) : http1.createServer();
	let Koa = new KoaServ();
	let Router = KoaRouter({ prefix: C.serv.prefix || '/' });

	// 应用环境变量$
	let $ = {
		// 绝对路径转换
		R: function(...paths) {
			return R(C.path.app, ...paths);
		},

		// 网站图标
		fv: function(pathIcon) {
			Koa.use(Favicon(pathIcon));
		},
		// 绝对路径引用, js文件、json文件, 支持重新加载
		rq: function(...paths) {
			return require(R(C.path.app, ...paths));
		},
		// 挂载静态目录
		st: async function(pathStatic, prefix, option) {
			Koa.use(Mount(prefix, Static(pathStatic, option)));
		},

		C,
		G,

		Serv,
		Koa,
		Router,

		// 后加载函数字典
		afterInit: {},
	};

	// 通用请求头
	await parseHead($);

	// 海港
	if(C.serv.harb !== false) {
		await require('../harb')($);
	}

	// 应用
	await require(C.path.app)($);

	// 绑定并启动服务
	await parseServ($);

	// 执行后加载函数
	for(let aik in $.afterInit) {
		let func = $.afterInit[aik];

		if(typeof func == 'function') {
			G.debug(`执行 [后加载函数]: ${aik}`);

			await func();
		}
	}

	return $;
};