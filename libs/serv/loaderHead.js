// 模块引用
const Compress = require('koa-compress');
const BodyParser = require('koa-bodyparser');
const Cors = require('@koa/cors');
const Helmet = require('koa-helmet');

module.exports = async function({ koa }, { cors, http2 }) {
	// zlib压缩
	koa.use(Compress({
		threshold: 2048,
		gzip: { flush: require('zlib').constants.Z_SYNC_FLUSH },
		deflate: { flush: require('zlib').constants.Z_SYNC_FLUSH },
	}));

	// 请求参数解析
	koa.use(BodyParser());

	// cors请求头
	if(cors) { koa.use(Cors()); }
	// hsts请求头
	if(http2) { koa.use(Helmet()); }
};