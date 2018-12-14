module.exports = async function() {
	return require('commander')
		.version('3.0.0 alpha', '-v, --version')
		.usage('--config <config file> | [options] <app folders ...>')
		.option('-c, --conf [path]', 'the specified js file of config')
		.option('-l, --log [path]', 'the specified file for serv log')
		.parse(process.argv);
};