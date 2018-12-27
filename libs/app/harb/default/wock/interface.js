module.exports = async function($, wockInfo) {
	let { G, WockMan } = $;

	return async function(rout) {
		let func = rout.func;

		if(!func) {
			G.warn(`加载 [Wock接口], ID: {${rout.id}}, 路径: {${rout.path}}, 错误: 缺少对应的[流程]代码`);

			return;
		}
		else {
			G.trace(`加载 [Wock接口], ID: {${rout.id}}, 路径: {${rout.path}}`);
		}

		let funcArr = [
			...wockInfo.before,
			func,
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