const Plugin = require('broccoli-caching-writer');
const path = require('path');
const jsforce = require('jsforce');
const fs = require('fs');
const newCache = require('./lib/cache');
const deploy = require('./lib/deploy');
const log = require('./lib/logger');

// Create a subclass SfDeploy derived from Plugin
SfDeploy.prototype = Object.create(Plugin.prototype);
SfDeploy.prototype.constructor = SfDeploy;
function SfDeploy(inputNode, options) {
  // check for mandatory options
  options = options || {};
  if(!options.file) throw new Error('No filepath specified');
  if(!options.type) throw new Error('No resource type specified');
  options.name = (options.name || path.basename(options.file)).split('.')[0];
  options.cacheInclude = [ new RegExp(options.file + '$') ];

  if (!(this instanceof SfDeploy)) {
    return new SfDeploy(inputNode, options);
  }


  Plugin.call(this, [inputNode], {
    annotation: options.annotation,
    persistentOutput: true
  });

  this.options = options;
  this.buildCount = 0;
}

SfDeploy.prototype.build = function() {
  this.buildCount++;
  var options = this.options;
  if(options.skipFirstBuild && this.buildCount < 2) {
    return;
  }

  // check for mandatory options
  const filePath = path.join(this.inputPaths[0], options.file);
  if(!fs.existsSync(filePath)) {
    return;
  }
  const outputPath = path.join(this.outputPath, options.file);
  const cacheFilePath = path.join(this.cachePath, options.cacheFile || '_sfDeployCache.json');
  const connectionCache = newCache(options.connectionCache || './sfConnection.cache');


  if(!this.cache) {
    this.cache = newCache(cacheFilePath);
  }
  var cache = this.cache;

  connectionCache.init()
  .then(connectionData => {
    return cache.init();
  })
  .then(data => {
    var conn = null;
    if(!connectionCache.data.accessToken) {
      conn = new jsforce.Connection({
        loginUrl : options.loginUrl || 'https://login.salesforce.com',
      });
    }
    else {
      conn = new jsforce.Connection({
        accessToken: connectionCache.data.accessToken,
        instanceUrl: connectionCache.data.instanceUrl
      });
    }

    function deployResource() {
      return deploy[options.type](conn, Object.assign({
        filePath: filePath, 
        id: cache.data.id
      }, options));
    }

    function loginAndDeploy() {
      return new Promise((resolve, reject) => {
        conn.login(options.username, options.password + options.securityToken, (err, userInfo) => {
          if(err) throw err;

          connectionCache.data.accessToken = conn.accessToken;
          connectionCache.data.instanceUrl = conn.instanceUrl;
          connectionCache.data.userInfo = userInfo;
          connectionCache.write();

          deployResource()
          .then(res => {
            log.info(res);
            cache.data.id = res.id;
            cache.write();
            resolve(res);
          })
          .catch(err => {
            log.error(err);
            reject(err);
          });
        });
      });
    }

    if(!connectionCache.data.accessToken) {
      return loginAndDeploy();
    }
    else {
      return deployResource()
      .then(res => {
        log.info(res);
        cache.data.id = res.id;
        cache.write();
      })
      .catch(err => {
        log.info("failed to deploy");
        log.error(err);
        log.info("\nre-logging in and trying again");
        loginAndDeploy();
      });
    }
  });

  // don't do anything to the file - we're only deploying
  fs.writeFileSync(outputPath, fs.readFileSync(filePath));
};

SfDeploy.setLogLevel = function(level) {
  log.level = level;
}

module.exports = SfDeploy;