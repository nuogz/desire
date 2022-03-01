import { readFileSync } from 'fs';
import { createServer } from 'http';
import { createSecureServer } from 'http2';

import Koa from 'koa';

import Compress from 'koa-compress';
import { constants } from 'zlib';
import Cors from '@koa/cors';
import Helmet from 'koa-helmet';
import Favicon from 'koa-favicon';


import context from 'koa/lib/context';
import response from 'koa/lib/response';
import request from 'koa/lib/request';

/**
 * #### 服务器系统（渴望）
 * - 基于`koajs`封装的简单服务器
 * @version 4.11.15-2022.03.01.01
 * @class
 */
class Desire {
	static KoaContext = context;
	static KoaResponse = response;
	static KoaRequest = request;


	/**
	 * 接口配置
	 * @typedef {Object} FaceConfig
	 * @property {string} method 请求方法：使用`.`分割。默认支持`koa-router`中使用的方法（一般为HTTP 1.1协议所支持的方法），以及值`wock`用于Wock接口
	 * @property {string} route 路由
	 * @property {Function} handle 处理请求的函数
	 * @property {boolean} upload 是否支持文件上传：未定义或`true`禁用；`false`启用
	 */

	/**
	 * 文件映射配置
	 * @typedef {Object} FolderConfig
	 * @property {string} route 路由：**注意：此配置是完全独立，不与`{ServerConfig.facePrefix}`组合**
	 * @property {string} path 文件系统的路径
	 * @property {Object} option `koa-mount`的相关配置
	 */

	/**
	 * 日志配置：包含`trace`、`debug`、`info`、`warn`、`error`、`fatal`、`mark`等函数，用于分级日志输出
	 * @typedef {Object} LoggerConfig
	 * @property {Function} trace 用于记录`追踪`级别的日志
	 * @property {Function} debug 用于记录`调试`级别的日志
	 * @property {Function} info 用于记录`信息`级别的日志
	 * @property {Function} warn 用于记录`警告`级别的日志
	 * @property {Function} error 用于记录`错误`级别的日志
	 * @property {Function} fatal 用于记录`致命`级别的日志
	 * @property {Function} mark 用于记录`标记`级别的日志
	 */

	/**
	 * Mare中间件初始化函数：初始化Mare中间件的函数：支持Promise异步
	 * @typedef {Function} MareIniter
	 * @async
	 */
	/**
	 * Mare中间件配置：Mare，`Middleware`的缩写。默认使用与普通接口相同的`路由`
	 * @typedef {Object} MareConfig
	 * @property {Array<MareIniter>|string} [before] 前置中间件初始化数组：一般为初始化函数，也可以是配置`string`以内置使用预置的中间件
	 * @property {Array<MareIniter>|string} [after] 后置中间件初始化数组：一般为初始化函数，也可以是配置`string`以内置使用预置的中间件
	 */
	/**
	 * Wock Mare中间件配置：Mare，`Middleware`的缩写。默认使用与普通接口相同的`路由`
	 * @typedef {Object} WockMareConfig
	 * @property {Array<MareIniter>|string} [before] 前置中间件初始化数组：一般为初始化函数，也可以是配置`string`以内置使用预置的中间件
	 * @property {Array<MareIniter>|string} [after] 后置中间件初始化数组：一般为初始化函数，也可以是配置`string`以内置使用预置的中间件
	 * @property {Array<MareIniter>|string} [upgrade] 协议升级中间件初始化数组：一般为初始化函数，也可以是配置`string`以内置使用预置的中间件
	 * @property {Array<MareIniter>|string} [close] 连接关闭中间件初始化数组：一般为初始化函数，也可以是配置`string`以内置使用预置的中间件
	 */

	/**
	 * Wock配置：Wock，`WebSocket`的缩写。默认使用与普通接口相同的`路由`
	 * @typedef {Object} WockConfig
	 * @property {boolean} [disable=false] 是否禁用：未定义或`false`启用；`true`禁用
	 * @property {string} [route='wock'] WebSocket协议链接的路由：**注意：此配置是完全独立，不与`{ServerConfig.facePrefix}`组合**
	 * @property {boolean} [ping=false] 是否在WebSocket连接后发送保活消息：未定义或`false`不发送；`true`发送
	 * @property {WockMareConfig} [mare] Wock接口的中间件配置
	 */

	/**
	 * HTTP2配置
	 * @typedef {Object} HTTP2Config
	 * @property {boolean} [disable=false] 是否禁用：未定义或`false`启用；`true`禁用
	 * @property {boolean} [http1=true] 是否允许HTTP1协议的请求
	 * @property {string|Buffer} key SSL私钥：`{string}`文件路径则自动读取
	 * @property {string|Buffer} cert SSL证书：`{string}`文件路径则自动读取
	 */

