# broccoli-salesforce-deploy
A broccoli plugin to deploy files to a salesforce org using the tooling api 

## an example Brocfile.js for deploying a resource dir as a salesforce staticresource

```
// Brocfile.js
//
// This setup will deploy the directory MyResource.resource 
// as a static resource called MyResource.
// You can download the produced zip file from http://localhost:4200
// when broccoli is running.
//

var funnel = require('broccoli-funnel');
var zip = require('broccoli-zip-js');
var deploy = require('broccoli-salesforce-deploy');
var mergeNodes = require('broccoli-merge-trees');

deploy.setLogLevel('info');

// Give you're directory name here - the actual directory looked for will be 'MyResource.resource'
var resourceName = 'MyReource';

// zip the directory into 'MyResource.zip'
resource = zip(resourceName + '.resource', { name: resourceName + '.zip' });

// deploy the resource to salesforce
deployed = deploy(resource, {
	file: resourceName + '.zip',
	type: 'StaticResource',
	skipFirstBuild: true,
	loginUrl: 'https://test.salesforce.com',
	username: 'MyUsername@SomeDomain.com',
	password: 'somePassword',
	securityToken: 'someSecurityToken'
});

module.exports = mergeNodes([ deployed ]);
```
