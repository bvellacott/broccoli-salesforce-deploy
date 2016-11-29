var fs = require('fs');

var deploy = {
  staticResource: function(connection, options) {
    return new Promise(function(resolve, reject){ 
      fs.readFile(options.filePath, { encoding: 'base64' }, function(err, data) {
        if(err) reject(err);

        resolve(connection.tooling.sobject('StaticResource').create({
          body: data,
          cacheControl: options.cacheControl || 'private',
          contentType: options.contentType || 'application/zip',
          name: options.name,
        }));
      });
    });
  }
};

module.exports = deploy;
