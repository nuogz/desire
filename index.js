import { readFileSync } from 'fs';
import { createServer } from 'http';
import { createSecureServer } from 'http2';
import { dirname, resolve as resolvePath } from 'path';
import { fileURLToPath } from 'url';

import Koa from 'koa';


import KoaCompress from 'koa-compress';
import KoaCORS from '@koa/cors';
import KoaHelmet from 'koa-helmet';
import KoaFavicon from 'koa-favicon';

import KoaContext from 'koa/lib/context';
import KoaResponse from 'koa/lib/response';
import KoaRequest from 'koa/lib/request';

import { loadI18NResource, TT } from '@nuogz/i18n';

import { injectBaseLogger } from '@nuogz/utility';



/** @typedef {import('./bases.d.ts').ConstructorOption} ConstructorOption */
/** @typedef {import('./bases.d.ts').ModuleOptionExtend} ModuleOptionExtend */
/** @typedef {import('./bases.d.ts').ModulesOption} ModulesOption */
/** @typedef {import('./bases.d.ts').KoaConstructorOption} KoaConstructorOption */
/** @typedef {import('./bases.d.ts').KoaFaviconOption} KoaFaviconOption */

/** @typedef {Koa.Context} KoaContext */
/** @typedef {Koa.Response} KoaResponse */
/** @typedef {Koa.Request} KoaRequest */

/** @typedef {import('@nuogz/utility/src/inject-base-logger.pure.js').LoggerLike} LoggerLike */
/** @typedef {import('@nuogz/utility/src/inject-base-logger.pure.js').LoggerOption} LoggerOption */



loadI18NResource('@nuogz/desire', resolvePath(dirname(fileURLToPath(import.meta.url)), 'locale'));

const T = TT('@nuogz/desire');


/**
 * @param {string} key
 * @param {Object} object
 * @returns {boolean}
 */
const hasOption = (key, object) => key in object && object[key] !== undefined;



export default class Desire {
	/** @type {ConstructorOption} */
	optionRaw;


	/** @type {import('http').Server|import('http2').Http2Server} */
	server;
	/** @type {Koa} */
	koa;


	/** @type {string} */
	name = T('Server');


	/** @type {string} */
	host;
	/** @type {number} */
	port;



	/** @type {ModulesOption} */
	option = {};


	/** @type {Object} */
	optionHarbour = {};
	/** @type {Object} */
	harbour;
	/** @type {Function|string} */
	Harbour = 'default';
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



	/** @param {ConstructorOption} [option] */
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


		const willUseHTTP2 = http2 && http2.disable !== false;
		if(willUseHTTP2) {
			http2.key = typeof http2.key == 'string'
				? readFileSync(http2.key)
				: http2.key;
			http2.cert = typeof http2.cert == 'string'
				? readFileSync(http2.cert)
				: http2.cert;
		}


		this.server = willUseHTTP2 ? createSecureServer(http2) : createServer(http);


		this.koa = new Koa(koa);
	}

	initFavicon() {
		const { option: { favicon }, koa, logDebug } = this;

		if(favicon === true) { return; }


		if(typeof favicon == 'string') {
			koa.use(KoaFavicon(favicon));
		}
		else {
			koa.use(KoaFavicon(favicon.path, { maxage: favicon.maxage, mime: favicon.mime }));
		}

		logDebug(T('initFavicon'), T('initFaviconArgument', { favicon: favicon.path || favicon }));
	}

	async initHeader() {
		const { option: { compress, cors, csp }, koa } = this;


		// ZLIB compress (disable default)
		if(compress && compress.disable !== false) {
			const { constants } = await import('zlib');

			koa.use(KoaCompress(Object.assign({}, compress, {
				threshold: 2048,
				gzip: { flush: constants.Z_SYNC_FLUSH },
				deflate: { flush: constants.Z_SYNC_FLUSH },
			})));
		}


		// CORS header (enable default)
		if(cors?.disable !== false) {
			koa.use(KoaCORS(cors));
		}


		// HSTS header (enable default)
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



	/** Server protocol */
	get protocol() { return typeof this.option.http2 == 'object' && this.option.http2 !== null ? 'http2' : 'http'; }


	/** Start server */
	async start() {
		const { host, port, server, logFatal, logInfo } = this;


		try {
			await this.initHarbour();

			this.initServer();


			// listen port
			await new Promise((resolver, rejecter) =>
				server.listen(port, host, error => error ? rejecter(error) : resolver())
			);


			logInfo(T('listen', { url: `${this.protocol}://${host == '0.0.0.0' ? 'localhost' : host}:${port}` }), `✔ `);
		}
		catch(error) {
			logFatal(T('listen', { url: `${this.protocol}://${host}:${port}` }), error);
		}


		return this;
	}


	async initHarbour() {
		const { optionHarbour: option, logFatal, logInfo } = this;

		if(option === false) { return; }


		let { Harbour } = this;
		try {
			if(typeof Harbour == 'string' && Harbour != 'default') {
				Harbour = this.HarbourImport = (await import(Harbour)).default;
			}


			if(typeof Harbour == 'function') {
				if(Reflect.getOwnPropertyDescriptor(Harbour, 'prototype')) {
					this.harbour = await new Harbour(this, option);

					await this.harbour.init(this, option);
				}
				else {
					this.harbour = await Harbour(this, option);
				}
			}

			else if(Harbour == 'default') {
				Harbour = this.HarbourImport = (await import('@nuogz/desire-harbour')).default;

				this.harbour = await new Harbour(this, option);

				await this.harbour.init(this, option);
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



export {
	Koa,
	KoaContext, KoaResponse, KoaRequest,
	KoaCompress, KoaCORS, KoaHelmet, KoaFavicon
};
