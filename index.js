import { readFileSync } from 'fs';
import { createServer } from 'http';
import { createSecureServer } from 'http2';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import Koa from 'koa';


import KoaCompress from 'koa-compress';
import KoaCors from '@koa/cors';
import KoaHelmet from 'koa-helmet';
import KoaFavicon from 'koa-favicon';

import KoaContext from 'koa/lib/context';
import KoaResponse from 'koa/lib/response';
import KoaRequest from 'koa/lib/request';

import { loadI18NResource, TT } from '@nuogz/i18n';

import { injectBaseLogger } from '@nuogz/utility';



/** @typedef {import('@nuogz/utility/src/injectBaseLogger.js').LoggerLike} LoggerLike */
/** @typedef {import('@nuogz/utility/src/injectBaseLogger.js').LoggerOption} LoggerOption */


/**
 * should equivalent to the first argument of `new Koa(option)`
 * @typedef {Object} KoaOption
 * @property {string} [env]
 * @property {string[]} [keys]
 * @property {boolean} [proxy]
 * @property {number} [subdomainOffset]
 * @property {string} [proxyIpHeader]
 * @property {number} [maxIpsCount]
 */

/**
 * should equivalent to the argument of `new KoaFavicon(path, { maxage })`
 * @typedef {Object} KoaFaviconOption
 * @property {string} path
 * @property {number} [maxage] ms
 */


/**
 * @typedef {Object} DesireExtendDisableOption
 * @property {boolean} [disable]
 */

/**
 * @typedef {Object} ModuleOption
 *
 * @property {import('http').ServerOptions} [http] node module HTTP option
 * @property {import('http2').SecureServerOptions & DesireExtendDisableOption} [http2] node module HTTP2 option
 *
 * @property {KoaOption} [koa] module `koa` option
 *
 * @property {KoaCompress.CompressOptions & DesireExtendDisableOption} [compress] module `koa-compress` option
 * @property {KoaCors.Options & DesireExtendDisableOption} [cors] module `@koa/cors` option
 * @property {KoaHelmet.KoaHelmetContentSecurityPolicyConfiguration & DesireExtendDisableOption} [csp] module `koa-helmet` contentSecurityPolicy option
 * @property {(KoaFaviconOption & DesireExtendDisableOption) | string} [favicon] module `koa-favicon` option or favicon path
 */


/**
 * Desire constructor option
 * @typedef {Object} DesireOption
 *
 * @property {string} [name] name for server. Used to log output
 *
 * @property {string} [host] listen host
 * @property {number} [port] listen port
 *
 * @property {ModuleOption} [module={}]
 *
 * @property {Object | import('@nuogz/desire-harbour').HarbourOption} [harbour] Harbour Option
 * @property {Function | string} [Harbour] the interface and folder mapping initializer, called `Harbour`, which is used to apply options to the `koajs` instance, and is invoked by passing an instance of `koajs`. pass string `'default'`, `''` or undefined will use module `@nuogz/desire-harbour`; pass a `string` will try to import a module with the same name as the option；pass a `class` will be created and then call its `init()` method; pass a `function` will be called directly
 *
 * @property {LoggerOption} [logger]
 */



loadI18NResource('@nuogz/desire', resolve(dirname(fileURLToPath(import.meta.url)), 'locale'));

const T = TT('@nuogz/desire');


const hasOption = (key, object) => key in object && object[key] !== undefined;



export default class Desire {
	/** @type {Koa.Context} */
	static KoaContext = KoaContext;
	/** @type {Koa.Response} */
	static KoaResponse = KoaResponse;
	/** @type {Koa.Request} */
	static KoaRequest = KoaRequest;



	/** @type {DesireOption} */
	optionRaw;


	/** @type {import('http').Server | import('http2').Http2Server} */
	server;
	/** @type {Koa} */
	koa;


	/** @type {string} */
	name = T('Server');


	/** @type {string} */
	host;
	/** @type {number} */
	port;



	/** @type {ModuleOption} */
	option = {};


	/** @type {Object} */
	optionHarbour = {};
	/** @type {Object} */
	harbour;
	/** @type {Function|string} */
	Harbour;
	/** @type {Function|string} */
	HarbourImport;



	/** @type {LoggerLike} */
	logTrace;
	/** @type {LoggerLike} */
	logDebug;
	/** @type {LoggerLike} */
	logInfo;
	/** @type {LoggerLike} */
	logError;
	/** @type {LoggerLike} */
	logWarn;
	/** @type {LoggerLike} */
	logFatal;
	/** @type {LoggerLike} */
	logMark;



	/** @param {DesireOption} [option] */
	constructor(option = {}) {
		this.optionRaw = option;


		this.name = hasOption('name', option) ? option.name : this.name;

		this.host = hasOption('host', option) ? option.host : this.host;
		this.port = hasOption('port', option) ? option.port : this.port;


		this.option = hasOption('module', option) ? option.module : this.option;


		this.optionHarbour = hasOption('harbour', option) ? option.harbour : this.optionHarbour;
		this.Harbour = hasOption('Harbour', option) ? option.Harbour : this.Harbour;


		injectBaseLogger(this, Object.assign({ name: this.name }, option.logger));



		this.initBase();

		this.initFavicon();

		return this.initHeader()
			.then(() => this);
	}


