'use strict';

var assert = require('assert');
var AwsHelper = require('./../../lib/index');
var simple = require('simple-mock');

describe('AwsHelper.DynamoDB', function () {
  describe('AwsHelper.DynamoDB.putItem', function () {
    afterEach(function () {
      simple.restore();
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
  describe('AwsHelper.DynamoDB.query', function () {
    it('should append the environment to the table name', function (done) {
      var context = {
        'invokedFunctionArn': 'arn:aws:lambda:eu-west-1:123456789:function:aws-canary-lambda:ci'
      };
      AwsHelper.init(context);
      AwsHelper._DynamoDB = new AwsHelper._AWS.DynamoDB();
      var mock = simple.mock(AwsHelper._DynamoDB, 'query');
      AwsHelper.DynamoDB.query({TableName: 'name'});
      assert.equal(mock.firstCall.arg.TableName, 'name-ci');
      done();
    });
  });
  describe('AwsHelper.DynamoDB.batchGetItem', function () {
    it('should append the environment to the table name', function (done) {
      var context = {
        'invokedFunctionArn': 'arn:aws:lambda:eu-west-1:123456789:function:aws-canary-lambda:ci'
      };
      AwsHelper.init(context);

      var incoming_params = {
        RequestItems: {
          table1: { name: 'table1' },
          table2: { name: 'table2' }
        }
      };

      var expected_params = {
        RequestItems: {
          'table1-ci': { name: 'table1' },
          'table2-ci': { name: 'table2' }
        }
      };

      AwsHelper._DynamoDB = new AwsHelper._AWS.DynamoDB();
      var mock = simple.mock(AwsHelper._DynamoDB, 'batchGetItem');
      AwsHelper.DynamoDB.batchGetItem(incoming_params);
      assert.deepEqual(mock.firstCall.arg, expected_params);
      done();
    });
  });
});
