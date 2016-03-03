'use strict';

var assert = require('assert');
var AwsHelper = require('./../../lib/index');
var awsMock = require('aws-sdk-mock');
var mockContext = {
  'invokedFunctionArn': 'arn:aws:lambda:eu-west-1:123456789:function:aws-canary-lambda'
};
var aws = AwsHelper(mockContext);

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
      var aws = AwsHelper(context);
      assert.equal(aws.contextParams.env, 'prod');
      done();
    });
  });

  describe('initHelper', function () {
    it('should throw an error if the context parameter is not passed in', function (done) {
      try {
        AwsHelper();
      } catch (e) {
        var expected_err_msg = 'context is required';
        assert(e.message.indexOf(expected_err_msg) > -1);
        done();
      }
    });
  });

  describe('aws.Lambda.invoke', function () {
    it('should throw an error if the params.FunctionName is not set', function (done) {
      try {
        aws.Lambda.invoke();
      } catch (e) {
        var expected_err_msg = 'params.FunctionName is required';
        assert(e.message.indexOf(expected_err_msg) > -1);
        done();
      }
    });

    it('should (Mock) invoke the function (using aws-sdk-mock)', function (done) {
      // set up the mock for lambda invocation using aws-sdk-mock:
      awsMock.mock('Lambda', 'invoke', 'totes worked');
      // instantiate the helper module:
      var params = {
        FunctionName: 'MyAmazingLambda',
        Payload: { 'hello': 'world' },
        Qualifier: ''
      };
      aws.Lambda.invoke(params, function (err, data) {
        assert(err === null);
        assert(data === 'totes worked');
        done();
      });
    });
  });

  describe('aws.SNS.publish', function () {
    it('should throw an error if the params.TopicName is not set', function (done) {
      try {
        aws.Sns.publish();
      } catch (e) {
        var expected_err_msg = 'params.TopicName is required';
        assert(e.message.indexOf(expected_err_msg) > -1);
        done();
      }
    });
    it('should (Mock) publish the message to the topic (using aws-sdk-mock)', function (done) {
      awsMock.mock('SNS', 'publish', 'message published');
      var params = {
        Message: JSON.stringify({name: 'name'}),
        TopicName: 'my-awesome-topic'
      };
      aws.Sns.publish(params, function (err, data) {
        assert(err === null);
        assert(data === 'message published');
        done();
      });
    });
  });

  describe('aws.DynamoDB.putItem', function () {
    it('should throw an error if the params.TableName is not set', function (done) {
      try {
        aws.DynamoDB.putItem();
      } catch (e) {
        var expected_err_msg = 'params.TableName is required';
        assert(e.message.indexOf(expected_err_msg) > -1);
        done();
      }
    });
    it('should (Mock) publish the message to the topic (using aws-sdk-mock)', function (done) {
      awsMock.mock('DynamoDB', 'putItem', 'item inserted');
      var params = {
        Item: {
          key: { S: 'string' },
          value: { S: 'string' }
        },
        TableName: 'my-awesome-table'
      };
      aws.DynamoDB.putItem(params, function (err, data) {
        assert(err === null);
        assert(data === 'item inserted');
        done();
      });
    });
  });
});
