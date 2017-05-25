global.Promise = require('bluebird');

(async() => {
	await require('./libs/init')();
	await require('./libs/serv')();
})();
