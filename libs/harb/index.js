module.exports = async function($) {
	const { C, G } = $;

	const harb = C.harb;
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

		G.info('海港', '✔');
	}
	catch(error) {
		G.fatal('海港', `加载 [海港]`, error);
	}
};