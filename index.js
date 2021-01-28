module.exports = class Desire {
	constructor(C, G) {
		this.C = C;

		if(G) {
			this.G = G;
		}
		else {
			const configLog = C.log || {};

			const G = require('@nuogz/gaia/log');
			this.G = G(configLog.nameLog, configLog.levelLog, configLog.pathSave);
		}

		this.nameLog = typeof C.name == 'string' ? C.name : 'Desire';

		const H1 = require('http');
		const H2 = require('http2');
		this.serv = C.http2 && C.http2.enabled ? H2.createSecureServer(this.loadCert()) : H1.createServer();

		const KoaServ = require('koa');
		this.koa = new KoaServ();

		const KoaRouter = require('koa-router');
		this.router = KoaRouter({ prefix: C.path || '/' });
	}

	async start() {
		const C = this.C;

		try {
			this.loadHead();
			this.loadFavicon();
			await this.loadHarb();
			await this.loadServ();

			this.G.info(this.nameLog, `监听{${C.http2 && C.http2.enabled ? 'http2' : 'http'}://${C.host}:${C.port}}`, `✔`);
		}
		catch(error) {
			this.G.fatal(this.nameLog, `监听{${C.http2 && C.http2.enabled ? 'http2' : 'http'}://${C.host}:${C.port}}`, error);
		}

		return this;
	}

	/** 加载HTTPS证书 */
	loadCert() {
		const { C: { perm } } = this;

		const FS = require('fs');
		return {
			allowHTTP1: true,
			key: FS.readFileSync(perm.key),
			cert: FS.readFileSync(perm.cert)
		};
	}

	/** 加载通用请求头 */
	loadHead() {
		const { koa, C: { cors } } = this;

		// zlib压缩
		const Compress = require('koa-compress');
		const { constants: { Z_SYNC_FLUSH } } = require('zlib');
		koa.use(Compress({
			threshold: 2048,
			gzip: { flush: Z_SYNC_FLUSH },
			deflate: { flush: Z_SYNC_FLUSH },
		}));

		// 请求参数解析
		const BodyParser = require('koa-bodyparser');
		koa.use(BodyParser());

		// cors请求头
		const Cors = require('@koa/cors');
		if(cors) { koa.use(Cors()); }

		// hsts请求头
		const Helmet = require('koa-helmet');
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

	/** 加载Favicon图片 */
	loadFavicon() {
		const { G, C: { favicon }, koa } = this;

		if(favicon && typeof favicon == 'string') {
			const Favicon = require('koa-favicon');
			koa.use(Favicon(favicon));

			G.debug(this.nameLog, '加载[Favicon]', `文件路径{${favicon}}`);
		}
	}

	/** 加载路由 */
	async loadHarb() {
		const { G, C: { harb } } = this;

		if(harb !== false) {

			try {
				if(typeof harb == 'function') {
					this.harb = await harb(this);
				}
				else if(harb != 'default' && typeof harb == 'string') {
					this.harb = await require(harb)(this);
				}
				else {
					this.harb = await require('@nuogz/desire-harb-default')(this);
				}

				G.info(this.nameLog, '加载[接口]', '✔');
			}
			catch(error) {
				G.fatal(this.nameLog, '加载[接口]', error);
			}
		}
	}


	/** 绑定路由并监听端口 */
	async loadServ() {
		const { G, serv, koa, router, C: { http2, host, port } } = this;

		// 加载路由
		koa.use(router.routes());

		// 处理请求
		serv.on('request', koa.callback());

		// 处理错误
		serv.on('error', function(error) {
			if(error.code == 'EADDRINUSE') {
				G.fatal(this.nameLog, `监听{${http2 && http2.enabled ? 'http2' : 'http'}://${host}:${port}}`, '端口已被占用');
			}
			else {
				G.fatal(this.nameLog, '发生[错误]', error);
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