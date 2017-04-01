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

module.exports = () => {
	let http = require('http'), http2 = require('http2'), mount = require('koa-mount'),
		app = koa(), app2 = koa();

	let subs = {};

	app.use(require('koa-compress')({ threshold: 2048, flush: require('zlib').Z_SYNC_FLUSH }));
	app.use(require('koa-bodyparser')());

	let paths = fs.readdirSync(path.join(_d, 'serv'));

	for(let p of paths) {
		let conf = require(path.join(_d, 'serv', p, 'conf.json'));

		let $ = subs[p] = {
			pa: function(paths) {
				return path.join.apply(this, [_d, 'serv', p].concat(paths.split('/')));
			},
			rq: function(paths, reload, repath) {
				let pathRequire = path.join.apply(this, [_d, 'serv', p].concat(paths.split('/')));

				if(repath) return pathRequire;

				if(reload) delete require.cache[require.resolve(pathRequire)];

				let obj = require(pathRequire);

				return (obj instanceof Function) ? obj($) : obj;
			},
			conf: conf
		};

		app.use(mount(conf.pathServ, $.koa = require(path.join(_d, 'serv', p))($)));

		_l('subServer', p, 'loaded, path is', conf.pathServ);
	}

	app2.use(function*(next) {
		yield next;

		this.status = 302;
		this.redirect('https://danor.top'+this.req.url);
	});

	http2.createServer(getPems(), app.callback()).listen(443);

	http.createServer(app2.callback()).listen(80);

	try {
		let env = process.env,
			uid = parseInt(env['SUDO_UID'] || process.getuid(), 10),
			gid = parseInt(env['SUDO_GID'] || process.getgid(), 10);

		process.setgid(gid);
		process.setuid(uid);
	}
	catch(e) { true; }

	_l('website started');
};