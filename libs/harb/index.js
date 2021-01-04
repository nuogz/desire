module.exports = async function($) {
	const { G, C: { harb } } = $;

	try {
		if(typeof harb == 'function') {
			$.harb = await harb($);
		}
		else if(harb != 'default' && typeof harb == 'string') {
			$.harb = await require(harb)($);
		}
		else {
			$.harb = await require('./default')($);
		}

		G.info('服务', '加载[接口]', '✔');
	}
	catch(error) {
		G.fatal('服务', '加载[接口]', error);
	}
};