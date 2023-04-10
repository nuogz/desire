export default class Desire {
    /** @type {Koa.Context} */
    static KoaContext: Koa.Context;
    /** @type {Koa.Response} */
    static KoaResponse: Koa.Response;
    /** @type {Koa.Request} */
    static KoaRequest: Koa.Request;
    /** @param {DesireOption} [option] */
    constructor(option?: DesireOption);
    /** @type {DesireOption} */
    optionRaw: DesireOption;
    /** @type {import('http').Server | import('http2').Http2Server} */
    server: import('http').Server | import('http2').Http2Server;
    /** @type {Koa} */
    koa: Koa;
    /** @type {string} */
    name: string;
    /** @type {string} */
    host: string;
    /** @type {number} */
    port: number;
    /** @type {ModuleOption} */
    option: ModuleOption;
    /** @type {Object} */
    optionHarbour: any;
    /** @type {Object} */
    harbour: any;
    /** @type {Function|string} */
    Harbour: Function | string;
    /** @type {Function|string} */
    HarbourImport: Function | string;
    /** @type {LoggerLike} */
    logTrace: LoggerLike;
    /** @type {LoggerLike} */
    logDebug: LoggerLike;
    /** @type {LoggerLike} */
    logInfo: LoggerLike;
    /** @type {LoggerLike} */
    logError: LoggerLike;
    /** @type {LoggerLike} */
    logWarn: LoggerLike;
    /** @type {LoggerLike} */
    logFatal: LoggerLike;
    /** @type {LoggerLike} */
    logMark: LoggerLike;
    initBase(): void;
    initFavicon(): void;
    initHeader(): Promise<void>;
    /** server protocol */
    get protocol(): "http2" | "http";
    /** start server */
    start(): Promise<Desire>;
    /** init Harbour */
    initHarbour(): Promise<void>;
    initServer(): void;
}
export type LoggerLike = import('@nuogz/utility/src/injectBaseLogger.js').LoggerLike;
export type LoggerOption = import('@nuogz/utility/src/injectBaseLogger.js').LoggerOption;
/**
 * should equivalent to the first argument of `new Koa(option)`
 */
export type KoaOption = {
    env?: string;
    keys?: string[];
    proxy?: boolean;
    subdomainOffset?: number;
    proxyIpHeader?: string;
    maxIpsCount?: number;
};
/**
 * should equivalent to the argument of `new KoaFavicon(path, { maxage })`
 */
export type KoaFaviconOption = {
    path: string;
    /**
     * ms
     */
    maxage?: number;
};
export type DesireExtendDisableOption = {
    disable?: boolean;
};
export type ModuleOption = {
    /**
     * node module HTTP option
     */
    http?: import('http').ServerOptions;
    /**
     * node module HTTP2 option
     */
    http2?: import('http2').SecureServerOptions & DesireExtendDisableOption;
    /**
     * module `koa` option
     */
    koa?: KoaOption;
    /**
     * module `koa-compress` option
     */
    compress?: KoaCompress.CompressOptions & DesireExtendDisableOption;
    /**
     * module `@koa/cors` option
     */
    cors?: KoaCors.Options & DesireExtendDisableOption;
    /**
     * module `koa-helmet` contentSecurityPolicy option
     */
    csp?: KoaHelmet.KoaHelmetContentSecurityPolicyConfiguration & DesireExtendDisableOption;
    /**
     * module `koa-favicon` option or favicon path
     */
    favicon?: (KoaFaviconOption & DesireExtendDisableOption) | string;
};
/**
 * Desire constructor option
 */
export type DesireOption = {
    /**
     * name for server. Used to log output
     */
    name?: string;
    /**
     * listen host
     */
    host?: string;
    /**
     * listen port
     */
    port?: number;
    module?: ModuleOption;
    /**
     * Harbour Option
     */
    harbour?: any;
    /**
     * the interface and folder mapping initializer, called `Harbour`, which is used to apply options to the `koajs` instance, and is invoked by passing an instance of `koajs`. pass string `'default'`, `''` or undefined will use module `@nuogz/desire-harbour`; pass a `string` will try to import a module with the same name as the option；pass a `class` will be created and then call its `init()` method; pass a `function` will be called directly
     */
    Harbour?: Function | string;
    logger?: LoggerOption;
};
import Koa from "koa";
import KoaCompress from "koa-compress";
import KoaCors from "@koa/cors";
import KoaHelmet from "koa-helmet";
