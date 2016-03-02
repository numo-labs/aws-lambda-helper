'use strict';

var assert = require('assert');
var AwsHelper = require('./../../lib/index2');
var awsMock = require('aws-sdk-mock');

describe('AWS Lambda helper', function () {
  describe('getEnvironment', function () {
    it('should throw error when invokedFunctionArn is invalid', (done) => {
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

    it('should return null if invokedFunctionArn is not set in context', (done) => {
      var env = AwsHelper.getEnvironment({});
      assert.equal(env, null);
      done();
    });

    it('a valid ARN without environment should not set the env property', (done) => {
      var context = {
        'invokedFunctionArn': 'arn:aws:lambda:eu-west-1:123456789:function:mylambda'
      };

      var env = AwsHelper.getEnvironment(context);
      assert.equal(env, null);
      done();
    });

    it('should get environment variable from context', function (done) {
      var context = {
        'invokedFunctionArn': 'arn:aws:lambda:eu-west-1:123456789:function:aws-canary-lambda:prod'
      };
      var awsHelper = AwsHelper(awsMock, context, {});
      assert.equal(awsHelper.env, 'prod');
      done();
    });

    it('config should be set to an empty object if undefined', function (done) {
      var context = {
        'invokedFunctionArn': 'arn:aws:lambda:eu-west-1:123456789:function:aws-canary-lambda:prod'
      };
      var awsHelper = AwsHelper(awsMock, context);
      assert.deepEqual(awsHelper._config, {});
      done();
    });
  });

  describe('invokeLambdaFunction', function () {
    it('should throw an error if the params.FunctionName is not set', function (done) {
      try {
        AwsHelper.invokeLambdaFunction();
      } catch (e) {
        // console.log(e);
        var expected_err_msg = 'Error: params.FunctionName is required';
        assert(e.toString().indexOf(expected_err_msg) > -1);
        done();
      }
    });

    it('should (Mock) invoke the function (using aws-sdk-mock)', function (done) {
      var context = {
        'invokedFunctionArn': 'arn:aws:lambda:eu-west-1:123456789:function:aws-canary-lambda'
      };
      var awsMock = require('aws-sdk-mock');
      // set up the mock for lambda invocation using aws-sdk-mock:
      awsMock.mock('Lambda', 'invoke', function (err, data) {
        console.log('err:', err);
        console.log('data:', data);
      });
      // instantiate the helper module:
      AwsHelper(awsMock, context, {});
      // assert.equal(awsHelper.env, '$LATEST'); // confirm correctly instantiated

      var params = {
        FunctionName: 'MyAmazingLambda',
        Payload: { 'hello': 'world' },
        Qualifier: ''
      };
      AwsHelper.invokeLambdaFunction(params, function (err, data) {
        console.log('err:', err);
        console.log('data:', data);
      });
      done();
    });
  });
});
