// 模块引用
const http1 = require('http');
const http2 = require('http2');

const KoaServ = require('koa');

const KoaRouter = require('koa-router');
const Mount = require('koa-mount');
const Static = require('koa-static');
const Favicon = require('koa-favicon');

const loadHead = require('./loaderHead');
const parseServ = require('./parseServ');

const loadPerm = require('./loadPerm');

module.exports = async function(C, G, ronf) {
	const serv = C.serv.http2 ? http2.createSecureServer(await loadPerm(C.serv.perm)) : http1.createServer();
	const koa = new KoaServ();
	const router = KoaRouter({ prefix: C.serv.prefix || '/' });

	// 应用环境变量$
	const $ = {
		// 绝对路径转换
		// R: function(...paths) {
		// 	return R(C.path.app, ...paths);
		// },

		// 网站图标
		// fv: function(pathIcon) {
		// 	koa.use(Favicon(pathIcon));
		// },
		// 绝对路径引用, js文件、json文件, 支持重新加载
		// rq: function(...paths) {
		// 	return require(R(C.path.app, ...paths));
		// },
		// 挂载静态目录
		st: async function(pathStatic, prefix, option) {
			koa.use(Mount(prefix, Static(pathStatic, option)));
		},

		serv,
		koa,
		router,

		// 后加载函数字典
		afterInit: {},
	};

	// 通用请求头
	await loadHead($);

	// 海港
	if(C.serv.harb !== false) {
		await require('../harb')($);
	}

	// 应用
	await require(C.path.app)($);

	// 后加载函数
	for(let aik in $.afterInit) {
		let func = $.afterInit[aik];

		if(typeof func == 'function') {
			G.debug(`执行 [后加载函数]: ${aik}`);

			await func();
		}
	}

	// 绑定并启动服务
	await parseServ($);

	return $;
};