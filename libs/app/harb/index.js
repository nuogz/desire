module.exports = async function($) {
	let { C } = $;

	let harb = C.serv.harb;

	if(typeof harb == 'function') {
		$.Harb = await harb($);
	}
	else if(harb != 'default' && typeof harb == 'string') {
		$.Harb = await require(harb)($);
	}
	else {
		$.Harb = await require('./default')($);
	}
};