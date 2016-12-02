var fs = require('fs');

/**
*   First try and create the resource, on failure find a resource by name and try and update it
*/
function createOrUpdate(connection, type, obj) {
  return new Promise(function(resolve, reject){
    connection.tooling.sobject(type).create(obj)
    .then(function(result){
      resolve(result);
    })
    .catch(function(createErr){
      console.log(createErr);

      connection.tooling.sobject(type).findOne("name = '" + obj.name + "'")
      .execute(function(findErr, record){
        if(findErr)
          reject(findErr);

        obj.Id = record.Id;
        connection.tooling.sobject(type).update(obj)
        .then(function(result){
          resolve(result);
        })
        .catch(function(updateErr){
          reject(updateErr);
        });
      });

    });
  });
}

/**
*   First try and update the resource, on failure try and create it
*/
function updateOrCreate(connection, type, obj) {
  return new Promise(function(resolve, reject){
    connection.tooling.sobject(type).update(obj)
    .then(function(result){
      resolve(result);
    })
    .catch(function(updateErr){
      console.log(updateErr);

      obj.id = null;
      connection.tooling.sobject(type).create(obj)
      .then(function(result){
        resolve(result);
      })
      .catch(function(createErr){
        reject(createErr);
      });
    });
  });
}

var deploy = {
  staticResource: function(connection, options) {
    return new Promise(function(resolve, reject){ 
      fs.readFile(options.filePath, { encoding: 'base64' }, function(err, data) {
        if(err) reject(err);

        var obj = {
          body: data,
          cacheControl: options.cacheControl || 'private',
          contentType: options.contentType || 'application/zip',
          name: options.name
        };

        if(options.id) {
          obj.Id = options.id;
          resolve(updateOrCreate(connection, 'StaticResource', obj));
        }
        else {
          resolve(createOrUpdate(connection, 'StaticResource', obj));
        }
      });
    });
  }
};

module.exports = deploy;
