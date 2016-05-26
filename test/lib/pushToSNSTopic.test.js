require('env2')('.env');
var SEARCH_RESULT_TOPIC = process.env.SEARCH_RESULT_TOPIC; // save this for later
var assert = require('assert');
var AwsHelper = require('./../../lib/index');

describe('pushToSNSTopic', function () {

  it('push without topic (error branch test)', function (done) {
    delete process.env.SEARCH_RESULT_TOPIC;
    var params = { hello: 'world' };
    AwsHelper.pushToSNSTopic(params, function (err, data) {
      var errmsg = 'Error: SEARCH_RESULT_TOPIC is not defined';
      assert.equal(err.toString(), errmsg,
        'Error thrown (as expected)');
      done();
    });
  });

  after('restore the SEARCH_RESULT_TOPIC environment variable', function (done) {
    process.env.SEARCH_RESULT_TOPIC = SEARCH_RESULT_TOPIC;
    done();
  });
});
