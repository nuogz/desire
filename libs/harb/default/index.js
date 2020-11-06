const OS = require('os');

module.exports = async function($) {
	const { C: { paths, folds, faces, mare, wock } } = $;

	// 文件上传
	$.Multer = require('@koa/multer')({ dest: paths.temp || OS.tmpdir() });

	if(wock && wock.enabled) {
		await require('./wock')($, wock);
	}

	const before = [];
	const after = [];

	for(const func of mare.before || []) {
		before.push(await func($));
	}
	for(const func of mare.after || []) {
		after.push(await func($));
	}

	mare.before = before;
	mare.after = after;

	// 挂载
	const mounters = [
		[
			folds,
			await require('./mount/fold')($),
			null,
		],
		[
			faces,
			await require('./mount/face')($),
			await require('./wock/face')($, wock),
		]
	];

	for(const [routs, mount, mountWock] of mounters) {
		if(mountWock) {
			for(const rout of routs) {
				if(rout.wock !== 'only') { await mount(rout); }

				if(rout.wock) { await mountWock(rout); }
			}
		}
		else {
			for(const rout of routs) {
				await mount(rout);
			}
		}
	}
};