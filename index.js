global.Promise = require('bluebird');

(async() => {
	try {
		await require('./libs/init')();
		await require('./libs/serv')();
	}
	catch(e) {
		console.error(e.stack);
	}
})();
