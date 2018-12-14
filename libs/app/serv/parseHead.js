// 模块引用
let Helmet = require('koa-helmet');
let Cors = require('@koa/cors');
let Compress = require('koa-compress');
let BodyParser = require('koa-bodyparser');

module.exports = async function({ Serv, C }) {
	// zlib压缩
	Serv.use(Compress({ threshold: 2048, flush: require('zlib').Z_SYNC_FLUSH }));

	// 请求参数解析
	Serv.use(BodyParser());
	// 请求参数解析2, 将get和post的参数合并到raw参数中
	Serv.use(async function(ctx, next) {
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
	if(C.serv.cors) { Serv.use(Cors()); }
	// hsts请求头
	if(C.serv.http2) { Serv.use(Helmet()); }
};