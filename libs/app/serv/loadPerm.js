module.exports = async function(pems) {
	return {
		allowHTTP1: true,
		key: _fs.readFileSync(RD(pems.key)),
		cert: _fs.readFileSync(RD(pems.cert))
	};
};