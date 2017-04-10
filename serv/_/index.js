module.exports = ($, router) =>
	router.get('/', async(ctx) => {
		ctx.redirect('/kq');
	});