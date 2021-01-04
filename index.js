const H1 = require('http');
const H2 = require('http2');
const FS = require('fs');

const KoaServ = require('koa');
const KoaRouter = require('koa-router');

module.exports = class Desire {
	constructor(C, G) {
		this.C = C;

		if(G) {
			this.G = G;
		}
		else {
			const G = require('./libs/log');
			const configLog = C.log || {};

			this.G = G(configLog.nameLog, configLog.levelLog, configLog.pathSave);

			this.G.info('服务', '加载[日志]', '✔', `保存路径{${configLog.pathSave || '无'}}`);
		}

		this.serv = C.http2.enabled ? H2.createSecureServer(this.loadCert()) : H1.createServer();
		this.koa = new KoaServ();
		this.router = KoaRouter({ prefix: C.path || '/' });
	}

	async start() {
		const C = this.C;

		try {
			// 通用请求头
			this.loadHead();

			// 路由对接
			if(this.harb !== false) {
				await require('./libs/harb')(this);
			}

			// 绑定并启动服务
			await this.parseServ();

			this.G.info('服务', `监听{${C.http2.enabled ? 'http2' : 'http'}://${C.host}:${C.port}}`, `✔`);
		}
		catch(error) {
			this.G.fatal('服务', `监听{${C.http2.enabled ? 'http2' : 'http'}://${C.host}:${C.port}}`, error);
		}

		return this;
	}

	loadCert() {
		const { C: { perm } } = this;

		return {
			allowHTTP1: true,
			key: FS.readFileSync(perm.key),
			cert: FS.readFileSync(perm.cert)
		};
	}

	loadHead() {
		const { koa, C: { cors } } = this;

		const Compress = require('koa-compress');
		const BodyParser = require('koa-bodyparser');
		const Cors = require('@koa/cors');
		const Helmet = require('koa-helmet');

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
				styleSrc: ['\'self\'', 'https:', '\'unsafe-inline\''],
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
	}

	async parseServ() {
		const { G, serv, koa, router, C: { host, port } } = this;

		// 加载路由
		koa.use(router.routes());

		// 处理请求
		serv.on('request', koa.callback());

		// 处理错误
		serv.on('error', function(error) {
			if(error.code == 'EADDRINUSE') {
				G.fatal('服务', `监听 [端口]{${host}:${port}}: 端口已被占用`);
			}
			else {
				G.fatal('服务', error);
			}

			process.exit();
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
	}
};