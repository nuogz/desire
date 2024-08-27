export default class Desire {
    /** @param {ConstructorOption} [option] */
    constructor(option?: import("./bases.d.ts").ConstructorOption | undefined);
    /** @type {ConstructorOption} */
    optionRaw: ConstructorOption;
    /** @type {import('http').Server|import('http2').Http2Server} */
    server: import("http").Server | import("http2").Http2Server;
    /** @type {Koa} */
    koa: Koa;
    /** @type {string} */
    name: string;
    /** @type {string} */
    host: string;
    /** @type {number} */
    port: number;
    /** @type {ModulesOption} */
    option: ModulesOption;
    /** @type {Object} */
    optionHarbour: Object;
    /** @type {Object} */
    harbour: Object;
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
    /** Server protocol */
    get protocol(): "http2" | "http";
    /** Start server */
    start(): Promise<this>;
    initHarbour(): Promise<void>;
    initServer(): void;
}
export type KoaContext = Koa.Context;
export type KoaResponse = Koa.Response;
export type KoaRequest = Koa.Request;
export type ConstructorOption = import("./bases.d.ts").ConstructorOption;
export type ModuleOptionExtend = import("./bases.d.ts").ModuleOptionExtend;
export type ModulesOption = import("./bases.d.ts").ModulesOption;
export type KoaConstructorOption = import("./bases.d.ts").KoaConstructorOption;
export type KoaFaviconOption = import("./bases.d.ts").KoaFaviconOption;
export type LoggerLike = import("@nuogz/utility/types/src/inject-base-logger.pure.js").LoggerLike;
export type LoggerOption = import("@nuogz/utility/types/src/inject-base-logger.pure.js").LoggerOption;
import Koa from 'koa';
import KoaCompress from 'koa-compress';
import KoaCORS from '@koa/cors';
import KoaHelmet from 'koa-helmet';
import KoaFavicon from 'koa-favicon';
export { Koa, KoaCompress, KoaCORS, KoaHelmet, KoaFavicon };
