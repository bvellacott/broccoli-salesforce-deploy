const fs = require('fs');
const log = require('./logger');

const methods = {

  /**
  *   Update the resource either by using the resource id or name
  */
  update(connection, type, obj, query) {
    return new Promise((resolve, reject) => {
      if(!obj.Id) {
        connection.sobject(type).findOne(query)
        .execute((findErr, record) => {
          if(!record) {
            return reject("a " + type + " with the query: " + query + " doesn't exist on the server");
          }
          if(findErr) {
            log.error(findErr);
            log.info("failed to update the " + type);
            return reject(findErr);
          }
          log.info("found: " + type + " with id: " + record.Id);

          obj.Id = record.Id;

          //recurse update with the id populated
          return resolve(methods.update(connection, type, obj, query));
        });
      }
      else {
        connection.sobject(type).update(obj)
        .then(result => {

          log.info("successfully updated the " + type + " " + obj.name);

          return resolve(result);
        })
        .catch(updateErr => {

          log.error(updateErr);
          log.info("failed to update the " + type);

          return reject(updateErr);
        });
      }
    });
  },

  /**
  *   First try and update the resource, on failure try and create it
  */
  updateOrCreate(connection, type, obj, query) {
    return new Promise((resolve, reject) => {
      methods.update(connection, type, obj, query)
      .then(result => { return resolve(result); })
      .catch(err => {
        log.error(err);
        connection.sobject(type).create(obj)
        .then(result => {
          log.info("successfully created the " + type + " " + obj.name);
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
};

var deploy = {
  any(connection, type, filePath, encoding, obj, contentField, query) {
    return new Promise((resolve, reject) => { 
      fs.readFile(filePath, { encoding: encoding }, (err, data) => {
        if(err) {
          return reject(err);
        }
        obj[contentField] = data;

        return resolve(methods.updateOrCreate(connection, type, obj, query));
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
    return this.any(connection, 'StaticResource', resource.filePath, 'base64', obj, 'body', "name = '" + obj.name + "'");
  },
  ApexPage(connection, page) {
    var obj = {
      Id: page.id,
      name: page.name,
      masterLabel: page.name,
      apiVersion: page.apiVersion,
      description: page.description
    };
    return this.any(connection, 'ApexPage', page.filePath, 'utf8', obj, 'Markup', "name = '" + obj.name + "'");
  },
  AuraDefinition(connection, def) {
    var bundle = {
      Id: def.bundleId,
      name: def.name,
      MasterLabel: def.name,
      DeveloperName: def.name,
      Language: def.language || 'en_US',
      Description: def.description,
      apiVersion: def.apiVersion || 39.0,
    };
    return methods.updateOrCreate(connection, 'AuraDefinitionBundle', bundle, "MasterLabel = '" + def.name + "'")
    .then(result => {
      console.log('creating definition');
      if(!result.success || !result.id) {
        return Promise.reject(result.errors);
      }
      var definition = {
        Id: def.id,
        AuraDefinitionBundleId: result.id,
        DefType: def.defType,
        Format: def.format,
        apiVersion: def.apiVersion,
      };
      return deploy.any(connection, 'AuraDefinition', def.filePath, 'utf8', definition, 'Source', 
        "AuraDefinitionBundleId = '" + result.id + "' and DefType = '" + def.defType + "'");
    });
  },
};

module.exports = deploy;
