const fs = require('fs');
const log = require('./logger');

const tooling = {
  /**
  *   First try and create the resource, on failure find a resource by name and try and update it
  */
  createOrUpdate(connection, type, obj, searchField) {
    return new Promise((resolve, reject) => {
      return connection.tooling.sobject(type).create(obj)
      .then(result => {
        log.info("\n successfully created the " + type + " " + obj[searchField] + "\n");
        return resolve(result);
      })
      .catch(createErr => {

        log.error(createErr);
        log.info("\n couldn't create the " + type + " " + obj[searchField] + " so trying to update it...\n");

        var query = searchField + " = '" + obj[searchField] + "'";

        connection.tooling.sobject(type).findOne(query)
        .execute((findErr, record) => {
          if(!record) {
            reject("the " + type + " " + "doesn't exist on the server");
          }
          if(findErr) {

            log.error(findErr);
            log.info("failed to update the " + type);

            return reject(findErr);
          }
          log.info("found: " + record.Id);

          obj.Id = record.Id;
          connection.tooling.sobject(type).update(obj)
          .then(result => {

            log.info("\n successfully updated the " + type + " " + obj.name + "\n");

            return resolve(result);
          })
          .catch(updateErr => {

            log.error(updateErr);
            log.info("failed to update the " + type);

            return reject(updateErr);
          });
        });
      });
    });
  },

  /**
  *   First try and update the resource, on failure try and create it
  */
  updateOrCreate(connection, type, obj) {
    return new Promise((resolve, reject) => {
      connection.tooling.sobject(type).update(obj)
      .then(result => {
        log.info("\n successfully updated the " + type + " " + obj.name + "\n");
        return resolve(result);
      })
      .catch(updateErr => {
        log.error(updateErr);
        log.info("\n couldn't update the " + type + " " + obj.name + " so trying to create it...\n");

        obj.id = null;
        connection.tooling.sobject(type).create(obj)
        .then(result => {
          log.info("\n successfully created the " + type + " " + obj.name + "\n");
          return resolve(result);
        })
        .catch(createErr => {
            log.error(createErr);
            log.info('failed to create the ' + type);
          return reject(createErr);
        });
      });
    });
  }
}

var deploy = {
  any(connection, type, filePath, encoding, obj, contentField, searchField) {
    return new Promise((resolve, reject) => { 
      fs.readFile(filePath, { encoding: encoding }, (err, data) => {
        if(err) {
          return reject(err);
        }
        obj[contentField] = data;

        if(obj.Id) {
          return resolve(tooling.updateOrCreate(connection, type, obj, searchField));
        }
        else {
          return resolve(tooling.createOrUpdate(connection, type, obj, searchField));
        }
       });
    });
  },
  StaticResource(connection, resource) {
    var obj = {
      Id: resource.id,
      name: resource.name,
      cacheControl: resource.cacheControl || 'private',
      contentType: resource.contentType || 'application/zip',
      description: resource.description
    };
    return this.any(connection, 'StaticResource', resource.filePath, 'base64', obj, 'body', 'name');
  },
  ApexPage(connection, page) {
    var obj = {
      Id: page.id,
      name: page.name,
      masterLabel: page.name,
      apiVersion: page.apiVersion,
      description: page.description
    };
    return this.any(connection, 'ApexPage', page.filePath, 'utf8', obj, 'Markup', 'name');
  },
};

module.exports = deploy;
