// const deploy = require('../index');

module.exports = {
	level: 'error',
	info(msg) {
		if(this.level in { info : 1, error : 2 }) {
			process.stdout.write('[sf-deploy] ');
			console.log(msg);
		}
	},
	error(msg) {
		if(this.level in { error : 2 }) {
			console.error('[sf-deploy] ');
			process.stdout.write(msg);
		}
	}
}