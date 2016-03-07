'use strict';

var assert = require('assert');
var AwsHelper = require('./../../lib/index');

describe('_parseInvokedFunctionArn', function () {
  it('should throw error when invokedFunctionArn is invalid', function (done) {
    // Create a awsHelper with a good context
    var context = {
      'invokedFunctionArn': 'arn:aws:lambda:eu-west-1:123456789:function:aws-canary-lambda:prod'
    };
    AwsHelper.init(context);
    // now test the specific function with a bad context
    var badContext = {
      invokedFunctionArn: 'arn:123:abs:prod'
    };
    try {
      AwsHelper._parseInvokedFunctionArn(badContext.invokedFunctionArn);
    } catch (e) {
      var expected_err_msg = 'Error: Unexpected invokedFunctionArn format';
      assert(e.toString().indexOf(expected_err_msg) > -1);
      done();
    }
  });

  it('should throw error when invokedFunctionArn is null', function (done) {
    // Create a awsHelper with a good context
    var context = {
      'invokedFunctionArn': 'arn:aws:lambda:eu-west-1:123456789:function:aws-canary-lambda:prod'
    };
    AwsHelper.init(context);
    // now test the specific function with a empty invokedFunctionArn
    try {
      AwsHelper._parseInvokedFunctionArn(null);
    } catch (e) {
      var expected_err_msg = 'invokedFunctionArn needs to be specified:';
      assert(e.toString().indexOf(expected_err_msg) > -1);
      done();
    }
  });
});
