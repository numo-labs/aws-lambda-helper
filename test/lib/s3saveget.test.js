require('env2')('.env');
var assert = require('assert');
var request = require('wreck');
var AwsHelper = require('./../../lib/index');

var PARAMS = {
  id: Math.floor(Math.random() * 10000000),
  bucketId: 'testBucket',
  name: 'My Amazing Hotel',
  connectionId: 'test1234',
  userId: 'TESTUSERID',
  items: [
    {type: 'package', id: 0, title: 'my amazing hotel', url: 'test/test/12345'},
    {type: 'tile', id: 1, title: 'my lovely resort', url: 'test/test/45678'}
  ]
};

describe('saveRecordToS3', function () {
  it('saves a search result tile/package to S3', function (done) {
    AwsHelper.init({
      invokedFunctionArn: process.env.INVOKED_FUNCTION_ARN
    });
    AwsHelper.saveRecordToS3(PARAMS, function (err, data) {
      assert(!err, 'No Errror Saving the Record');
      // console.log('S3 >>', err, data);
      request.get(data.Location.toString(), function (err, data, payload) {
        // console.log(err,  payload.toString());
        var json = JSON.parse(payload.toString());
        assert(!err, 'No Errror retrieving the Record');
        assert(json.id === PARAMS.items[json.id].id, 'record Successfully saved to S3');
        done();
      });
    });
  });
});

describe('getRecordFromS3', function () {
  it('retrieves a search result tile/package from S3', function (done) {
    AwsHelper.init({
      invokedFunctionArn: 'arn:aws:lambda:eu-west-1:123456789:function:mylambda:ci'
    });
    var params = JSON.parse(JSON.stringify(PARAMS));
    var url = params.userId + '/' + params.connectionId + '/' +
      params.bucketId + '/' + params.items[0].id;
    AwsHelper.getRecordFromS3(url, function (err, data) {
      assert(!err, 'No Errror Retrieving the Record');
      done();
    });
  });
});
