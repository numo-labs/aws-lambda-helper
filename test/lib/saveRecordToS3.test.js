require('env2')('.env');
// console.log(process.env);
var assert = require('assert');
var AwsHelper = require('./../../lib/index');

describe('saveRecordToS3', function () {
  it('saves a search result tile/package to S3', function (done) {
    AwsHelper.init({
      invokedFunctionArn: 'arn:aws:lambda:eu-west-1:123456789:function:mylambda:ci'
    });
    var params = {
      id: Math.floor(Math.random() * 10000000),
      name: 'My Amazing Hotel',
      sessionId: 'test1234',
      userId: 'ClientFingerprint',
      items: [{id: 12345, title: 'my amazing hotel'}]
    };
    AwsHelper.saveRecordToS3(params, function (err, data) {
      assert(!err, 'No Errror Saving the Record');
      var url = data.Location.replace('https://', '');
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
