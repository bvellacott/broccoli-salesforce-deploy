const fs = require('fs');

module.exports = function(path){
	const cache = {
		data: {},
		init() {
			return new Promise((resolve, reject) => {
				cache.read()
				.then(data => { resolve(data); })
				.catch(err => { 
					cache.write()
					.then(() => { resolve(cache.data); })
					.catch(err => { reject(err); } );
				});
			});
		},
		read() {
			return new Promise((resolve, reject) => {
  			fs.readFile(path, 'utf8', (err, data) => {
  				if(err) { 
  					return reject(err);
  				}
 					cache.data = JSON.parse(data);
   				return resolve(cache.data);
  			});
			});
		},
		write() {
			return new Promise((resolve, reject) => {
				fs.writeFile(path, JSON.stringify(cache.data), err => {
  				if(err) { 
  					return reject(err);
  				}
  				return resolve();
				})
			});
		},
		del() {
			return new Promise((resolve, reject) => {
				fs.unlink(path, err => {
  				if(err) { 
  					return reject(err);
  				}
  				return resolve();
				});
			});
		}
	};
	return cache;
};