var Plugin = require('broccoli-plugin');
var path = require('path');
var jsforce = require('jsforce');
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
 
  var conn = new jsforce.Connection({
    loginUrl : this.options.loginUrl || 'https://login.salesforce.com',
  });

  conn.login(this.options.username, this.options.password + this.options.securityToken, (err, userInfo) => {
    if(err) throw err;

    // Now you can get the access token and instance URL information.
    // Save them to establish connection next time.
    console.log('accessToken: ' + conn.accessToken);
    console.log('instanceUrl: ' + conn.instanceUrl);
    // console.log('sessionId: + ' + conn.sessionId);
    // logged in user property
    console.log("User ID: " + userInfo.id);
    console.log("Org ID: " + userInfo.organizationId);

    deploy.statickResource(conn, {
      filePath: filePath, 
      cacheControl: this.options.cacheControl,
      contentType: this.options.contentType,
      name: this.options.name
    });
  });
};

module.exports = SfDeploy;