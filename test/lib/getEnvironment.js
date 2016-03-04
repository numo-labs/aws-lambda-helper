'use strict';

var assert = require('assert');
var AwsHelper = require('./../../lib/index');

describe('getEnvironment', function () {
  it('should throw error when invokedFunctionArn is invalid', function (done) {
    var badContext = {
      invokedFunctionArn: 'arn:123:abs:prod'
    };
    try {
      AwsHelper.getEnvironment(badContext);
    } catch (e) {
      var expected_err_msg = 'Error: Unexpected invokedFunctionArn format';
      assert(e.toString().indexOf(expected_err_msg) > -1);
      done();
    }
  });

  it('a valid ARN without environment should set the env property to "ci"', function (done) {
    var context = {
      'invokedFunctionArn': 'arn:aws:lambda:eu-west-1:123456789:function:mylambda'
    };

    var env = AwsHelper.getEnvironment(context);
    assert.equal(env, 'ci');
    done();
  });

  it('should get environment variable from context', function (done) {
    var context = {
      'invokedFunctionArn': 'arn:aws:lambda:eu-west-1:123456789:function:aws-canary-lambda:prod'
    };
    var awsHelper = AwsHelper(context);
    assert.equal(awsHelper.env, 'prod');
    assert.equal(awsHelper.account, '123456789');
    assert.equal(awsHelper.version, 'prod');
    assert.equal(awsHelper.region, 'eu-west-1');
    done();
  });
});
