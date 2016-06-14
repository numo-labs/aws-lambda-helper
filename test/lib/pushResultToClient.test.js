// this test needs to run *FIRST* for some reason ... any help figuring out why much appreciated.
require('env2')('.env');
const assert = require('assert');
const simple = require('simple-mock');
const AWS = require('aws-sdk');
const AwsHelper = require('./../../lib/index');

describe('pushResultToClient', function () {
  before('Connect to WebSocket Server', function (done) {
    AwsHelper.init({
      invokedFunctionArn: process.env.INVOKED_FUNCTION_ARN
    });
    done();
  });
  beforeEach(() => {
    simple.mock(AWS.S3.prototype, 'upload').callbackWith();
    simple.mock(AWS.SNS.prototype, 'publish').callbackWith();
  });
  afterEach(() => {
    simple.restore();
  });

  it('publishes results to SNS', (done) => {
    var params = {
      id: 'dummyConnectionId', // the session id from WebSocket Server
      searchId: 'ABC',
      userId: 'TESTUSERID',
      items: [
        {
          type: 'package', id: 123, hello: 'world', title: 'amazing holiday',
          url: 'userId/connectionId/bucketId/123'
        },
        {
          type: 'package', id: 456, hello: 'world', title: 'not amazing holiday',
          url: 'userId/connectionId/bucketId/456'
        }
      ]
    };
    const expected = JSON.stringify({
      default: JSON.stringify(params)
    });
    AwsHelper.pushResultToClient(params, function (err) {
      assert(!err);
      assert.equal(AWS.SNS.prototype.publish.callCount, 1);
      assert.equal(AWS.SNS.prototype.publish.calls[0].args[0].Message, expected);
      done();
    });
  });

  it('saves items to S3', function (done) {
    var params = {
      id: 'dummyConnectionId', // the session id from WebSocket Server
      searchId: 'ABC',
      userId: 'TESTUSERID',
      items: [
        {
          type: 'package', id: 123, hello: 'world', title: 'amazing holiday',
          url: 'userId/connectionId/bucketId/123'
        },
        {
          type: 'package', id: 456, hello: 'world', title: 'not amazing holiday',
          url: 'userId/connectionId/bucketId/456'
        }
      ]
    };
    AwsHelper.pushResultToClient(params, function (err) {
      assert(!err);
      assert.equal(AWS.S3.prototype.upload.callCount, 2);
      assert.equal(AWS.S3.prototype.upload.calls[0].args[0].Body, JSON.stringify(params.items[0]));
      assert.equal(AWS.S3.prototype.upload.calls[1].args[0].Body, JSON.stringify(params.items[1]));
      done();
    });
  });

  it('does not save items with types other than "packge" or "tile" to S3', function (done) {
    var params = {
      id: 'dummyConnectionId', // the session id from WebSocket Server
      searchId: 'ABC',
      userId: 'TESTUSERID',
      items: [
        {
          type: 'package', id: 123, hello: 'world', title: 'amazing holiday',
          url: 'userId/connectionId/bucketId/123'
        },
        {
          type: 'tile', id: 456, hello: 'world', title: 'amazing holiday',
          url: 'userId/connectionId/bucketId/123'
        },
        {
          type: 'filter', id: 789, hello: 'world', title: 'not amazing holiday'
        }
      ]
    };
    AwsHelper.pushResultToClient(params, function (err, res) {
      assert(!err);
      assert.equal(AWS.S3.prototype.upload.callCount, 2);
      assert.equal(AWS.S3.prototype.upload.calls[0].args[0].Body, JSON.stringify(params.items[0]));
      assert.equal(AWS.S3.prototype.upload.calls[1].args[0].Body, JSON.stringify(params.items[1]));
      done();
    });
  });

  it('skips saving to s3 if no items have url properties', function (done) {
    var params = {
      id: 'dummyConnectionId', // the session id from WebSocket Server
      searchId: 'ABC',
      userId: 'TESTUSERID',
      items: [
        {
          id: 456, hello: 'world', title: 'not amazing holiday'
        }
      ]
    };
    AwsHelper.pushResultToClient(params, function (err, res) {
      assert(err);
      assert.equal(AWS.S3.prototype.upload.callCount, 0);
      done();
    });
  });

  it('throws an error if SNS topic is not defined', function (done) {
    delete process.env.SEARCH_RESULT_TOPIC;
    var params = {
      id: 'dummyConnectionId', // the session id from WebSocket Server
      searchId: 'ABC',
      userId: 'TESTUSERID',
      items: [{
        id: 123, hello: 'world', title: 'amazing holiday',
        url: 'userId/connectionId/bucketId/123'
      }]
    };
    AwsHelper.pushResultToClient(params, function (err, res) {
      // console.log(err, res);
      var errmsg = 'Error: SEARCH_RESULT_TOPIC is not defined';
      assert.equal(err.toString(), errmsg,
        'Error thrown (as expected)');
      // restore the environment variable for other tests:
      process.env.SEARCH_RESULT_TOPIC = 'search-results-v1';
      done();
    });
  });

  it('calls back with error if no id property is present on the params', (done) => {
    var params = {
      searchId: 'ABC',
      userId: 'TESTUSERID',
      items: [{
        id: 123, hello: 'world', title: 'amazing holiday',
        url: 'userId/connectionId/bucketId/123'
      }]
    };
    AwsHelper.pushResultToClient(params, function (err, res) {
      assert(err);
      done();
    });
  });
});
