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
    var fakeError = 'There is an error';
    var fakeContext = {
      fail: function (err) {
        assert(err === fakeError);
        done();
      }
    };
    AwsHelper.failOnError(fakeError, {}, fakeContext);
  });
});