	/**
	 * 服务器配置
	 * @typedef {Object} ServerConfig
	 * @property {string} [name] 服务器名称：一般用于日志输出
	 *
	 * @property {string} host 监听目标
	 * @property {number} post 监听端口
	 *
	 * @property {string} [facePrefix='/'] 接口路由的通用前缀
	 * @property {Array<FaceConfig>} [faces] 接口配置数组
	 * @property {Array<FolderConfig>} [folds] 文件映射配置数组
	 * @property {MareConfig} [mare] 中间件配置
	 * @property {WockConfig} [wock] Wock配置
	 * @property {Function|string} [harb] 港湾初始化函数：留空或`'default'`，使用默认港湾库`@nuogz/desire-harb-default`；`string`，动态加载调用；`Function`，港湾函数本身。港湾函数用于将各种配置应用到`koajs`实例中，调用时只有`Desire`实例本体传入
	 *
	 * @property {HTTP2Config|boolean} [http2=false] HTTP2配置
	 *
	 * @property {Function|LoggerConfig} [logger] 日志配置：未定义，使用标准的`console`输出函数；`false`关闭输出；`{Function}`输出不分级的日志；`{LoggerConfig}`跟进内容输出不同等级的日志。日志会以`在哪里、做什么、结果`的格式调用函数。**注意：产生错误时，错误本体将作为结果参数之一传入，而不是字符串化后的文本。**
	 *
	 * @property {string} [favicon] FavIcon的文件路径
	 */

	/**
	 * @param {ServerConfig} C 服务器综合配置
	 */
	constructor(C) {
		if(!C) { throw TypeError('缺少 [服务器配置]{C}'); }

		/**
		 * 服务器配置
		 * @type {ServerConfig}
		 */
		this.C = C;

		this.initLogger();
		this.initHTTP2();

		this.server = this.http2 ? createSecureServer(this.http2) : createServer();
		this.koa = new Koa();

		this.initHeader();
		this.initFavIcon();
	}

	/** 服务器协议头 */
	get protocol() { return this.http2 ? 'http2' : 'http'; }
	/** 用于日志记录的服务器名称 */
	get nameLog() { return typeof this.C.name == 'string' ? this.C.name : 'Desire'; }

	/** 启动服务器 */
	async start() {
		const { C: { host, port }, server, logInfo, logFatal } = this;

		try {
			await this.initHarbour();
			await this.initServer();

			// 监听端口
			await new Promise((resolve, reject) => server.listen(port, host, error => error ? reject(error) : resolve()));

			// 监听端口后尝试降低权限
			try {
				const env = process.env,
					uid = parseInt(env['SUDO_UID'] || process.getuid(), 10),
					gid = parseInt(env['SUDO_GID'] || process.getgid(), 10);

				process.setgid(gid);
				process.setuid(uid);
			}
			catch(e) { void 0; }

			logInfo(`监听~{${this.protocol}://${host == '0.0.0.0' ? 'localhost' : host}:${port}}`, `✔ `);
		}
		catch(error) {
			logFatal(`监听~{${this.protocol}://${host}:${port}}`, error);
		}

		return this;
	}

	/** 加载HTTPS2配置 */
	initHTTP2() {
		const { C: { http2 } } = this;

		if(!http2 || http2.disable) { return false; }

		const config = {
			allowHTTP1: http2.http1,
			key: http2.key,
			pem: http2.pem,
		};

		if(typeof config.key == 'string') { config.key = readFileSync(config.key); }
		if(typeof config.pem == 'string') { config.pem = readFileSync(config.pem); }

		this.http2 = config;
	}


