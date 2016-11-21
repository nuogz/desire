module.exports = ($) => {
	let app = koa(), router = koaRouter();

	let time = new Date();

	router.post('/push', function*(next) {
		yield next;

		_l('webhook');

		require('child_process').spawn('sh', [$.pa('webhook.sh')]);

		this.body = 'webhook';
	});

	router.get('/time', function*(next) {
		yield next;

		this.body = Math.round((new Date().getTime() - time.getTime()) / 1000);
	});

	return app.use(router.routes()).use(router.allowedMethods());
};