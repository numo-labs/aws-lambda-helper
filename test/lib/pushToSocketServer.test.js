// this test needs to run *FIRST* for some reason ... any help figuring out why much appreciated.
require('env2')('.env');
var assert = require('assert');
var AwsHelper = require('./../../lib/index');

var Primus = require('primus');
var CLIENT_ID;
var ONCE = false;
var client;

describe('pushToSocketServer', function () {
  before('Connect to WebSocket Server', function (done) {
    var Socket = Primus.createSocket({ transformer: 'engine.io', parser: 'JSON' });
    client = new Socket('http://' + process.env.WEBSOCKET_SERVER_URL);

    AwsHelper.init({
      invokedFunctionArn: 'arn:aws:lambda:eu-west-1:123456789:function:mylambda:ci'
    });

    client.on('data', function received (data) {
      console.log('data received (via websocket):', JSON.stringify(data, null, 2));
      if (data.connection && !ONCE) {
        console.log('Successfully Connected to Primus (WebSocket) Endpoint!');
        ONCE = true;
        CLIENT_ID = data.connection;
        assert(CLIENT_ID.length > 10);
        done();
      }
    });
  });

  it('Get WebSocket Client Id from WebSocket Server', function (done) {
    // this assert will be called when we *receive* data back over Socket!
    client.on('data', function received (data) {
      assert(data.graphql.items[0].hello === 'world');
    });
    var params = {
      id: CLIENT_ID,
      searchId: 12345,
      userId: 'TESTUSERID',
      items: [{'hello': 'world'}]
    };
    AwsHelper.pushToSocketServer(params, function (err, res) {
      assert.equal(res, 200);
      assert(!err);
      done();
    });
  });

  it('Send Array of result items to client', function (done) {
    var params = {
      id: CLIENT_ID,
      searchId: 12345,
      userId: 'TESTUSERID',
      items: [
        {hello: 'world', title: 'amazing holiday'},
        {title: 'Sandy Beach with Fresh Coconuts'},
        {title: 'Paradise Isle'}
      ]
    };
    AwsHelper.pushToSocketServer(params, function (err, res) {
      // console.log(err, res);
      assert.equal(res, 200);
      assert(!err);
      // client.end();
      done();
    });
  });

  it('Send result to Client *AND* Save to S3', function (done) {
    var params = {
      id: CLIENT_ID, // the session id from WebSocket Server
      searchId: 'ABC',
      userId: 'TESTUSERID',
      items: [
        {id: 123, hello: 'world', title: 'amazing holiday'},
        {id: 456, title: 'Sandy Beach with Fresh Coconuts'},
        {id: 789, title: 'Paradise Isle'}
      ]
    };
    AwsHelper.pushResultToClient(params, function (err, res) {
      console.log(err, res);
      assert(!err);
      // assert.equal(res, 200);
      done();
    });
  });

  it('Send result to Client *AND* Save to S3 (no SNS Topic)', function (done) {
    var params = {
      id: CLIENT_ID, // the session id from WebSocket Server
      searchId: 'ABC',
      userId: 'TESTUSERID',
      items: [
        {id: 123, hello: 'world', title: 'amazing holiday'},
        {id: 456, title: 'Sandy Beach with Fresh Coconuts'},
        {id: 789, title: 'Paradise Isle'}
      ]
    };
    AwsHelper.pushResultToClient(params, function (err, res) {
      console.log(err, res);
      assert(!err);
      // assert.equal(res, 200);
      done();
    });
  });

  it('Attempt to pushResultToClient with invalid id', function (done) {
    var params = {
      // id: 'invalid', // the session id from WebSocket Server
      searchId: 'TEST',
      userId: 'TESTUSERID',
      items: [
        {id: 123, hello: 'world', title: 'amazing holiday'}
      ]
    };
    AwsHelper.pushResultToClient(params, function (err, res) {
      // console.log(' -->', err, res);
      assert.equal(err, 400, 'Got 400 Error (as expected)');
      done();
    });
  });

  after('Shut down the Primus connection', function (done) {
    client.end();
    done();
  });
});
