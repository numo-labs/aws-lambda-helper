'use strict';

var assert = require('assert');
var AwsHelper = require('./../../lib/index');
var interceptStdout = require('intercept-stdout');

describe('AwsHelper.Logger', function () {
  it('should accept a parameter which is optional with no value', function (done) {
    var context = {
      'functionName': 'aws-canary-lambda',
      'invokedFunctionArn': 'arn:aws:lambda:eu-west-1:123456789:function:aws-canary-lambda:prod'
    };
    AwsHelper.init(context);
    var logger = AwsHelper.Logger();
    assert.equal(logger.fields.tags.length, 0);
    done();
  });

  it('should accept a parameter which is optional with a value', function (done) {
    var context = {
      'functionName': 'aws-canary-lambda',
      'invokedFunctionArn': 'arn:aws:lambda:eu-west-1:123456789:function:aws-canary-lambda:prod'
    };
    AwsHelper.init(context);
    var logger = AwsHelper.Logger('hello');
    assert.equal(logger.fields.tags, 'hello');
    done();
  });

  describe('AwsHelper.Logger#info', function () {
    it('should log a json message', function (done) {
      var context = {
        'functionName': 'aws-canary-lambda',
        'invokedFunctionArn': 'arn:aws:lambda:eu-west-1:123456789:function:aws-canary-lambda:prod'
      };
      AwsHelper.init(context, { headers: { 'trace-request-id': 'an id' } });
      var logger = AwsHelper.Logger(['stdout', 'test']);
      var stdout = '';
      var unhook = interceptStdout(function (text) {
        stdout += text;
      });
      logger.info('hello in stdout');
      setImmediate(function () {
        unhook();
        var json = JSON.parse(stdout);
        assert.equal(json.msg, 'hello in stdout');
        done();
      });
    });

    it('should log a json message with traceable_id', function (done) {
      var context = {
        'functionName': 'aws-canary-lambda',
        'invokedFunctionArn': 'arn:aws:lambda:eu-west-1:123456789:function:aws-canary-lambda:prod'
      };
      AwsHelper.init(context, { headers: { 'trace-request-id': 'an id' } });
      var logger = AwsHelper.Logger(['stdout', 'test']);
      var stdout = '';
      var unhook = interceptStdout(function (text) {
        stdout += text;
      });
      logger.info('hello in stdout');
      setImmediate(function () {
        unhook();
        var json = JSON.parse(stdout);
        assert.equal(json.traceable_id, 'an id');
        done();
      });
    });

    it('should log a json message with traceable_id', function (done) {
      var context = {
        'functionName': 'aws-canary-lambda',
        'invokedFunctionArn': 'arn:aws:lambda:eu-west-1:123456789:function:aws-canary-lambda:prod'
      };
      AwsHelper.init(context, {
        Records: [
          {
            Sns: {
              MessageAttributes: {
                'trace-request-id': {
                  Value: 'an id'
                }
              }
            }
          }
        ]
      });
      var logger = AwsHelper.Logger(['stdout', 'test']);
      var stdout = '';
      var unhook = interceptStdout(function (text) {
        stdout += text;
      });
      logger.info('hello in stdout');
      setImmediate(function () {
        unhook();
        var json = JSON.parse(stdout);
        assert.equal(json.traceable_id, 'an id');
        done();
      });
    });
  });
});
