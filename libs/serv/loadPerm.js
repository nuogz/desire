const FS = require('fs');

module.exports = async function(pems) {
	return {
		allowHTTP1: true,
		key: FS.readFileSync(pems.key),
		cert: FS.readFileSync(pems.cert)
	};
};