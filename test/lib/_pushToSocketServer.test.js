// this test needs to run *FIRST* for some reason ... any help figuring out why much appreciated.
require('env2')('.env');
var assert = require('assert');
var AwsHelper = require('./../../lib/index');

var Primus = require('primus');
var Socket = Primus.createSocket({ transformer: 'engine.io', parser: 'JSON' });
var client = new Socket('http://' + process.env.WEBSOCKET_SERVER_URL);
var CLIENT_ID;

describe('pushToSocketServer', function () {
  it('Connect to WebSocket Server', function (done) {
    console.log('Attempting to connect to WebSocket Server ...', client.socket.transports);
    client.on('data', function received (data) {
      // console.log(typeof data, JSON.stringify(data, null, 2));
      if (data.connection) {
        console.log('Successfully Connected to Primus (WebSocket) Endpoint!');
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
      userId: 'UniqueFingerprint',
      items: [{'hello': 'world'}]
    };
    AwsHelper.pushToSocketServer(params, function (err, res) {
      // console.log(err, res);
      assert.equal(res, 200);
      assert(!err);
      done();
    });
  });

  it('Send Array of result items to client', function (done) {
    var params = {
      id: CLIENT_ID,
      searchId: 12345,
      userId: 'UniqueFingerprint',
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
      id: CLIENT_ID,
      searchId: 12345,
      userId: 'UniqueFingerprint',
      items: [
        {hello: 'world', title: 'amazing holiday'},
        {title: 'Sandy Beach with Fresh Coconuts'},
        {title: 'Paradise Isle'}
      ]
    };
    AwsHelper.pushResult(params, function (err, res) {
      console.log(err, res);
      // assert.equal(res, 200);
      assert(!err);
      client.end();
      done();
    });
  });
});