	/** 加载通用请求头 */
	initHeader() {
		const koa = this.koa;

		// zlib压缩
		koa.use(Compress({
			threshold: 2048,
			gzip: { flush: constants.Z_SYNC_FLUSH },
			deflate: { flush: constants.Z_SYNC_FLUSH },
		}));

		// cors请求头
		koa.use(Cors());

		// hsts请求头
		koa.use(Helmet.contentSecurityPolicy({
			directives: {
				defaultSrc: ['\'self\'', '\'unsafe-inline\'', '\'unsafe-eval\''],
				objectSrc: ['\'none\''],
				scriptSrc: ['\'self\'', '\'unsafe-inline\'', '\'unsafe-eval\''],
				styleSrc: ['\'self\'', 'https:', '\'unsafe-inline\''],
				imgSrc: ['\'self\'', 'https:', 'data:', 'blob:', 'mediastream:', 'filesystem:'],
				fontSrc: ['\'self\'', 'https:', 'data:', 'blob:', 'mediastream:', 'filesystem:'],
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

	/** 加载FavIcon */
	initFavIcon() {
		const { C: { favicon }, koa, logDebug } = this;

		if(favicon && typeof favicon == 'string') {
			koa.use(Favicon(favicon));

			logDebug('加载~[Favicon]', `~[文件路径]~{${favicon}}`);
		}
	}

	/**
	 * 加载港湾
	 * @async
	 */
	async initHarbour() {
		const { C: { harb }, logInfo, logFatal } = this;

		if(harb !== false) {
			try {
				if(typeof harb == 'function') {
					this.harb = await harb(this);
				}
				else if(harb != 'default' && typeof harb == 'string') {
					this.harb = await (await import(harb)).default(this);
				}
				else {
					this.harb = await (await import('@nuogz/desire-harb-default')).default(this);
				}

				logInfo('加载~[港湾]', '✔ ');
			}
			catch(error) {
				logFatal('加载~[港湾]', error);
			}
		}
	}


	/**
	 * 加载服务器
	 * @async
	 */
	async initServer() {
		const { C: { host, port }, server, koa, logFatal } = this;

		// 监听请求
		server.on('request', koa.callback());

		// 监听错误
		server.on('error', function(error) {
			if(error.code == 'EADDRINUSE') {
				logFatal(`监听~{${this.protocol}://${host}:${port}}`, '✖ 端口已被占用');
			}
			else {
				logFatal('发生~[错误]', error);
			}

			process.exit();
		});
	}

	/** 加载日志函数 */
	initLogger() {
		const { C: { logger } } = this;

		// 关闭日志
		if(logger === false) {
			this.logTrace = () => { };
			this.logDebug = () => { };
			this.logInfo = () => { };
			this.logError = () => { };
			this.logWarn = () => { };
			this.logFatal = () => { };
			this.logMark = () => { };
		}
		// 单一日志
		else if(typeof logger == 'function') {
			this.logTrace = (...params) => logger(this.nameLog, ...params);
			this.logDebug = (...params) => logger(this.nameLog, ...params);
			this.logInfo = (...params) => logger(this.nameLog, ...params);
			this.logError = (...params) => logger(this.nameLog, ...params);
			this.logWarn = (...params) => logger(this.nameLog, ...params);
			this.logFatal = (...params) => logger(this.nameLog, ...params);
			this.logMark = (...params) => logger(this.nameLog, ...params);
		}
		// 分级日志
		else {
			const csl = console;

			this.logTrace =
				typeof logger?.trace == 'function' ?
					(...params) => logger.trace(this.nameLog, ...params) :
					(
						typeof csl.trace == 'function' ?
							(...params) => csl.trace(this.nameLog, ...params) :
							(...params) => csl.log(this.nameLog, ...params)
					);
			this.logDebug =
				typeof logger?.debug == 'function' ?
					(...params) => logger.debug(this.nameLog, ...params) :
					(
						typeof csl.debug == 'function' ?
							(...params) => csl.debug(this.nameLog, ...params) :
							(...params) => csl.log(this.nameLog, ...params)
					);
			this.logInfo =
				typeof logger?.info == 'function' ?
					(...params) => logger.info(this.nameLog, ...params) :
					(
						typeof csl.info == 'function' ?
							(...params) => csl.info(this.nameLog, ...params) :
							(...params) => csl.log(this.nameLog, ...params)
					);
			this.logError =
				typeof logger?.error == 'function' ?
					(...params) => logger.error(this.nameLog, ...params) :
					(
						typeof csl.error == 'function' ?
							(...params) => csl.error(this.nameLog, ...params) :
							(...params) => csl.log(this.nameLog, ...params)
					);
			this.logWarn =
				typeof logger?.warn == 'function' ?
					(...params) => logger.warn(this.nameLog, ...params) :
					(
						typeof csl.warn == 'function' ?
							(...params) => csl.warn(this.nameLog, ...params) :
							(...params) => csl.log(this.nameLog, ...params)
					);
			this.logFatal =
				typeof logger?.fatal == 'function' ?
					(...params) => logger.fatal(this.nameLog, ...params) :
					(
						typeof csl.error == 'function' ?
							(...params) => csl.error(this.nameLog, ...params) :
							(...params) => csl.log(this.nameLog, ...params)
					);
			this.logMark =
				typeof logger?.mark == 'function' ?
					(...params) => logger.mark(this.nameLog, ...params) :
					(
						typeof csl.info == 'function' ?
							(...params) => csl.info(this.nameLog, ...params) :
							(...params) => csl.log(this.nameLog, ...params)
					);
		}
	}
}

export default Desire;