	initBase() {
		const { option: { koa, http, http2 } } = this;

		const useHTTP2 = http2 && http2.disable !== false;


		if(useHTTP2) {
			http2.key = typeof http2.key == 'string'
				? readFileSync(http2.key)
				: http2.key;
			http2.cert = typeof http2.cert == 'string'
				? readFileSync(http2.cert)
				: http2.cert;
		}


		this.server = useHTTP2 ? createSecureServer(http2) : createServer(http);


		this.koa = new Koa(koa);
	}

	initFavicon() {
		const { option: { favicon }, koa, logDebug } = this;


		if(favicon && favicon?.disable !== false) {
			if(typeof favicon == 'string') {
				koa.use(KoaFavicon(favicon));
			}
			else {
				koa.use(KoaFavicon(favicon.path, { maxage: favicon.maxage }));
			}

			logDebug(T('initFavicon'), T('initFaviconArgument', { favicon: favicon.path || favicon }));
		}
	}

	async initHeader() {
		const { option: { compress, cors, csp }, koa } = this;


		// ZLIB compress
		if(compress && compress.disable !== false) {
			const { constants } = await import('zlib');

			koa.use(KoaCompress(Object.assign({}, compress, {
				threshold: 2048,
				gzip: { flush: constants.Z_SYNC_FLUSH },
				deflate: { flush: constants.Z_SYNC_FLUSH },
			})));
		}


		// CORS header
		if(cors?.disable !== false) {
			koa.use(KoaCors(cors));
		}


		// HSTS header
		if(csp?.disable !== false) {
			koa.use(KoaHelmet.contentSecurityPolicy(Object.assign({}, csp, {
				directives: {
					defaultSrc: ['\'self\'', '\'unsafe-inline\'', '\'unsafe-eval\''],
					objectSrc: ['\'none\''],
					scriptSrc: ['\'self\'', '\'unsafe-inline\'', '\'unsafe-eval\''],
					styleSrc: ['\'self\'', 'https:', '\'unsafe-inline\''],
					imgSrc: ['\'self\'', 'https:', 'data:', 'blob:', 'mediastream:', 'filesystem:'],
					fontSrc: ['\'self\'', 'https:', 'data:', 'blob:', 'mediastream:', 'filesystem:'],
				},
			})));

			koa.use(KoaHelmet.frameguard());
			koa.use(KoaHelmet.hidePoweredBy());
			koa.use(KoaHelmet.hsts());
			koa.use(KoaHelmet.ieNoOpen());
			koa.use(KoaHelmet.noSniff());
			koa.use(KoaHelmet.permittedCrossDomainPolicies());
			koa.use(KoaHelmet.referrerPolicy());
			koa.use(KoaHelmet.xssFilter());
		}
	}



	/** server protocol */
	get protocol() { return typeof this.option.http2 == 'object' && this.option.http2 != null ? 'http2' : 'http'; }


	/** start server */
	async start() {
		const { host, port, server, logFatal, logInfo } = this;


		try {
			await this.initHarbour();

			this.initServer();

			// listen port
			await new Promise((resolve, reject) =>
				server.listen(port, host, error => error ? reject(error) : resolve())
			);


			logInfo(T('listen', { url: `${this.protocol}://${host == '0.0.0.0' ? 'localhost' : host}:${port}` }), `✔ `);
		}
		catch(error) {
			logFatal(T('listen', { url: `${this.protocol}://${host}:${port}` }), error);
		}


		return this;
	}


	/** init Harbour */
	async initHarbour() {
		const { optionHarbour: option, logFatal, logInfo } = this;
		let { Harbour } = this;


		if(option === false) { return; }


		try {
			if(Harbour != 'default' && Harbour != '' && typeof Harbour == 'string') {
				Harbour = this.HarbourImport = (await import(Harbour)).default;
			}
			else {
				Harbour = this.HarbourImport = (await import('@nuogz/desire-harbour')).default;
			}


			if(typeof Harbour == 'function' && Reflect.getOwnPropertyDescriptor(Harbour, 'prototype')) {
				this.harbour = await new Harbour(this, option);

				await this.harbour.init(this, option);
			}
			else if(typeof Harbour == 'function') {
				this.harbour = await Harbour(this, option);
			}
			else {
				throw Error(T('invalidHarbour', { value: Harbour }));
			}

			logInfo(T('initHarbour'), '✔ ');
		}
		catch(error) {
			logFatal(T('initHarbour'), error);
		}
	}


	initServer() {
		const { host, port, server, koa, logFatal } = this;


		// request listen
		server.on('request', koa.callback());

		// listen error
		server.on('error', error => {
			if(error.code == 'EADDRINUSE') {
				logFatal(T('listen', { url: `${this.protocol}://${host}:${port}` }), T('listenError'));
			}
			else {
				logFatal(T('listen', { url: `${this.protocol}://${host}:${port}` }), error);
			}

			server.close();
		});
	}
}
