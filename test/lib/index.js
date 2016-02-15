'use strict';

import assert from 'assert';
import helper from '../../lib';
import payloadSchema from '../fixtures/validationSchema';

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
