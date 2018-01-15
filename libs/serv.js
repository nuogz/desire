let getPems = () => {
	let result;

	try {
		result = {
			key: fs.readFileSync('/etc/letsencrypt/live/danor.top/privkey.pem'),
			cert: fs.readFileSync('/etc/letsencrypt/live/danor.top/fullchain.pem')
		};
	}
	catch(e) {
		result = {
			key: fs.readFileSync('D:/Runtime/Pem/privkey.pem'),
			cert: fs.readFileSync('D:/Runtime/Pem/fullchain.pem')
		};
	}

	return result;
};

module.exports = async() => {
	let http1 = require('http'), http2 = require('http2'), socketIO = require('socket.io'),
		Koa = require('koa'), Router = require('koa-router'), helmet = require('koa-helmet'),
		mount = require('koa-mount'), static = require('koa-static'), favicon = require('koa-favicon'),
		getDB = require(path.join(_d, 'libs', 'db')),
		app1 = new Koa(), app2 = new Koa(), sio = new socketIO();

	let subs = {};

	app1.use(favicon(path.join(_d, 'favicon.ico')));
	app1.use(require('koa-compress')({ threshold: 2048, flush: require('zlib').Z_SYNC_FLUSH }));
	app1.use(require('koa-bodyparser')());

	app2.use(favicon(path.join(_d, 'favicon.ico')));
	app2.use(require('koa-compress')({ threshold: 2048, flush: require('zlib').Z_SYNC_FLUSH }));
	app2.use(require('koa-compress')({ threshold: 2048, flush: require('zlib').Z_SYNC_FLUSH }));
	app2.use(require('koa-bodyparser')());

	app1.use(helmet.hsts({
		maxAge: 15768001
	}));
	app2.use(helmet.hsts({
		maxAge: 15768001
	}));

	let paths = fs.readdirSync(path.join(_d, 'serv'));

	for(let p of paths) {

		let conf;

		try {
			conf = require(path.join(_d, 'serv', p, 'conf.json'));
			if(!conf.pathServ) throw 1;
		}
		catch(e) {
			continue;
		}

		let koa = new Koa(), router = Router({ prefix: conf.pathServ }),
			app = conf.http1 ? app1 : app2;

		let $ = subs[p] = {
			pa: async(paths) => {
				return path.join.apply(this, [_d, 'serv', p].concat(paths.split('/')));
			},
			rq: async(paths, reload, repath) => {
				let pathRequire = path.join.apply(this, [_d, 'serv', p].concat(paths.split('/')));

				if(repath) return pathRequire;

				if(reload) delete require.cache[require.resolve(pathRequire)];

				let obj = require(pathRequire);

				return (obj instanceof Function) ? obj($) : obj;
			},
			st: async(path, option) => {
				app.use(mount(conf.pathServ, static(path, option)));
			},
			io: async(handler) => {
				sio.on('connection', async(socket) => {
					let handles = await handler(async(event, ...args) => {
						socket.emit(`${conf.pathServ.replace(/\//g,'')}-${event}`, ...args);
					});

					for(let event in handles)
						socket.on(`${conf.pathServ.replace(/\//g,'')}-${event}`, handles[event]);
				});
			},
			conf: conf,
			koa: koa
		};

		if(conf.db) {
			let auth = require(path.join(_d, 'serv', p, '.auth.json'));

			$.db = await getDB({
				name: conf.db,
				user: auth.user,
				pswd: auth.pswd
			});
		}

		await require(path.join(_d, 'serv', p))($, router);
		app.use(router.routes());

		L('subServer', p, 'loaded, path is', conf.pathServ);
	}

	sio.on('connection', async(socket) => {
		socket.on('ready', () => socket.emit('ready'));

		socket.emit('ready');
	});

	app1.use(async(ctx, next) => {
		await next();

		ctx.status = 301;
		ctx.redirect('https://'+ctx.accept.headers.host+ctx.req.url);
	});

	let serv1 = http1.createServer(app1.callback()),
		serv2 = http2.createSecureServer(getPems(), app2.callback());

	sio.attach(serv2);

	serv1.listen(80);
	serv2.listen(443);

	try {
		let env = process.env,
			uid = parseInt(env['SUDO_UID'] || process.getuid(), 10),
			gid = parseInt(env['SUDO_GID'] || process.getgid(), 10);

		process.setgid(gid);
		process.setuid(uid);
	}
	catch(e) { true; }

	L('website started');
};