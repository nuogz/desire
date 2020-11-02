// 模块引用
let Helmet = require('koa-helmet');
let Cors = require('@koa/cors');
let Compress = require('koa-compress');
let BodyParser = require('koa-bodyparser');

module.exports = async function({ C, Koa }) {
	// zlib压缩
	Koa.use(Compress({
		threshold: 2048,
		gzip: { flush: require('zlib').constants.Z_SYNC_FLUSH },
		deflate: { flush: require('zlib').constants.Z_SYNC_FLUSH },
	}));

	// 请求参数解析
	Koa.use(BodyParser());

	// cors请求头
	if(C.serv.cors) { Koa.use(Cors()); }
	// hsts请求头
	if(C.serv.http2) { Koa.use(Helmet()); }
};