'use strict';

var assert = require('assert');
var AwsHelper = require('./../../lib/index2');
var awsMock = require('aws-sdk-mock');

describe('AWS Lambda helper', function () {
  describe('getEnvironment', function () {
    // it('should get environment variable from context', (done) => {
    //   const context = {
    //     invokedFunctionArn: 'arn:123:abs:prod'
    //   };
    //
    //   let env = helper.getEnvironment(context);
    //   assert.equal(env, 'prod');
    //   done();
    // });
    //
    // it('should return null if invokedFunctionArn does not exist in context', (done) => {
    //   let env = helper.getEnvironment({});
    //
    //   assert.equal(env, null);
    //   done();
    // });
    //
    // it('should return null if evn does not exist in invokedFunctionArn', (done) => {
    //   const badContext = {
    //     invokedFunctionArn: 'arn_123abs_prod:'
    //   };
    //
    //   let env = helper.getEnvironment(badContext);
    //
    //   assert.equal(env, null);
    //   done();
    // });

    it.only('should get environment variable from context', function (done) {
      var context = {
        'invokedFunctionArn': 'arn:aws:lambda:eu-west-1:447022989235:function:aws-canary-lambda:prod'
      };
      var awsHelper = AwsHelper(awsMock, context, {});

      assert.equal(awsHelper.version, 'prod');
      assert.equal(awsHelper.env, 'prod');
      done();
    });
  });
});
