require('env2')('.env');
const SEARCH_RESULT_TOPIC = process.env.SEARCH_RESULT_TOPIC; // save this for later
const assert = require('assert');
const simple = require('simple-mock');
const AwsHelper = require('./../../lib/index');

describe('pushToSNSTopic', function () {

  after('restore the SEARCH_RESULT_TOPIC environment variable', () => {
    process.env.SEARCH_RESULT_TOPIC = SEARCH_RESULT_TOPIC;
  });

  describe('with envvar set', () => {

    before(() => {
      process.env.SEARCH_RESULT_TOPIC = 'search-results-v1';
    });

    beforeEach(() => {
      simple.mock(AwsHelper.SNS, 'publish').callbackWith(null);
    });

    afterEach(() => {
      simple.restore();
    });

    it('calls through to SNS.publish', (done) => {
      var params = { hello: 'world' };
      AwsHelper.pushToSNSTopic(params, function (err, data) {
        assert(AwsHelper.SNS.publish.called);
        const body = AwsHelper.SNS.publish.lastCall.args[0];
        assert.equal(body.Message, JSON.stringify({ default: JSON.stringify(params) }));
        done();
      });
    });

    it('sets the Message property of the publish parameters to a JSON string of an object with "default" property', (done) => {
      var params = { hello: 'world' };
      AwsHelper.pushToSNSTopic(params, function (err, data) {
        const body = AwsHelper.SNS.publish.lastCall.args[0];
        assert.equal(typeof body.Message, 'string');
        assert(JSON.parse(body.Message).default);
        done();
      });
    });

    it('sets the default property of the message to a JSON string of the params', (done) => {
      var params = { hello: 'world' };
      AwsHelper.pushToSNSTopic(params, function (err, data) {
        const body = JSON.parse(AwsHelper.SNS.publish.lastCall.args[0].Message).default;
        assert.deepEqual(JSON.parse(body), params);
        done();
      });
    });

    it('sets the topic property of the message to the SEARCH_RESULT_TOPIC', (done) => {
      var params = { hello: 'world' };
      AwsHelper.pushToSNSTopic(params, function (err, data) {
        const body = AwsHelper.SNS.publish.lastCall.args[0];
        assert.equal(body.TopicArn, 'search-results-v1');
        done();
      });
    });

  });

  describe('without envvar set', () => {

    before(() => {
      delete process.env.SEARCH_RESULT_TOPIC;
    });

    it('push without topic (error branch test)', (done) => {
      var params = { hello: 'world' };
      AwsHelper.pushToSNSTopic(params, function (err, data) {
        var errmsg = 'Error: SEARCH_RESULT_TOPIC is not defined';
        assert.equal(err.toString(), errmsg,
          'Error thrown (as expected)');
        done();
      });
    });

  });
});
