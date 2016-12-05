function createConnection() {
  var conn = {
    idCount: 0,
    object: null,
    tooling: {
      sobject(type) {
        return {
          create(obj) {
            if(conn.object) {
              return Promise.reject('DUPLICATE_VALUE');
            }
            conn.object = obj;
            conn.idCount++;
            conn.object.Id = conn.idCount
            return Promise.resolve({
                "id": '' + conn.object.Id,
                "success": true,
                "errors": []
            });
          },
          update(obj) {
            if(!conn.object) {
              return Promise.reject('DOESNT_EXIST');
            }
            return Promise.resolve({
                "id": '' + conn.object.Id,
                "success": true,
                "errors": []
            });
          },
          findOne() {
            console.log("finding the record");
            return {
              execute: function(cb) {
                if(!conn.object) {
                  cb('DOESNT_EXIST');
                }
                cb(null, conn.object);
              }
            }
          }
        };
      },
    }
  };
  return conn;
}

test( "Deploy and update, delete from server and update again", () => {
  expect(4);
  stop();

  var connection = createConnection();

  var options = {
    filePath: './tests/zipTest.resource',
    name: 'zipTest'
  };

  deploy.staticResource(connection, options)
  .then(res => {

    deepEqual(res, {
        "id": "1",
        "success": true,
        "errors": []
    }, "static resource create deploy result");
    return deploy.staticResource(connection, options);
  })
  .then(res => {

    deepEqual(res, {
        "id": "1",
        "success": true,
        "errors": []
    }, "static resource update deploy result");
    options.id = res.id; 

    return deploy.staticResource(connection, options);
  })
  .then(res => {

    deepEqual(res, {
        "id": "1",
        "success": true,
        "errors": []
    }, "static resource update deploy result");
    connection.object = null;

    return deploy.staticResource(connection, options);
  })
  .then(res => {

    deepEqual(res, {
        "id": "2",
        "success": true,
        "errors": []
    }, "static resource deploy after server delete result");
    start();

  })
  .catch(err => {
    notOk(true, err);
    start();
  });
});

test("Deploy non-existent file", () => {
  expect(1);
  stop();

  var connection = createConnection();

  return deploy.staticResource(connection, {
    filePath: 'non-existent-resource',
    name: 'no-name'
  }).then((res, err) => {
    if(err) {
      ok(true, err);
    }
    notOk(res, 'shouldn\'t resolve non-existent resource');
    start();
  }).catch(err => {
    ok(true, err);
    start();
  });
});
