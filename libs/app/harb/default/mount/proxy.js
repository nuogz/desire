module.exports = function($) {
	let { G, R, Router, Multer } = $;

	let Axios = require('axios');
	let FormData = require('form-data');

	return async function(rout) {
		G.trace(`加载 [代理], ID: {${rout.id}}, 路径: {${rout.path}}`);

		if(rout._stat.upload == 1) {
			Router[rout.method](rout.path, Multer.any());
		}

		Router[rout.method](rout.path, async function(ctx, next) {
			ctx.rout = rout;

			await next();

			if(!ctx.access) {
				ctx.status = 403;

				return;
			}

			let raw = ctx.raw;

			let files = ctx.req.files;
			let form = {};

			if(ctx.req.body) {
				for(let key in ctx.req.body) {
					raw[key] = ctx.req.body[key];
				}
			}

			if(files) {
				if(rout.proxy.host == '127.0.0.1' || rout.proxy.host == '0.0.0.0') {
					raw._files = files;
				}
				else {
					form = new FormData();

					for(let file of files) {
						form.append(file.fieldname, _fs.createReadStream(R($.C.path.temp, file.filename)), { filename: file.filename });
					}
				}
			}

			if(rout.type == 4 && (rout.proxy.host == '127.0.0.1' || rout.proxy.host == '0.0.0.0')) {
				raw._local = true;
			}
			else {
				raw._local = false;
			}

			let url = `http://${rout.proxy.host}:${rout.proxy.port}/${rout.way || rout.proxy.prefix + rout.path}`;

			let result;

			if(rout.method == 'post' && form instanceof FormData) {
				result = await Axios.post(url, raw, { headers: form.getHeaders() });
			}
			else if(rout.method == 'post') {
				result = await Axios.post(url, raw, {});
			}
			else if(rout.method == 'get') {
				result = await Axios.get(url, { params: raw }, {});
			}

			if(rout.type != 4) {
				ctx.type = 'json';

				ctx.body = result.data;
			}
			else {
				if(result.data && result.data.data && result.data.data.length) {
					for(let url of result.data.data) {
						if(url.startsWith('http')) {
							try {
								ctx.body = (await Axios.get({
									url: url,
									responseType:'stream'
								})).data;

								ctx.attachment(_pa.parse(url).base);

								break;
							}
							catch(e) {
								continue;
							}
						}
						else {
							try {
								let stat = _fs.statSync(url);

								ctx.lastModified = new Date(stat.mtime);

								ctx.attachment(_pa.parse(url).base);
								ctx.body = _fs.createReadStream(url);

								break;
							}
							catch(e) {
								continue;
							}
						}
					}
				}
				else {
					ctx.status = 404;
				}
			}


		});
	};
};