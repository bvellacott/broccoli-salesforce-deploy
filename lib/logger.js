const deploy = require('../index');

module.exports = {
	level: 'none',
	info(msg) {
		if(this.level in { info : 1, error : 2 }) {
			console.log(msg);
		}
	},
	error(msg) {
		if(this.level in { error : 2 }) {
			console.error(msg);
		}
	}
}