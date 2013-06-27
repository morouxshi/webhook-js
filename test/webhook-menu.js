(function($) {
  /*
    ======== A Handy Little QUnit Reference ========
    http://api.qunitjs.com/

    Test methods:
      module(name, {[setup][ ,teardown]})
      test(name, callback)
      expect(numberOfAssertions)
      stop(increment)
      start(decrement)
    Test assertions:
      ok(value, [message])
      equal(actual, expected, [message])
      notEqual(actual, expected, [message])
      deepEqual(actual, expected, [message])
      notDeepEqual(actual, expected, [message])
      strictEqual(actual, expected, [message])
      notStrictEqual(actual, expected, [message])
      throws(block, [expected], [message])
  */

  module('basic jQuery');

  test('is defined on jQuery object', function () {
    ok($('<div></div>').menu, 'tooltip plugin is defined');
  });

  test('is chainable', function () {
    var elems = $('<div></div>');
    strictEqual(elems.menu(), elems, 'should be chainable');
  });

}(jQuery));
