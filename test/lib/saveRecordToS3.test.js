require('env2')('.env');
// console.log(process.env);
var assert = require('assert');
var AwsHelper = require('./../../lib/index');

describe('saveRecordToS3', function () {
  it('saves a search result tile/package to S3', function (done) {
    AwsHelper.init({
      invokedFunctionArn: 'arn:aws:lambda:eu-west-1:123456789:function:mylambda:ci'
    });
    var json = {
      id: Math.floor(Math.random() * 10000000),
      name: 'My Amazing Hotel'
    }
    var sessionId = 'test1234';
    AwsHelper.saveRecordToS3(sessionId, json, function (err, data) {
      assert(!err, 'No Errror Saving the Record');
      var url = data.Location.replace('https://', '');
      var params = {
        host: url.split('/')[0],
        path: url.split('.com')[1]
      }
      AwsHelper.httpRequest(params, function (err, data) {
        // console.log(err, data);
        assert.equal(data.id, json.id, 'record Successfully saved to S3');
        done();
      });
    });
  });
});
