var Plugin = require('broccoli-caching-writer');
var path = require('path');
var jsforce = require('jsforce');
var fs = require('fs');
var newCache = require('./lib/cache');
var deploy = require('./lib/deploy');

// Create a subclass SfDeploy derived from Plugin
SfDeploy.prototype = Object.create(Plugin.prototype);
SfDeploy.prototype.constructor = SfDeploy;
function SfDeploy(inputNode, options) {
  if (!(this instanceof SfDeploy)) {
    return new SfDeploy(inputNode, options);
  }
  options = options || {};

  // check for mandatory options
  if(!options.file) throw new Error('No filepath specified');
  options.name = (options.name || path.basename(options.file)).split('.')[0];
  options.cacheInclude = [ new RegExp(options.file + '$') ];

  Plugin.call(this, [inputNode], {
    annotation: options.annotation,
    persistentOutput: true
  });

  this.options = options;
}

SfDeploy.prototype.build = function() {
  var options = this.options;
  // check for mandatory options
  const filePath = path.join(this.inputPaths[0], options.file);
  const outputPath = path.join(this.outputPath, options.file);
  if(!options.username) throw new Error('No username specified');
  if(!options.password) throw new Error('No password specified');
  if(!options.securityToken) throw new Error('No securityToken specified');
  const cacheFilePath = path.join(this.inputPaths[0], options.cacheFile || '_sfDeployCache.json');


  if(!this.cache) {
    this.cache = newCache(cacheFilePath);
  }
  var cache = this.cache;
  cache.init()
  .then(data => {
    var conn = null;
    if(!cache.data.accessToken) {
      conn = new jsforce.Connection({
        loginUrl : options.loginUrl || 'https://login.salesforce.com',
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
        cacheControl: options.cacheControl,
        contentType: options.contentType,
        name: options.name,
        id: cache.data.id
      });
    }

    function loginAndDeploy() {
      return new Promise((resolve, reject) => {
        conn.login(options.username, options.password + options.securityToken, (err, userInfo) => {
          if(err) throw err;

          cache.data.accessToken = conn.accessToken;
          cache.data.instanceUrl = conn.instanceUrl;
          cache.data.userInfo = userInfo;
          cache.write();

          deployResource()
          .then(res => {
            console.log(res);
            cache.data.id = res.id;
            cache.write();
            resolve(res);
          })
          .catch(err => {
            console.log(err);
            reject(err);
          });
        });
      });
    }

    if(!data.accessToken) {
      return loginAndDeploy();
    }
    else {
      return deployResource()
      .then(res => {
        console.log(res);
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

  // don't do anything to the file - we're only deploying
  fs.writeFileSync(outputPath, fs.readFileSync(filePath));
};

module.exports = SfDeploy;