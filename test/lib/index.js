'use strict';

var assert = require('assert');
var AwsHelper = require('./../../lib/index');
var AWS = require('aws-sdk');

describe('AWS Lambda helper', function () {
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

    it('should return null if invokedFunctionArn is not set in context', function (done) {
      var env = AwsHelper.getEnvironment({});
      assert.equal(env, null);
      done();
    });

    it('a valid ARN without environment should not set the env property', function (done) {
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
      var awsHelper = AwsHelper(AWS, context, {});
      assert.equal(awsHelper.env, 'prod');
      assert.equal(awsHelper.account, '123456789');
      assert.equal(awsHelper.version, 'prod');
      assert.equal(awsHelper.region, 'eu-west-1');
      done();
    });

    it('config should be set to an empty object if undefined', function (done) {
      var context = {
        'invokedFunctionArn': 'arn:aws:lambda:eu-west-1:123456789:function:aws-canary-lambda:prod'
      };
      var awsHelper = AwsHelper(AWS, context);
      assert.deepEqual(awsHelper._config, {});
      done();
    });
  });

  describe('AwsHelper.Lambda.invoke', function () {
    it('should throw an error if the params.FunctionName is not set', function (done) {
      try {
        AwsHelper.Lambda.invoke();
      } catch (e) {
        var expected_err_msg = 'Error: params.FunctionName is required';
        assert(e.toString().indexOf(expected_err_msg) > -1);
        done();
      }
    });

    it('should invoke the Lambda function MyAmazingLambda (using mock)', function (done) {
      var context = {
        'invokedFunctionArn': 'arn:aws:lambda:eu-west-1:123456789:function:aws-canary-lambda'
      };

      var awsMock = {
        config: {},
        Lambda: function () {
          return {
            invoke: function (params, cb) {
              var p = {
                FunctionName: '123456789:MyAmazingLambda',
                InvocationType: 'RequestResponse',
                Payload: JSON.stringify({ 'hello': 'world' }),
                Qualifier: '$LATEST',
                LogType: 'None'
              };
              assert.deepEqual(p, params);
              cb(null, 'totes worked');
            }
          };
        }
      };

      var awsHelper = AwsHelper(awsMock, context, {});
      assert.equal(awsHelper.version, '$LATEST'); // confirm correctly instantiated

      var params = {
        FunctionName: 'MyAmazingLambda',
        Payload: { 'hello': 'world' },
        Qualifier: ''
      };
      awsHelper.Lambda.invoke(params, function (err, data) {
        assert(err === null);
        assert(data === 'totes worked');
        done();
      });
    });
  });
});
