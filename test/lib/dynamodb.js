'use strict';

var assert = require('assert');
var AwsHelper = require('./../../lib/index');
var simple = require('simple-mock');

describe('AwsHelper.DynamoDB', function () {
  describe('AwsHelper.DynamoDB.putItem', function () {
    afterEach(function () {
      simple.restore();
    });

    it('should throw an error if the params.TableName is not set', function (done) {
      try {
        var context = {
          'invokedFunctionArn': 'arn:aws:lambda:eu-west-1:123456789:function:aws-canary-lambda:prod'
        };
        AwsHelper.init(context);
        AwsHelper.DynamoDB.putItem();
      } catch (e) {
        console.log(e);  //TODO remove?
        var expected_err_msg = 'params.TableName is required';
        assert(e.message.indexOf(expected_err_msg) > -1);
        done();
      }
    });

    it('should create a DynamoDB object when not initiated', function (done) {
      var context = {
        'invokedFunctionArn': 'arn:aws:lambda:eu-west-1:123456789:function:aws-canary-lambda:prod'
      };
      AwsHelper.init(context);
      AwsHelper._initDynamoDBObject();
      assert(AwsHelper._DynamoDB != null);
      done();
    });

    it('should (Mock) putItem the message to the DynamoDB Table (using mock)', function (done) {
      var context = {
        'invokedFunctionArn': 'arn:aws:lambda:eu-west-1:123456789:function:aws-canary-lambda:prod'
      };
      AwsHelper.init(context);
      AwsHelper._DynamoDB = new AwsHelper._AWS.DynamoDB();

      // stub the SNS.publish function
      simple.mock(AwsHelper._DynamoDB, 'putItem').callFn(function (params, cb) {
        var p = {
          TableName: 'mock-table-name-prod',
          Item: {}
        };
        assert.deepEqual(p, params);
        return cb(null, {Items: []});
      });

      var params = {
        TableName: 'mock-table-name',
        Item: {}
      };

      AwsHelper.DynamoDB.putItem(params, function (err, data) {
        assert(err === null);
        assert(data.Items != null);
        done();
      });
    });

    it('should (Mock) putItem the message to the DynamoDB Table (using mock)', function (done) {
      var context = {
        'invokedFunctionArn': 'arn:aws:lambda:eu-west-1:123456789:function:aws-canary-lambda:prod'
      };
      AwsHelper.init(context);
      AwsHelper._DynamoDB = new AwsHelper._AWS.DynamoDB();

      // stub the SNS.publish function
      simple.mock(AwsHelper._DynamoDB, 'putItem').callFn(function (params, cb) {
        var p = {
          TableName: 'mock-table-name-prod',
          Item: {}
        };
        assert.deepEqual(p, params);
        return cb(null, {Items: []});
      });

      var params = {
        TableName: 'mock-table-name',
        Item: {}
      };

      AwsHelper.DynamoDB.putItem(params, function (err, data) {
        assert(err === null);
        assert(data.Items != null);
        done();
      });
    });
  });
});
