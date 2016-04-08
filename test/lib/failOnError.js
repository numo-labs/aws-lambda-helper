'use strict';

var assert = require('assert');
var AwsHelper = require('./../../lib/index');
var simple = require('simple-mock');

describe('AwsHelper.failOnError', function (done) {
  afterEach(function () {
    simple.restore();
  });

  it('should do nothing if there is no error', function (done) {
    var fakeContext = {
      fail: function () {}
    };
    var spy = simple.spy(fakeContext, 'fail');
    AwsHelper.failOnError(null, {}, fakeContext);
    assert(!spy.called);
    done();
  });

  it('should call context fail function if error', function (done) {
    var fakeContext = {
      fail: function () {}
    };
    var fakeError = 'There is an error';
    var failMock = simple.mock(fakeContext, 'fail');
    AwsHelper.failOnError(fakeError, {}, fakeContext);
    assert(failMock.lastCall.args[0] === fakeError);
    done();
  });
});
