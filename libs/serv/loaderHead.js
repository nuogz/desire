// 模块引用
const Compress = require('koa-compress');
const BodyParser = require('koa-bodyparser');
const Cors = require('@koa/cors');
const Helmet = require('koa-helmet');

module.exports = async function({ koa }, { cors }) {
	// zlib压缩
	koa.use(Compress({
		threshold: 2048,
		gzip: { flush: require('zlib').constants.Z_SYNC_FLUSH },
		deflate: { flush: require('zlib').constants.Z_SYNC_FLUSH },
	}));

	// 请求参数解析
	koa.use(BodyParser());

	// // cors请求头
	if(cors) { koa.use(Cors()); }

	// hsts请求头
	koa.use(Helmet.contentSecurityPolicy({
		directives: {
			defaultSrc: ['\'self\''],
			objectSrc: ['\'none\''],
			scriptSrc: ['\'self\'', '\'unsafe-eval\''],
			scriptSrcAttr: ['\'none\''],
			styleSrc: ['\'self\'', 'https:', 'unsafe-inline'],
			imgSrc: ['\'self\'', 'https:', 'data:'],
			fontSrc: ['\'self\'', 'https:', 'data:'],
			upgradeInsecureRequests: [],
			blockAllMixedContent: [],
		},
	}));
	koa.use(Helmet.expectCt());
	koa.use(Helmet.frameguard());
	koa.use(Helmet.hidePoweredBy());
	koa.use(Helmet.hsts());
	koa.use(Helmet.ieNoOpen());
	koa.use(Helmet.noSniff());
	koa.use(Helmet.permittedCrossDomainPolicies());
	koa.use(Helmet.referrerPolicy());
	koa.use(Helmet.xssFilter());
};