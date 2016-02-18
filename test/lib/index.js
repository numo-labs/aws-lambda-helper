'use strict';

import assert from 'assert';
import helper from '../../lib';
import payloadSchema from '../fixtures/validationSchema';

describe('with callbacks', () => {
  describe('validateWithSchema', () => {
    it('should return error for invalid data', (done) => {
      const invalidData = {
        body: {
          docs: [{
            param1: 'value1',
            param2: ['123', '456'],
            param3: 'standard'
          }]
        }
      };

      helper.validateWithSchema(invalidData, payloadSchema, function (err, data) {
        assert.equal(err.message, 'Missing required property: param4');
        assert.equal(data, false);
        done();
      });
    });

    it('should not return error for valid data', (done) => {
      const validData = {
        body: {
          docs: [{
            param1: 'value1',
            param2: ['123', '456'],
            param3: 'standard',
            param4: 5
          }]
        }
      };

      helper.validateWithSchema(validData, payloadSchema, function (err, data) {
        assert.equal(err, null);
        assert.equal(data, true);
        done();
      });
    });
  });

  describe('getEnvironment', () => {
    it('should getEnvironment variable from context', (done) => {
      const context = {
        invokedFunctionArn: 'arn:123:abs:prod'
      };

      helper.getEnvironment(context, function (err, env) {
        assert.equal(err, null);
        assert.equal(env, 'prod');
        done();
      });
    });

    it('should return error if invokedFunctionArn not exist in context', (done) => {
      helper.getEnvironment({}, function (err, env) {
        assert.equal(err.message, 'Failed get invokedFunctionArn');
        assert.equal(env, undefined);
        done();
      });
    });

    it('should return error if evn not exist in invokedFunctionArn', (done) => {
      const badContext = {
        invokedFunctionArn: 'arn_123abs_prod:'
      };

      helper.getEnvironment(badContext, function (err, env) {
        assert.equal(err.message, 'Could not find environment in invokedFunctionArn ' + badContext.invokedFunctionArn);
        assert.equal(env, undefined);
        done();
      });
    });
  });
});

describe('callback does not provided', () => {
  describe('validateWithSchema', () => {
    it('should return error for invalid data', (done) => {
      const invalidData = {
        body: {
          docs: [{
            param1: 'value1',
            param2: ['123', '456'],
            param3: 'standard'
          }]
        }
      };

      try {
        let result = helper.validateWithSchema(invalidData, payloadSchema);
        done(result);
      } catch (error) {
        assert.equal(error.message, 'Missing required property: param4');
        done();
      }
    });

    it('should not return error for valid data', (done) => {
      const validData = {
        body: {
          docs: [{
            param1: 'value1',
            param2: ['123', '456'],
            param3: 'standard',
            param4: 5
          }]
        }
      };

      let result = helper.validateWithSchema(validData, payloadSchema);
      assert.equal(result, true);
      done();
    });
  });

  describe('getEnvironment', () => {
    it('should getEnvironment variable from context', (done) => {
      const context = {
        invokedFunctionArn: 'arn:123:abs:prod'
      };

      let env = helper.getEnvironment(context);
      assert.equal(env, 'prod');
      done();
    });

    it('should return error if invokedFunctionArn not exist in context', (done) => {
      try {
        let env = helper.getEnvironment({});
        done(env);
      } catch (error) {
        assert.equal(error.message, 'Failed get invokedFunctionArn');
        done();
      }
    });

    it('should return error if evn not exist in invokedFunctionArn', (done) => {
      const badContext = {
        invokedFunctionArn: 'arn_123abs_prod:'
      };

      try {
        let env = helper.getEnvironment(badContext);
        done(env);
      } catch (error) {
        assert.equal(error.message, 'Could not find environment in invokedFunctionArn ' + badContext.invokedFunctionArn);
        done();
      }
    });
  });
});
