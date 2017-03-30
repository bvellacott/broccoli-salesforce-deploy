# broccoli-salesforce-deploy
A broccoli plugin to deploy files to a salesforce org using the rest api - ***MUCH FASTER BUT DOESN'T PREVENT OVERWRITES***

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
  // in general you don't want to deploy every time you start broccoli so its better to skip the first
  // build unless you're building for production
  skipFirstBuild: true,
  file: resourceName + '.zip',
  type: 'StaticResource',
  loginUrl: 'https://test.salesforce.com',
  username: 'MyUsername@SomeDomain.com',
  password: 'somePassword',
  securityToken: 'someSecurityToken'
});

module.exports = mergeNodes([ deployed ]);
```

### visualforce page and lightning bundles
You can also deploy a visualforce page like so:
```
var isProduction = false;
var pagesPath = './pages';
var fileName = 'MyPage.page';
var pageName = 'MyPage';
page = deploy(pickFiles(pagesPath, { include: [ fileName ] }), {
  // in general you don't want to deploy every time you start broccoli so its better to skip the first
  // build unless you're building for production
  skipFirstBuild: !isProduction,
  type: 'ApexPage',
  apiVersion: '37.0',
  file: fileName,
  name: pageName,
  username: sfCreds.username,
  password: sfCreds.password,
  securityToken: sfCreds.securityToken
});
```

### and lightning bundle files
```
var isProduction = false;
var bundlePath = './auraBundles';
var bundleName = 'MyLightningBundle';
var sfCreds = {
  username: 'MyUsername@SomeDomain.com',
  password: 'somePassword',
  securityToken: 'someSecurityToken'
};

var deploymentDefaults = {
  // in general you don't want to deploy every time you start broccoli so its better to skip the first
  // build unless you're building for production
  skipFirstBuild: !isProduction,
  type: 'AuraDefinition',
  apiVersion: '37.0',
  // below are the available definition types
  // defType: 'APPLICATION', 'DESIGN', 'HELPER', 'CONTROLLER', 'RENDERER', 'DOCUMENTATION', 'STYLE', 'COMPONENT', 'SVG'
  name: bundleName,
  username: sfCreds.username,
  password: sfCreds.password,
  securityToken: sfCreds.securityToken
};

var appName = 'MyApp.app';
var app = deploy(pickFiles(bundlePath, { include: [ appName ] }), 
  Object.assign({}, deploymentDefaults, { 
  file: appName,
  defType: 'APPLICATION',
  format: 'XML' 
}));

var auradocName = 'MyComponent.auradoc';
var auradoc = deploy(pickFiles(bundlePath, { include: [ auradocName ] }), 
  Object.assign({}, deploymentDefaults, { 
  file: auradocName,
  defType: 'DOCUMENTATION',
  format: 'XML' 
}));

var componentName = 'MyComponent.cmp'
var component = deploy(pickFiles(bundlePath, { include: [ componentName ] }), 
  Object.assign({}, deploymentDefaults, { 
  file: componentName,
  defType: 'COMPONENT',
  format: 'XML' 
}));

var designName = 'MyComponent.design';
var design = deploy(pickFiles(bundlePath, { include: [ designName ] }), 
  Object.assign({}, deploymentDefaults, { 
  file: designName,
  defType: 'DESIGN',
  format: 'XML' 
}));

var svgName = 'MyComponent.svg';
var svg = deploy(pickFiles(bundlePath, { include: [ svgName ] }), 
  Object.assign({}, deploymentDefaults, { 
  file: svgName,
  defType: 'SVG',
  format: 'SVG' 
}));

var styleName = 'MyComponent.css';
var style = deploy(pickFiles(bundlePath, { include: [ styleName ] }), 
  Object.assign({}, deploymentDefaults, { 
  file: styleName,
  defType: 'STYLE',
  format: 'css' 
}));
	
var controllerName = 'MyComponentController.js';
var controller = deploy(pickFiles(tool, { include: [ controllerName ] }), 
  Object.assign({}, deploymentDefaults, { 
  file: controllerName,
  defType: 'CONTROLLER',
  format: 'JS' 
}));

var helperName = 'MyComponentHelper.js';
var helper = deploy(pickFiles(tool, { include: [ helperName ] }), 
  Object.assign({}, deploymentDefaults, { 
  file: helperName,
  defType: 'HELPER',
  format: 'JS' 
}));

var rendererName = 'MyComponentRenderer.js';
var renderer = deploy(pickFiles(tool, { include: [ rendererName ] }), 
  Object.assign({}, deploymentDefaults, { 
  file: rendererName,
  defType: 'RENDERER',
  format: 'JS' 
}));
```
