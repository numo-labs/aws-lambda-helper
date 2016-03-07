'use strict';

var assert = require('assert');
var AwsHelper = require('./../../lib/index');
var simple = require('simple-mock');

describe('AwsHelper.Lambda', function () {
  describe('AwsHelper.Lambda.invoke', function () {
    afterEach(function () {
      simple.restore();
    });

    it('should throw an error if the params.FunctionName is not set', function (done) {
      try {
        var context = {
          'invokedFunctionArn': 'arn:aws:lambda:eu-west-1:123456789:function:aws-canary-lambda:prod'
        };
        AwsHelper.init(context);
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

      AwsHelper.init(context);
      AwsHelper._Lambda = new AwsHelper._AWS.Lambda();

        // stub the lambda invoke function
      simple.mock(AwsHelper._Lambda, 'invoke').callFn(function (params, cb) {
        var p = {
          FunctionName: '123456789:MyAmazingLambda',
          InvocationType: 'RequestResponse',
          Payload: JSON.stringify({ 'hello': 'world' }),
          Qualifier: '$LATEST',
          LogType: 'None'
        };
        assert.deepEqual(p, params);
        cb(null, 'totes worked');
      });

      assert.equal(AwsHelper.version, '$LATEST'); // confirm correctly instantiated

      var params = {
        FunctionName: 'MyAmazingLambda',
        Payload: { 'hello': 'world' },
        Qualifier: ''
      };
      AwsHelper.Lambda.invoke(params, function (err, data) {
        assert(err === null);
        assert(data === 'totes worked');
        done();
      });
    });

    it('should invoke the Lambda function 123456789:MyAmazingLambda (using mock)', function (done) {
      var context = {
        'invokedFunctionArn': 'arn:aws:lambda:eu-west-1:123456789:function:aws-canary-lambda'
      };

      AwsHelper.init(context);
      AwsHelper._Lambda = new AwsHelper._AWS.Lambda();

        // stub the lambda invoke function
      simple.mock(AwsHelper._Lambda, 'invoke').callFn(function (params, cb) {
        var p = {
          FunctionName: '123456789:MyAmazingLambda',
          InvocationType: 'RequestResponse',
          Payload: JSON.stringify({ 'hello': 'world' }),
          Qualifier: '$LATEST',
          LogType: 'None'
        };
        assert.deepEqual(p, params);
        cb(null, 'totes worked');
      });

      assert.equal(AwsHelper.version, '$LATEST'); // confirm correctly instantiated

      var params = {
        FunctionName: '123456789:MyAmazingLambda',
        Payload: { 'hello': 'world' },
        Qualifier: ''
      };
      AwsHelper.Lambda.invoke(params, function (err, data) {
        assert(err === null);
        assert(data === 'totes worked');
        done();
      });
    });

    it('should create a Lambda object when not initiated', function (done) {
      var context = {
        'invokedFunctionArn': 'arn:aws:lambda:eu-west-1:123456789:function:aws-canary-lambda:prod'
      };
      AwsHelper.init(context);
      AwsHelper._initLambdaObject();
      assert(AwsHelper._Lambda != null);
      done();
    });
  });
});
