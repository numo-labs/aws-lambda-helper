require('env2')('.env');
// console.log(process.env);
var assert = require('assert');
// var s3 = require('./../../lib/s3saveget.js');
var AwsHelper = require('./../../lib/index');

var params = {
  id: Math.floor(Math.random() * 10000000),
  name: 'My Amazing Hotel',
  sessionId: 'test1234',
  userId: 'TESTUSERID',
  items: [{id: 12345, title: 'my amazing hotel'}]
};

describe('saveRecordToS3', function () {
  it('saves a search result tile/package to S3', function (done) {
    AwsHelper.init({
      invokedFunctionArn: 'arn:aws:lambda:eu-west-1:123456789:function:mylambda:ci'
    });
    AwsHelper.saveRecordToS3(params, function (err, data) {
      assert(!err, 'No Errror Saving the Record');
      var url = data.Location.replace('https://', '');
      console.log(url);
      var httpParams = {
        host: url.split('/')[0],
        path: url.split('.com')[1]
      };
      AwsHelper.httpRequest(httpParams, function (err, data) {
        assert(!err, 'No Errror retrieving the Record');
        assert.equal(data.id, params.items[0].id, 'record Successfully saved to S3');
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
    var getparams = JSON.parse(JSON.stringify(params));
    getparams.itemId = params.items[0].id;
    getparams.sessionId = params.id;
    AwsHelper.getRecordFromS3(getparams, function (err, data) {
      assert(!err, 'No Errror Retrieving the Record');
      done();
    });
  });
});