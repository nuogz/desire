global.Promise = require('bluebird');

(async() => {
	// await require('./libs/init')();
	// await require('./libs/server')();
	let db = await require('./libs/db')();
	true;
})();
