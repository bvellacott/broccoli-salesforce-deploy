var fs = require('fs');

/**
*   First try and create the resource, on failure find a resource by name and try and update it
*/
function createOrUpdate(connection, type, obj) {
  return new Promise((resolve, reject) => {
    connection.tooling.sobject(type).create(obj)
    .then(result => {
      console.log("\n successfully created the resource " + obj.name + "\n");
      return resolve(result);
    })
    .catch(createErr => {
      console.log(createErr);
      console.log("\n couldn't create the resource " + obj.name + " so trying to update it...\n");
      connection.tooling.sobject(type).findOne("name = '" + obj.name + "'")
      .execute((findErr, record) => {
        if(findErr) {
          console.log('failed to update the resource');
          console.log(findErr);
          return reject(findErr);
        }
        console.log("found: " + record.Id);

        obj.Id = record.Id;
        connection.tooling.sobject(type).update(obj)
        .then(result => {
          console.log("\n successfully updated the resource " + obj.name + "\n");
          return resolve(result);
        })
        .catch(updateErr => {
          console.log(updateErr);
          return reject(updateErr);
        });
      });
    });
  });
}

/**
*   First try and update the resource, on failure try and create it
*/
function updateOrCreate(connection, type, obj) {
  return new Promise((resolve, reject) => {
    connection.tooling.sobject(type).update(obj)
    .then(result => {
      console.log("\n successfully updated the resource " + obj.name + "\n");
      return resolve(result);
    })
    .catch(updateErr => {
      console.log(updateErr);
      console.log("\n couldn't update the resource " + obj.name + " so trying to create it...\n");

      obj.id = null;
      connection.tooling.sobject(type).create(obj)
      .then(result => {
        console.log("\n successfully created the resource " + obj.name + "\n");
        return resolve(result);
      })
      .catch(createErr => {
        return reject(createErr);
      });
    });
  });
}

var deploy = {
  staticResource(connection, options) {
    return new Promise((resolve, reject) => { 
      fs.readFile(options.filePath, { encoding: 'base64' }, (err, data) => {
        if(err) {
          return reject(err);
        }

        var obj = {
          name: options.name,
          body: data,
          cacheControl: options.cacheControl || 'private',
          contentType: options.contentType || 'application/zip',
          description: options.description
        };

        if(options.id) {
          obj.Id = options.id;
          return resolve(updateOrCreate(connection, 'StaticResource', obj));
        }
        else {
          return resolve(createOrUpdate(connection, 'StaticResource', obj));
        }
      });
    });
  }
};

module.exports = deploy;
