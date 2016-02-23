'use strict';

import assert from 'assert';
import helper from '../../lib';
import payloadSchema from '../fixtures/validationSchema';

describe('AWS Lambda helper', () => {
  describe('validateWithSchema', () => {
    it('should throw error for invalid data', (done) => {
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

    it('should return true for valid data', (done) => {
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
    it('should get environment variable from context', (done) => {
      const context = {
        invokedFunctionArn: 'arn:123:abs:prod'
      };

      let env = helper.getEnvironment(context);
      assert.equal(env, 'prod');
      done();
    });

    it('should return null if invokedFunctionArn does not exist in context', (done) => {
      let env = helper.getEnvironment({});

      assert.equal(env, null);
      done();
    });

    it('should return null if evn does not exist in invokedFunctionArn', (done) => {
      const badContext = {
        invokedFunctionArn: 'arn_123abs_prod:'
      };

      let env = helper.getEnvironment(badContext);

      assert.equal(env, null);
      done();
    });
  });
});
