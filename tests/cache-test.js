test( "init, read, delete and read", () => {
  expect(3);
  stop();

  var cache1 = newCache('./cacheTest.json');
  var cache2 = newCache('./cacheTest.json');
  var cache3 = newCache('./cacheTest.json');
  var cache4 = newCache('./cacheTest.json');
  
  cache1.data = { value: 'haloo' };

  cache1.init()
  .then(() => { return cache2.init(); })
  .then(() => { 
    deepEqual(cache1.data, cache2.data, "cache init");
    return cache3.read(); 
  })
  .then(res => {
    deepEqual(cache3.data, { value: 'haloo' }, "cache read");
    return cache3.del();
  })
  .then(res => {
    cache4.read()
    .then(() => { notOk(true, "the file wasn't deleted"); start(); })
    .catch(err => { ok(true, "the file was successfully deleted"); start(); });
  })
  .catch(err => {
    notOk(true, err);
    start();
  });
});
