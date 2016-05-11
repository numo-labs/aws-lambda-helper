'use strict';

var assert = require('assert');
var AwsHelper = require('./../../lib/index');
var simple = require('simple-mock');

describe('AwsHelper.SNS', function () {
  describe('AwsHelper.SNS.Publish', function () {
    afterEach(function () {
      simple.restore();
    });

    it('should throw an error if the params.TopicArn is not set', function (done) {
      try {
        var context = {
          'invokedFunctionArn': 'arn:aws:lambda:eu-west-1:123456789:function:aws-canary-lambda:prod'
        };
        AwsHelper.init(context);
        AwsHelper.SNS.publish();
      } catch (e) {
        var expected_err_msg = 'params.TopicArn is required';
        assert(e.message.indexOf(expected_err_msg) > -1);
        done();
      }
    });

    it('should create a SNS object when not initiated', function (done) {
      var context = {
        'invokedFunctionArn': 'arn:aws:lambda:eu-west-1:123456789:function:aws-canary-lambda:prod'
      };
      AwsHelper.init(context);
      AwsHelper._initSNSObject();
      assert(AwsHelper._SNS != null);
      done();
    });

    it('should (Mock) publish the message to the topic (using mock)', function (done) {
      var context = {
        'invokedFunctionArn': 'arn:aws:lambda:eu-west-1:123456789:function:aws-canary-lambda:prod'
      };
      AwsHelper.init(context);
      AwsHelper._SNS = new AwsHelper._AWS.SNS();

      // stub the SNS.publish function
      simple.mock(AwsHelper._SNS, 'publish').callFn(function (params, cb) {
        var topic = 'arn:aws:sns:eu-west-1:123456789:my-awesome-topic-prod';
        var p = {
          Message: params.Message,
          MessageStructure: 'json',
          TopicArn: topic
        };

        assert.deepEqual(p, params);
        cb(null, {MessageId: 'mock-message-id'});
      });

      var params = {
        Message: JSON.stringify({name: 'name'}),
        TopicArn: 'arn:aws:sns:eu-west-1:123456789:my-awesome-topic-prod'
      };
      AwsHelper.SNS.publish(params, function (err, data) {
        assert(err === null);
        assert(data.MessageId === 'mock-message-id');
        done();
      });
    });

    it('should (Mock) publish the message to the topic with only a topicName (using mock)', function (done) {
      var context = {
        'invokedFunctionArn': 'arn:aws:lambda:eu-west-1:123456789:function:aws-canary-lambda:prod'
      };
      AwsHelper.init(context);
      AwsHelper._SNS = new AwsHelper._AWS.SNS();

      // stub the SNS.publish function
      simple.mock(AwsHelper._SNS, 'publish').callFn(function (params, cb) {
        var topic = 'arn:aws:sns:eu-west-1:123456789:my-awesome-topic-prod';
        var p = {
          Message: params.Message,
          MessageStructure: 'json',
          TopicArn: topic
        };

        assert.deepEqual(p, params);
        cb(null, {MessageId: 'mock-message-id'});
      });

      var params = {
        Message: JSON.stringify({name: 'name'}),
        TopicArn: 'my-awesome-topic'
      };
      AwsHelper.SNS.publish(params, function (err, data) {
        assert(err === null);
        assert(data.MessageId === 'mock-message-id');
        done();
      });
    });

    it('should (Mock) publish the message to the topic (using mock) with a traceable id', function (done) {
      var context = {
        'invokedFunctionArn': 'arn:aws:lambda:eu-west-1:123456789:function:aws-canary-lambda:prod'
      };
      AwsHelper.init(context, { headers: { 'trace-request-id': 'an id' } });
      AwsHelper._SNS = new AwsHelper._AWS.SNS();

      // stub the SNS.publish function
      simple.mock(AwsHelper._SNS, 'publish').callFn(function (params, cb) {
        var topic = 'arn:aws:sns:eu-west-1:123456789:my-awesome-topic-prod';
        var p = {
          Message: JSON.stringify({
            default: JSON.stringify({
              name: 'name',
              headers: {
                'trace-request-id': 'an id'
              }
            })
          }),
          MessageStructure: 'json',
          TopicArn: topic,
          MessageAttributes: {
            'trace-request-id': {
              DataType: 'String',
              StringValue: 'an id'
            }
          }
        };
        assert.deepEqual(p, params);
        cb(null, {MessageId: 'mock-message-id'});
      });

      var params = {
        Message: JSON.stringify({default: JSON.stringify({name: 'name'})}),
        TopicArn: 'arn:aws:sns:eu-west-1:123456789:my-awesome-topic-prod'
      };
      AwsHelper.SNS.publish(params, function (err, data) {
        assert(err === null);
        assert(data.MessageId === 'mock-message-id');
        done();
      });
    });
  });
});
