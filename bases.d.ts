import KoaCompress from 'koa-compress';
import KoaCORS from '@koa/cors';
import KoaHelmet from 'koa-helmet';



/** Desire constructor options */
export type ConstructorOption = {
	/** Name for server. Used to log */
	name?: string | undefined;

	/** Server listen host */
	host?: string | undefined;

	/** Server listen port */
	port?: number | undefined;

	/** Options passed to modules used by Desire */
	module?: ModulesOption | undefined;

	/** Harbour options */
	harbour?: Object | undefined;

	/** the interface and folder mapping initializer, called `Harbour`, which is used to apply options to the `koajs` instance, and is invoked by passing an instance of `koajs`. pass string `'default'`, `''` or undefined will use module `@nuogz/desire-harbour`; pass a `string` will try to import a module with the same name as the option；pass a `class` will be created and then call its `init()` method; pass a `function` will be called directly */
	Harbour?: string | Function | undefined;

	/** Base logger options */
	logger?: import("@nuogz/utility/src/inject-base-logger.pure.js").LoggerOption | undefined;
};


/** Options passed to modules used by `Desire` */
export type ModulesOption = {
	/** Node module HTTP options */
	http?: import("http").ServerOptions<typeof import("http").IncomingMessage, typeof import("http").ServerResponse> | undefined;

	/** Node module HTTP2 options */
	http2?: (import("http2").SecureServerOptions & ModuleOptionExtend) | undefined;

	/** Module `koa` options */
	koa?: KoaConstructorOption | undefined;

	/** Module `koa-compress` options */
	compress?: (KoaCompress.CompressOptions & ModuleOptionExtend) | undefined;

	/** Module `@koa/cors` options */
	cors?: (KoaCORS.Options & ModuleOptionExtend) | undefined;

	/** Module `koa-helmet` contentSecurityPolicy options */
	csp?: (KoaHelmet.KoaHelmetContentSecurityPolicyConfiguration & ModuleOptionExtend) | undefined;

	/** Module `koa-favicon` options or favicon path */
	favicon?: string | (KoaFaviconOption & ModuleOptionExtend) | undefined;
};


/** Options that will affect how `Desire` uses these modules are passed along with the modules options */
export type ModuleOptionExtend = {
	/**
	 * - `undefined`, enable this module (default)
	 * - `false`, enable this module
	 * - `true`, disable this module
	 */
	disable?: boolean | undefined;
};


/** Should equivalent to the first argument of `new Koa(option)` */
export type KoaConstructorOption = {
	/** Environment */
	env?: string | undefined;

	/** Signed cookie keys */
	keys?: string[] | undefined;

	/** Trust proxy headers */
	proxy?: boolean | undefined;

	/** Subdomain offset */
	subdomainOffset?: number | undefined;

	/** Proxy IP header, defaults to X-Forwarded-For */
	proxyIpHeader?: string | undefined;

	/** Max IPs read from proxy IP header, default to 0 (means infinity) */
	maxIpsCount?: number | undefined;

	/** Enable AsyncLocalStorage */
	asyncLocalStorage?: boolean | undefined;
};

/** Should equivalent to the argument of `new KoaFavicon(path, { maxage, mime })` */
export type KoaFaviconOption = {
	/** The path of the favicon file */
	path: string;

	/** `cache-control` `max-age` directive in millisecond, defaulting to 1 day */
	maxage?: number | undefined;

	/** MIME type of the file at path, defaulting to image/x-icon */
	mime?: string | undefined;
};
