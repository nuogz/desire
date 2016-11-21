module.exports = () => {
	let app = koa(), router = koaRouter();

	router.get('/', function*(next) {
		yield next;

		this.status = 301;
		this.redirect('/kq');
	});

	return app.use(router.routes()).use(router.allowedMethods());
};