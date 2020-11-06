const http1 = require('http');
const http2 = require('http2');

const KoaServ = require('koa');

const KoaRouter = require('koa-router');
// const Mount = require('koa-mount');
// const Static = require('koa-static');

const loadHead = require('./loaderHead');
const parseServ = require('./parseServ');

const loadPerm = require('./loadPerm');

module.exports = async function(C, G) {
	const serv = C.http2.enabled ? http2.createSecureServer(await loadPerm(C.perm)) : http1.createServer();
	const koa = new KoaServ();

	const router = KoaRouter({ prefix: C.path || '/' });

	// 应用环境变量$
	const $ = {
		serv,
		koa,
		router,

		C,
		G,
	};

	// 通用请求头
	await loadHead($, C);

	// 路由对接
	if(C.harb !== false) {
		await require('../harb')($);
	}

	// 绑定并启动服务
	await parseServ($, C);

	return $;
};