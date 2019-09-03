module.exports = async function($, wockInfo = {}) {
	let { G, WockMan } = $;

	return async function(rout) {
		let func = rout.func;

		if(!func) {
			G.warn(`加载 [Wock接口], ${rout.id ? `ID: {${rout.id}}` : ''}, 路径: {${rout.path}}, 错误: 缺少对应的[流程]代码`);

			return;
		}
		else {
			G.trace(`加载 [Wock接口], ${rout.id ? `ID: {${rout.id}}` : ''}, 路径: {${rout.path}}`);
		}

		let funcArr = [
			...(wockInfo.before || []),
			func,
			...(wockInfo.after || [])
		];

		WockMan.add(rout.path, async function(wock, raw) {
			let result = raw;

			if(result === undefined || result === null) {
				result = {};
			}

			result._rout = rout;

			try {
				for(let func of funcArr) {
					result = await func(result, wock);
				}

				wock.send(JSON.stringify({ type: rout.path, data: result }));
			}
			catch(e) {
				G.trace(`执行 [Wock接口], 错误: ${e.message}`);
			}
		});
	};
};