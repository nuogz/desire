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

import { T, TT } from './lib/i18n.js';



/**
 * - simple server library based on koa
 * @class
 */
export default class Desire {
	static KoaContext = context;
	static KoaResponse = response;
	static KoaRequest = request;


	/**
	 * Face config
	 * @typedef {Object} FaceConfig
	 * @property {string} method Multi methods splited by `;`. methods used in `koa-router` (HTTP 1.1), or `wock` for wock face
	 * @property {string} route
	 * @property {Function} handle
	 * @property {boolean} upload Indicates whether file upload is enabled. `undefined` or `true` for enabled；`false` for disabled
	 */

	/**
	 * Folder mapping config
	 * @typedef {Object} FolderConfig
	 * @property {string} route **ATTENTION** This option is fully independent that will not concat with `{ServerConfig.facePrefix}`
	 * @property {string} path path of file system
	 * @property {Object} option `koa-mount` config
	 */

	/**
	 * Logger config
	 * - include `trace`, `debug`, `info`, `warn`, `error`, `fatal` and `mark` for classify log output
	 * @typedef {Object} LoggerConfig
	 * @property {Function} trace
	 * @property {Function} debug
	 * @property {Function} info
	 * @property {Function} warn
	 * @property {Function} error
	 * @property {Function} fatal
	 * @property {Function} mark
	 */

	/**
	 * Mare(Middleware) Initial Function
	 * - Promise is supported.
	 * @typedef {Function} MareIniter
	 * @async
	 */
	/**
	 * Mare(Middleware) config
	 * - Mare, abbreviation for `Middleware`.
	 * - Its route is the same as Face by default.
	 * @typedef {Object} MareConfig
	 * @property {Array<MareIniter>|string} [before] An array for before-mare initer, or a string for one built-in mare.
	 * @property {Array<MareIniter>|string} [after] An array for after-mare initer, or a string for one built-in mare.
	 */
	/**
	 * Mare(Middleware) config for Wock.
	 * - Its route is the same as Face by default.
	 * @typedef {Object} WockMareConfig
	 * @property {Array<MareIniter>|string} [before] An array for before-mare initer, or a string for one built-in mare.
	 * @property {Array<MareIniter>|string} [after] An array for after-mare initer, or a string for one built-in mare.
	 * @property {Array<MareIniter>|string} [upgrade] An array for upgrade-mare initer, or a string for one built-in mare.
	 * @property {Array<MareIniter>|string} [close] An array for close-mare initer, or a string for one built-in mare.
	 */

	/**
	 * Wock config
	 * - Wock, abbreviation for `WebSocket`.
	 * - Its route is the same as Face by default.
	 * @typedef {Object} WockConfig
	 * @property {boolean} [disable=false] Indicates whether disabled. `undefined` or `true` for disabled；`false` for enabled.
	 * @property {string} [route='wock'] Route under WebSocket. **ATTENTION** This option is fully independent that will not concat with `{ServerConfig.facePrefix}`
	 * @property {boolean} [ping=false] Indicates whether send `ping` event after websocket connected. `undefined` or `false` for not send；`true` for will send
	 * @property {WockMareConfig} [mare] Mare(Middleware) config for Wock.
	 */

	/**
	 * HTTP2 config
	 * @typedef {Object} HTTP2Config
	 * @property {boolean} [disable=false] Indicates whether disabled. `undefined` or `true` for disabled；`false` for enabled.
	 * @property {boolean} [http1=true] Indicates whether allow HTTP1 request
	 * @property {string|Buffer} key SSL private key. `string` for file path
	 * @property {string|Buffer} cert SSL public cert. `string` for file path
	 */

	/**
	 * Server config
	 * @typedef {Object} ServerConfig
	 * @property {string} [name] name for server. Used to log output
	 *
	 * @property {string} host listen host
	 * @property {number} post listen port
	 *
	 * @property {string} [facePrefix='/'] prefix for Faces
	 * @property {Array<FaceConfig>} [faces] An array for Face Config
	 * @property {Array<FolderConfig>} [folds] An array for Folder Mapping
	 * @property {MareConfig} [mare] Mare config
	 * @property {WockConfig} [wock] Wock config
	 * @property {Function|string} [harb] Harb(harbour) initial function. `undefined` or `'default'` for using default Harb library `@nuogz/desire-harb-default`; `string` for import library；`Function` for Harb self. Harb is used to apply configs into `koajs` instance. only `Desire` instances will be passed.
	 *
	 * @property {HTTP2Config|boolean} [http2=false] HTTP2 config
	 *
	 * @property {Function|LoggerConfig} [logger] Logger config. `undefined` for use `console` functions；`false` for close output；`Function` for output non-classify logs；`{LoggerConfig}` for classify logs. The function will be called in the format of where, what and result. **ATTENTION** The Error instance will be passed in as one of the result arguments, not stringified error text.
	 *
	 * @property {string} [favicon] path of icon file
	 *
	 * @property {string} [locale] locale for log
	 *
	 * @property {false|Compress.CompressOptions} [compress] compress options
	 *
	 */

