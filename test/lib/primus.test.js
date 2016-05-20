require('env2')('.env');
var assert = require('assert');
var Primus = require('primus');
var Socket = Primus.createSocket({ transformer: 'engine.io', parser: 'JSON' });
var client = new Socket(process.env.WEBSOCKET_SERVER_URL);
var CLIENT_ID;
client.on('data', function received (data) {
  // console.log(data, typeof data);
  console.log('Successfully Connected to Primus (WebSocket) Endpoint!');
  CLIENT_ID = data.connection;
  client.end();
  // console.log(CLIENT_ID);
  assert(CLIENT_ID.length > 10);
});
