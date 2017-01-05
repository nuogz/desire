module.exports = () => {
	let http = require('http'), https = require('https'), mount = require('koa-mount'),
		app = koa(), app2 = koa();

	let subs = {};

	app.use(require('koa-compress')({ threshold: 2048, flush: require('zlib').Z_SYNC_FLUSH }));

	let paths = fs.readdirSync(path.join(_d, 'serv'));

	for(let p of paths) {
		let conf = require(path.join(_d, 'serv', p, 'conf.json'));

		let $ = subs[p] = {
			pa: function(paths) {
				return path.join.apply(this, [_d, 'serv', conf.pathServ].concat(paths.split('/')));
			},
			rq: function(paths) {
				let obj = require(path.join.apply(this, [_d, 'serv', conf.pathServ].concat(paths.split('/'))));
				return (obj instanceof Function)? obj($) : obj;
			},
			conf: conf
		};

		app.use(mount(conf.pathServ, $.koa = require(path.join(_d, 'serv', p))($)));

		_l('subServer', p, 'loaded, path is', conf.pathServ);
	}

	app2.use(function*(next) {
		yield next;

		this.status = 301;
		this.redirect('https://danor.top'+this.req.url);
	});

	https.createServer({
		key: fs.readFileSync('/etc/letsencrypt/live/danor.top/privkey.pem'),  //ssl文件路径
		cert: fs.readFileSync('/etc/letsencrypt/live/danor.top/fullchain.pem')  //ssl文件路径
	}, app.callback()).listen(443);

	http.createServer(app2.callback()).listen(80);

	try {
		let env = process.env,
			uid = parseInt(env['SUDO_UID'] || process.getuid(), 10),
			gid = parseInt(env['SUDO_GID'] || process.getgid(), 10);

		process.setgid(gid);
		process.setuid(uid);
	}
	catch(e) { true; }

	_l('website started on 0.0.0.0:80');
};