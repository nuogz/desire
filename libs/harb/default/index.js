const OS = require('os');

module.exports = async function($) {
	const { C: { paths = {}, folds = [], faces = [], mare = {}, wock = false } } = $;

	// 文件上传
	$.Multer = require('@koa/multer')({ dest: paths.temp || OS.tmpdir() });

	if(wock && wock.enabled) {
		await require('./wock')($, wock);
	}

	const beforeMare = mare && mare.before ? mare.before : [];
	const afterMare = mare && mare.after ? mare.after : [];

	const before = [];
	const after = [];

	for(const func of beforeMare) {
		before.push(await func($));
	}
	for(const func of afterMare) {
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