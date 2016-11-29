var connection = {
  tooling: {
    sobject(type) {
      return {
        create: function(options) {
          if(type !== 'StaticResource') {
            return Promise.reject('only static resource deployment is supported currently');
          }
          if(!options.body) {
            return Promise.reject('no data provided');
          }
          if(!options.name) {
            return Promise.reject('no name provided for the static resource');
          }
          return Promise.resolve({
            type: type, 
            data: !!options.body,
            name: options.name,
          });
        }
      };
    }
  }
};

test( "Deploy existing resource", function() {
  expect(1);
  stop();

  return deploy.staticResource(connection, {
    filePath: './tests/zipTest.resource',
    name: 'zipTest'
  }).then(function(res, err) {
    if(err) {
      notOk(true, err);
    }

    deepEqual(res, {
      type: 'StaticResource',
      data: true,
      name: 'zipTest'
    }, "static resource deploy result");
    start();
  }).catch(function(err){
    if(err) {
      notOk(true, err);
    }
    start();
 });
});

test( "Deploy non-existent resource", function() {
  expect(1);
  stop();

  return deploy.staticResource(connection, {
    filePath: 'non-existent-resource',
    name: 'no-nome'
  }).then(function(res, err) {
    if(err) {
      ok(true, err);
    }
    notOk(res, 'shouldn\'t resolve non-existent resource');
    start();
  }).catch(function(err){
    ok(true, err);
    start();
  });
});
