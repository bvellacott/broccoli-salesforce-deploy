var Plugin = require('broccoli-caching-writer');
var path = require('path');
var jsforce = require('jsforce');
var fs = require('fs');
var jsonfile = require('jsonfile');
var newCache = require('./lib/cache');
var deploy = require('./lib/deploy');

// Create a subclass SfDeploy derived from Plugin
SfDeploy.prototype = Object.create(Plugin.prototype);
SfDeploy.prototype.constructor = SfDeploy;
function SfDeploy(inputNodes, options) {
  options = options || {};
  Plugin.call(this, inputNodes, {
    annotation: options.annotation
  });
  this.options = options;
}

SfDeploy.prototype.build = function() {
  // check for mandatory options
  if(!this.options.file) throw new Error('No filepath specified');
  const filePath = path.join(this.inputPaths[0], this.options.file);
  if(!this.options.username) throw new Error('No username specified');
  if(!this.options.password) throw new Error('No password specified');
  if(!this.options.securityToken) throw new Error('No securityToken specified');
  this.options.name = this.options.name || path.basename(this.options.file);
  const cacheFilePath = path.join(this.inputPaths[0], this.options.cacheFile || '_sfDeployCache.json');
 
  var cache = newCache(cacheFilePath);
  cache.init();
  .then(data => {

    var conn = null;
    if(!cache.data.accessToken) {
      conn = new jsforce.Connection({
        loginUrl : this.options.loginUrl || 'https://login.salesforce.com',
      });
    }
    else {
      conn = new jsforce.Connection({
        accessToken: cache.data.accessToken,
        instanceUrl: cache.data.instanceUrl
      });
    }

    function deployResource() {
      return deploy.staticResource(conn, {
        filePath: filePath, 
        cacheControl: this.options.cacheControl,
        contentType: this.options.contentType,
        name: this.options.name,
        id: cache.data.id
      });
    }

    function loginAndDeploy() {
      conn.login(this.options.username, this.options.password + this.options.securityToken, (err, userInfo) => {
        if(err) throw err;

        cache.data.accessToken = conn.accessToken;
        cache.data.instanceUrl = conn.instanceUrl;
        cache.data.userInfo = userInfo;
        cache.write();

        deployResource()
        .then(res => {
          cache.data.id = res.id;
          cache.write();
        });
        .catch(err => {
          console.log("failed to deploy the resource");
          console.log(err);
        });
      });
    }

    if(!data.accessToken) {
      loginAndDeploy();
    }
    else {
      deployResource()
      .then(res => {
        cache.data.id = res.id;
        cache.write();
      })
      .catch(err => {
        console.log("failed to deploy because: ");
        console.log(err);
        console.log("\nre-logging in and trying again");
        loginAndDeploy();
      });
    }
  });
};

module.exports = SfDeploy;