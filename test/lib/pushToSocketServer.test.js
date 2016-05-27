// this test needs to run *FIRST* for some reason ... any help figuring out why much appreciated.
require('env2')('.env');
var assert = require('assert');
var AwsHelper = require('./../../lib/index');

describe('pushToSocketServer', function () {
  before('Connect to WebSocket Server', function (done) {
    AwsHelper.init({
      invokedFunctionArn: 'arn:aws:lambda:eu-west-1:847002989232:function:lambda-ne-classic-package-provider-v1'
    });
    done();
  });

  it('Send result to Client *AND* Save to S3', function (done) {
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
      // assert(!err);
      console.log(err);
      assert.equal(res.Key, 'ci/' + params.items[0].url + '.json');
      done();
    });
  });

  it('Send result to Client *AND* Save to S3 (no SNS Topic)', function (done) {
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
});
