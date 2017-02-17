// const deploy = require('../index');

module.exports = {
	level: 'error',
	info(msg) {
		if(this.level in { info : 1 }) {
			process.stdout.write('[sf-deploy : info] ');
			console.log(msg);
		}
	},
	error(msg) {
		if(this.level in { info : 1, error : 2 }) {
			process.stderr.write('[sf-deploy : error] ');
			console.error(msg);
		}
	}
}