	/**
	 * @param {ServerConfig} C server main config
	 */
	constructor(C) {
		if(!C) { throw TypeError(T('error.missServerConfig')); }

		/**
		 * server config
		 * @type {ServerConfig}
		 */
		this.C = C;

		this.locale = C.locale;
		this.TT = TT(this.locale);


		this.initLogger();
		this.initHTTP2();

		this.server = this.http2 ? createSecureServer(this.http2) : createServer();
		this.koa = new Koa();

		this.initHeader();
		this.initFavIcon();

	}

	/** server protocol */
	get protocol() { return this.http2 ? 'http2' : 'http'; }
	/** server name for log */
	get nameLog() { return typeof this.C.name == 'string' ? this.C.name : 'Desire'; }

	/** start server */
	async start() {
		const { C: { host, port }, server, logInfo, logFatal } = this;

		try {
			await this.initHarbour();
			await this.initServer();

			// listen port
			await new Promise((resolve, reject) => server.listen(port, host, error => error ? reject(error) : resolve()));

			// try to downgrade system perm after listen
			try {
				const env = process.env,
					uid = parseInt(env['SUDO_UID'] || process.getuid(), 10),
					gid = parseInt(env['SUDO_GID'] || process.getgid(), 10);

				process.setgid(gid);
				process.setuid(uid);
			}
			catch(e) { void 0; }

			logInfo(this.TT('listenPort', { url: `${this.protocol}://${host == '0.0.0.0' ? 'localhost' : host}:${port}` }), `✔ `);
		}
		catch(error) {
			logFatal(this.TT('listenPort', { url: `${this.protocol}://${host}:${port}` }), error);
		}

		return this;
	}

	/** init HTTP2 */
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


	/** init HTTP header */
	initHeader() {
		const koa = this.koa;

		// zlib
		if(this.C.compress !== false) {
			koa.use(Compress(Object.assign({}, this.C.compress, {
				threshold: 2048,
				gzip: { flush: constants.Z_SYNC_FLUSH },
				deflate: { flush: constants.Z_SYNC_FLUSH },
			})));
		}

		// cors header
		koa.use(Cors());

		// hsts header
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

	/** init Favicon */
	initFavIcon() {
		const { C: { favicon }, koa, logDebug } = this;

		if(favicon && typeof favicon == 'string') {
			koa.use(Favicon(favicon));

			logDebug(this.TT('initFavicon'), this.TT('initFaviconParam', { favicon }));
		}
	}

	/**
	 * init Harb
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

				logInfo(this.TT('initHarb'), '✔ ');
			}
			catch(error) {
				logFatal(this.TT('initHarb'), error);
			}
		}
	}


	/**
	 * init server
	 * @async
	 */
	async initServer() {
		const { C: { host, port }, server, koa, logFatal } = this;

		// request listen
		server.on('request', koa.callback());

		// listen error
		server.on('error', error => {
			if(error.code == 'EADDRINUSE') {
				logFatal(this.TT('listenPort', { url: `${this.protocol}://${host}:${port}` }), this.TT('listenPortError'));
			}
			else {
				logFatal(this.TT('listenPort', { url: `${this.protocol}://${host}:${port}` }), error);
			}

			process.exit();
		});
	}

	/** init logger */
	initLogger() {
		const { C: { logger } } = this;

		// log close
		if(logger === false) {
			this.logTrace = () => { };
			this.logDebug = () => { };
			this.logInfo = () => { };
			this.logError = () => { };
			this.logWarn = () => { };
			this.logFatal = () => { };
			this.logMark = () => { };
		}
		// log by single function
		else if(typeof logger == 'function') {
			this.logTrace = (...params) => logger(this.nameLog, ...params);
			this.logDebug = (...params) => logger(this.nameLog, ...params);
			this.logInfo = (...params) => logger(this.nameLog, ...params);
			this.logError = (...params) => logger(this.nameLog, ...params);
			this.logWarn = (...params) => logger(this.nameLog, ...params);
			this.logFatal = (...params) => logger(this.nameLog, ...params);
			this.logMark = (...params) => logger(this.nameLog, ...params);
		}
		// classify log
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
