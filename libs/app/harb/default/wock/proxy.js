module.exports = function($, wockInfo) {
	let { G, WockMan } = $;

	let Axios = require('axios');

	return async function(rout) {
		G.trace(`加载 [Wock代理], ID: {${rout.id}}, 路径: {${rout.path}}`);

		let funcArr = [
			...wockInfo.before,
			async function(raw) {
				if(rout.type == 4 && (rout.proxy.host == '127.0.0.1' || rout.proxy.host == '0.0.0.0')) {
					raw._local = true;
				}
				else {
					raw._local = false;
				}

				let url = `http://${rout.proxy.host}:${rout.proxy.port}/${rout.way || rout.proxy.prefix + rout.path}`;

				if(rout.method == 'post') {
					return await Axios.post(url, raw, {});
				}
				else if(rout.method == 'get') {
					return await Axios.get(url, { params: raw }, {});
				}
			},
			...wockInfo.after
		];

		WockMan.add(rout.path, async function(wock, raw) {
			let result = raw;

			raw._rout = rout;

			try {
				for(let func of funcArr) {
					result = await func(result);
				}
			}
			catch(error) { true; }
			finally {
				wock.send(JSON.stringify({ type: rout.path, data: result }));
			}
		});
	};
};